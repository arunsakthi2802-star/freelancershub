import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatService } from '../../services/chatService';
import { Send, Image, Paperclip, Smile, MessageSquare, Circle, ArrowLeft } from 'lucide-react';
import { getInitials, getAvatarUrl, formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ChatWindow({ dashboardPrefix }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(res.conversations || []);

      // If roomId in URL, find active conv details
      if (roomId) {
        const found = res.conversations.find((c) => c._id === roomId);
        if (found) {
          setActiveConv(found);
        } else {
          // It's a new room or not in list yet, let's load details manually if possible
          const [id1, id2] = roomId.split('_');
          const otherId = id1 === user._id ? id2 : id1;
          const otherUser = await chatService.getConversations().then(r => r.conversations.find(c => c.otherUser?._id === otherId)?.otherUser);
          if (otherUser) {
            setActiveConv({ _id: roomId, otherUser });
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  };

  // Load messages for active room
  const loadMessages = async () => {
    if (!roomId) return;
    setLoadingMsgs(true);
    try {
      const res = await chatService.getMessages(roomId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load message history');
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [roomId]);

  useEffect(() => {
    loadMessages();
    if (socket && roomId) {
      socket.joinRoom(roomId);
      // Mark read
      socket.markRead({ roomId, userId: user._id });

      // Listen for incoming messages
      const cleanupMsg = socket.on('chat:message', (newMsg) => {
        if (newMsg.room === roomId) {
          setMessages((prev) => [...prev, newMsg]);
          // Mark read
          socket.markRead({ roomId, userId: user._id });
        }
        // Reload conversations to update list snippets
        loadConversations();
      });

      // Listen for typing events
      const cleanupTyping = socket.on('chat:typing', (data) => {
        if (data.userId !== user._id) {
          setOtherUserTyping(data.isTyping);
        }
      });

      return () => {
        socket.leaveRoom(roomId);
        cleanupMsg();
        cleanupTyping();
      };
    }
  }, [roomId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activeConv) return;

    const receiverId = activeConv.otherUser._id;

    if (socket && socket.isConnected) {
      socket.sendMessage({
        senderId: user._id,
        receiverId,
        content: text.trim(),
      });
    } else {
      // Fallback API post
      chatService.sendMessage({
        receiverId,
        content: text.trim(),
      }).then((res) => {
        setMessages((prev) => [...prev, res.message]);
        loadConversations();
      }).catch((err) => {
        toast.error('Failed to deliver message');
      });
    }

    setText('');
    handleTypingStop();
  };

  const handleTypingStart = () => {
    if (!isTyping && socket && roomId) {
      setIsTyping(true);
      socket.sendTyping({ roomId, userId: user._id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleTypingStop, 2000);
  };

  const handleTypingStop = () => {
    if (isTyping && socket && roomId) {
      setIsTyping(false);
      socket.sendTyping({ roomId, userId: user._id, isTyping: false });
    }
  };

  const selectConversation = (conv) => {
    setActiveConv(conv);
    navigate(`${dashboardPrefix}/chat/${conv._id}`);
  };

  return (
    <div className="chat-container">
      {/* Sidebar List */}
      <div className={`chat-sidebar chat-sidebar-responsive ${roomId ? 'mobile-hide' : 'mobile-show-flex'}`}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-bold">Chats</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: 24, textAlign: 'center' }} className="spinner spinner-dark" />
          ) : conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No messages yet
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv._id === roomId;
              const hasUnread = conv.unreadCount > 0;
              return (
                <div
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99,102,241,0.06)' : undefined,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {getAvatarUrl(conv.otherUser?.avatar) ? (
                      <img src={getAvatarUrl(conv.otherUser.avatar)} className="avatar avatar-md" alt={conv.otherUser?.name} />
                    ) : (
                      <div className="avatar-placeholder avatar-md">{getInitials(conv.otherUser?.name)}</div>
                    )}
                    {conv.otherUser?.isOnline && (
                      <Circle size={10} style={{ fill: 'var(--color-success)', color: 'var(--color-success)', position: 'absolute', bottom: 0, right: 0 }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }} className="truncate">{conv.otherUser?.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(conv.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p style={{ fontSize: '0.8rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }} className="truncate">
                        {conv.lastMessage?.content}
                      </p>
                      {hasUnread && (
                        <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main message feed */}
      <div className={`chat-messages chat-messages-responsive ${roomId ? 'mobile-show-flex' : 'mobile-hide'}`}>
        {activeConv ? (
          <>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(dashboardPrefix + '/chat')}
                  className="btn btn-icon btn-ghost show-mobile"
                  style={{ padding: 4, marginRight: 4 }}
                  type="button"
                >
                  <ArrowLeft size={20} />
                </button>
                {getAvatarUrl(activeConv.otherUser?.avatar) ? (
                  <img src={getAvatarUrl(activeConv.otherUser.avatar)} className="avatar avatar-md" alt={activeConv.otherUser?.name} />
                ) : (
                  <div className="avatar-placeholder avatar-md">{getInitials(activeConv.otherUser?.name)}</div>
                )}
                <div>
                  <h4 style={{ fontWeight: 700 }}>{activeConv.otherUser?.name}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {activeConv.otherUser?.isOnline ? 'Active Now' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="messages-list">
              {loadingMsgs ? (
                <div className="spinner spinner-dark" style={{ alignSelf: 'center' }} />
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div key={msg._id || i} className={`message ${isOwn ? 'own' : ''}`}>
                      <div className="message-bubble">
                        {msg.content}
                        <div className="message-time" style={{ textAlign: isOwn ? 'right' : 'left' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {otherUserTyping && (
                <div className="message">
                  <div className="message-bubble" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form panel */}
            <form onSubmit={handleSend} className="chat-input-area">
              <input
                type="text"
                placeholder="Type your message here..."
                className="chat-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  handleTypingStart();
                }}
              />
              <button type="submit" className="btn btn-primary btn-icon" style={{ borderRadius: '50%' }}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ marginBottom: 16 }} />
            <h4>Select a Conversation to Start Messaging</h4>
          </div>
        )}
      </div>
    </div>
  );
}
