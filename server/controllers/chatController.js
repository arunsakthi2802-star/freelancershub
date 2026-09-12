const asyncHandler = require('express-async-handler');
const { db } = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

// @desc    Get conversations list for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get all messages involving this user, ordered by creation date
  const { data: allMessages, error } = await db
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  // Group latest message per room and count unread
  const conversationsMap = {};
  (allMessages || []).forEach((msg) => {
    const roomId = msg.room_id;
    if (!conversationsMap[roomId]) {
      conversationsMap[roomId] = {
        _id: roomId,
        lastMessage: {
          _id: msg.id,
          id: msg.id,
          sender: msg.sender_id,
          receiver: msg.receiver_id,
          room: msg.room_id,
          content: msg.message,
          isRead: msg.is_read,
          createdAt: msg.created_at
        },
        unreadCount: 0
      };
    }
    // Increment unread count if recipient is current user
    if (!msg.is_read && msg.receiver_id === userId) {
      conversationsMap[roomId].unreadCount += 1;
    }
  });

  const conversations = Object.values(conversationsMap);

  // Populate other user info for each conversation
  const populated = await Promise.all(
    conversations.map(async (conv) => {
      const msg = conv.lastMessage;
      const otherUserId = msg.sender === userId ? msg.receiver : msg.sender;
      
      const { data: otherUser } = await db
        .from('users')
        .select('id, full_name, profile_image, is_online, last_seen, title')
        .eq('id', otherUserId)
        .maybeSingle();

      return {
        ...conv,
        otherUser: otherUser ? {
          _id: otherUser.id,
          id: otherUser.id,
          name: otherUser.full_name,
          avatar: otherUser.profile_image,
          isOnline: otherUser.is_online,
          lastSeen: otherUser.last_seen,
          title: otherUser.title
        } : null
      };
    })
  );

  successResponse(res, { conversations: populated });
});

// @desc    Get messages in a room
// @route   GET /api/chat/:roomId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Verify user is part of this room
  const [user1, user2] = roomId.split('_');
  if (user1 !== req.user.id && user2 !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this chat');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const end = skip + parseInt(limit) - 1;

  // Get total count
  const { count: total } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId);

  // Fetch messages join sender and receiver
  const { data: messages, error } = await db
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(id, full_name, profile_image),
      receiver:users!messages_receiver_id_fkey(id, full_name, profile_image)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(skip, end);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  // Mark messages as read
  await db
    .from('messages')
    .update({ is_read: true })
    .eq('room_id', roomId)
    .eq('receiver_id', req.user.id)
    .eq('is_read', false);

  const mappedMessages = (messages || []).map(m => ({
    _id: m.id,
    id: m.id,
    content: m.message,
    room: m.room_id,
    isRead: m.is_read,
    createdAt: m.created_at,
    sender: m.sender ? {
      _id: m.sender.id,
      id: m.sender.id,
      name: m.sender.full_name,
      avatar: m.sender.profile_image
    } : null,
    receiver: m.receiver ? {
      _id: m.receiver.id,
      id: m.receiver.id,
      name: m.receiver.full_name,
      avatar: m.receiver.profile_image
    } : null
  }));

  successResponse(res, { messages: mappedMessages.reverse(), total: total || 0, page: parseInt(page) });
});

// @desc    Send a message (REST fallback if socket unavailable)
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;

  const { data: receiver } = await db
    .from('users')
    .select('id, full_name, profile_image')
    .eq('id', receiverId)
    .single();

  if (!receiver) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  const ids = [req.user.id, receiverId].sort();
  const roomId = `${ids[0]}_${ids[1]}`;

  const { data: newMsg, error } = await db
    .from('messages')
    .insert([{
      sender_id: req.user.id,
      receiver_id: receiverId,
      room_id: roomId,
      message: content,
      is_read: false
    }])
    .select()
    .single();

  if (error || !newMsg) {
    res.status(500);
    throw new Error(error?.message || 'Failed to send message');
  }

  // Fetch sender profile details
  const { data: sender } = await db
    .from('users')
    .select('id, full_name, profile_image')
    .eq('id', req.user.id)
    .single();

  const populated = {
    _id: newMsg.id,
    id: newMsg.id,
    content: newMsg.message,
    room: newMsg.room_id,
    isRead: newMsg.is_read,
    createdAt: newMsg.created_at,
    sender: {
      _id: sender.id,
      id: sender.id,
      name: sender.full_name,
      avatar: sender.profile_image
    },
    receiver: {
      _id: receiver.id,
      id: receiver.id,
      name: receiver.full_name,
      avatar: receiver.profile_image
    }
  };

  const io = req.app.get('io');
  if (io) {
    io.to(roomId).emit('chat:message', populated);
  }

  successResponse(res, { message: populated }, 'Message sent', 201);
});

// @desc    Delete a message
// @route   DELETE /api/chat/:messageId
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  // Hard delete or clear content since it's a message deletion request
  const { error } = await db
    .from('messages')
    .delete()
    .eq('id', req.params.messageId)
    .eq('sender_id', req.user.id);

  if (error) {
    res.status(500);
    throw new Error('Message deletion failed');
  }

  successResponse(res, {}, 'Message deleted');
});

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const { count, error } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', req.user.id)
    .eq('is_read', false);

  if (error) {
    res.status(500);
    throw new Error(error.message);
  }

  successResponse(res, { count: count || 0 });
});

module.exports = { getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount };
