'use client';

import { useEffect, useState } from 'react';

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

interface Chat {
  user: User;
  lastMessage?: Message;
}

interface ChatSidebarProps {
  onSelectChat: (user: User) => void;
  selectedUserId?: string;
  currentUser: User;
}

export default function ChatSidebar({ onSelectChat, selectedUserId, currentUser }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            <div className="chat-avatar me-3">
              {getInitials(currentUser.username)}
            </div>
            <div>
              <h6 className="mb-0">{currentUser.username}</h6>
              <small className="text-muted">Online</small>
            </div>
          </div>
        </div>
        <div className="p-3 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="d-flex align-items-center flex-grow-1">
          <div className="chat-avatar me-3">
            {getInitials(currentUser.username)}
          </div>
          <div className="flex-grow-1">
            <h6 className="mb-0">{currentUser.username}</h6>
            <small className="text-muted">Online</small>
          </div>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleLogout}
          title="Logout"
        >
          🚪
        </button>
      </div>

      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="p-3 text-center text-muted">
            <p>No chats yet</p>
            <small>Start a conversation!</small>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.user.id}
              className={`chat-item ${selectedUserId === chat.user.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.user)}
            >
              <div className="chat-avatar">
                {getInitials(chat.user.username)}
              </div>
              <div className="chat-info">
                <div className="chat-name">{chat.user.username}</div>
                <div className="chat-preview">
                  {chat.lastMessage ? (
                    <>
                      {chat.lastMessage.senderId === currentUser.id && "You: "}
                      {chat.lastMessage.content}
                    </>
                  ) : (
                    <span className="text-muted">Start a conversation</span>
                  )}
                </div>
              </div>
              {chat.lastMessage && (
                <div className="chat-time text-muted">
                  <small>{formatTime(chat.lastMessage.timestamp)}</small>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}