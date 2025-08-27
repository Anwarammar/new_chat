'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Set current user in localStorage when authentication succeeds
    const handleAuthSuccess = async () => {
      const publicPaths = ['/login', '/register'];
      const isPublicPath = publicPaths.includes(pathname);

      if (!isPublicPath) {
        try {
          const response = await fetch('/api/chats');
          if (response.ok && response.headers.get('x-user-id')) {
            // Store user info in localStorage (this would come from the middleware)
            const userData = {
              id: response.headers.get('x-user-id'),
              username: response.headers.get('x-username') || 'User',
              email: response.headers.get('x-user-email') || 'user@example.com'
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            setCurrentUser(userData);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
    };

    handleAuthSuccess();
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Chat App - WhatsApp Web Clone</title>
        <meta name="description" content="A modern chat application inspired by WhatsApp Web" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        />
      </body>
    </html>
  );
}