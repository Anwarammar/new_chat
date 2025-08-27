'use client';

import { useEffect, useState, useRef } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text';
}

interface ChatWindowProps {
  selectedUser?: User;
  currentUser: User;
}

export default function ChatWindow({ selectedUser, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      // Load messages from localStorage as backup
      const localMessages = localStorage.getItem(`messages-${currentUser.id}-${selectedUser.id}`);
      if (localMessages) {
        const parsed = JSON.parse(localMessages);
        setMessages(prev => {
          // Merge and deduplicate messages
          const combined = [...prev, ...parsed];
          const unique = combined.filter((msg, index, arr) => 
            arr.findIndex(m => m.id === msg.id) === index
          );
          return unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }
    }
  }, [selectedUser, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save messages to localStorage
    if (selectedUser && messages.length > 0) {
      localStorage.setItem(
        `messages-${currentUser.id}-${selectedUser.id}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, selectedUser, currentUser.id]);

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?userId=${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: messageContent,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: messageContent,
          type: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages(prev => 
          prev.map(msg => msg.id === optimisticMessage.id ? data.message : msg)
        );
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (!selectedUser) {
    return (
      <div className="chat-window">
        <div className="welcome-screen">
          <div className="welcome-logo">💬</div>
          <h3>Welcome to Chat</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-avatar me-3">
          {getInitials(selectedUser.username)}
        </div>
        <div>
          <h6 className="mb-0">{selectedUser.username}</h6>
          <small className="text-muted">Online</small>
        </div>
      </div>

      <div className="messages-container">
        {loading && (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-bubble ${
              message.senderId === currentUser.id ? 'message-sent' : 'message-received'
            }`}
          >
            <div>{message.content}</div>
            <div className="message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <form onSubmit={sendMessage}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? '...' : '📤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}