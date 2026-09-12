const { db } = require('../config/db');

const onlineUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', async (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        
        await db
          .from('users')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', userId);

        io.emit('user:status', { userId, isOnline: true });
        console.log(`👤 User ${userId} is online`);
      }
    });

    // Join a chat room
    socket.on('chat:join', (roomId) => {
      socket.join(roomId);
      console.log(`💬 Socket ${socket.id} joined room: ${roomId}`);
    });

    // Leave a chat room
    socket.on('chat:leave', (roomId) => {
      socket.leave(roomId);
    });

    // Send a message
    socket.on('chat:message', async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        const roomId = [senderId, receiverId].sort().join('_');

        // Save message to database
        const { data: newMsg, error: msgErr } = await db
          .from('messages')
          .insert([{
            sender_id: senderId,
            receiver_id: receiverId,
            room_id: roomId,
            message: content,
            is_read: false
          }])
          .select()
          .single();

        if (msgErr || !newMsg) {
          throw new Error(msgErr?.message || 'Failed to save message');
        }

        // Fetch sender and receiver profiles for Socket emit
        const { data: sender } = await db
          .from('users')
          .select('id, full_name, profile_image')
          .eq('id', senderId)
          .single();

        const { data: receiver } = await db
          .from('users')
          .select('id, full_name, profile_image')
          .eq('id', receiverId)
          .single();

        const populated = {
          _id: newMsg.id,
          id: newMsg.id,
          content: newMsg.message,
          room: newMsg.room_id,
          isRead: newMsg.is_read,
          createdAt: newMsg.created_at,
          sender: sender ? {
            _id: sender.id,
            id: sender.id,
            name: sender.full_name,
            avatar: sender.profile_image
          } : null,
          receiver: receiver ? {
            _id: receiver.id,
            id: receiver.id,
            name: receiver.full_name,
            avatar: receiver.profile_image
          } : null
        };

        // Emit to room
        io.to(roomId).emit('chat:message', populated);

        // Notify receiver if not in room
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('notification:new', {
            type: 'new_message',
            title: 'New Message',
            message: `${sender?.full_name || 'Someone'} sent you a message`,
            data: { roomId, senderId },
          });
        }
      } catch (error) {
        socket.emit('chat:error', { message: 'Failed to send message' });
        console.error('Socket message error:', error);
      }
    });

    // Typing indicator
    socket.on('chat:typing', ({ roomId, userId, isTyping }) => {
      socket.to(roomId).emit('chat:typing', { userId, isTyping });
    });

    // Mark messages as read
    socket.on('chat:read', async ({ roomId, userId }) => {
      try {
        await db
          .from('messages')
          .update({ is_read: true })
          .eq('room_id', roomId)
          .eq('receiver_id', userId)
          .eq('is_read', false);

        socket.to(roomId).emit('chat:read', { roomId, userId });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Real-time notification
    socket.on('notification:send', ({ recipientId, notification }) => {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification:new', notification);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        await db
          .from('users')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('id', socket.userId);

        io.emit('user:status', { userId: socket.userId, isOnline: false });
      }
    });
  });

  return io;
};

module.exports = socketHandler;
