'use client';

import { useState, useEffect } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user from localStorage or redirect to login
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      // Try to get user info from server
      fetchCurrentUser();
    }
    setLoading(false);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // Since we don't have a direct endpoint for current user,
      // we'll try to make an authenticated request and see if it works
      const response = await fetch('/api/chats');
      if (!response.ok) {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const handleSelectChat = (user: User) => {
    setSelectedUser(user);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <h3>Please log in</h3>
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 main-container">
        <div className="col-md-4 col-lg-3">
          <ChatSidebar
            onSelectChat={handleSelectChat}
            selectedUserId={selectedUser?.id}
            currentUser={currentUser}
          />
        </div>
        <div className="col-md-8 col-lg-9">
          <ChatWindow
            selectedUser={selectedUser}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}