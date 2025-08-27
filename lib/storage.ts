import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text';
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// User storage functions
export function getAllUsers(): User[] {
  return readJsonFile<User[]>(USERS_FILE, []);
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find(user => user.email === email) || null;
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find(user => user.id === id) || null;
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getAllUsers();
  const newUser: User = {
    id: Date.now().toString(),
    ...user,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeJsonFile(USERS_FILE, users);
  return newUser;
}

// Message storage functions
export function getAllMessages(): Message[] {
  return readJsonFile<Message[]>(MESSAGES_FILE, []);
}

export function getMessagesBetweenUsers(userId1: string, userId2: string): Message[] {
  const messages = getAllMessages();
  return messages.filter(message => 
    (message.senderId === userId1 && message.receiverId === userId2) ||
    (message.senderId === userId2 && message.receiverId === userId1)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function createMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
  const messages = getAllMessages();
  const newMessage: Message = {
    id: Date.now().toString(),
    ...message,
    timestamp: new Date().toISOString(),
  };
  messages.push(newMessage);
  writeJsonFile(MESSAGES_FILE, messages);
  return newMessage;
}

export function getChatsForUser(userId: string): Array<{user: User, lastMessage?: Message}> {
  const messages = getAllMessages();
  const users = getAllUsers();
  const currentUser = getUserById(userId);
  
  if (!currentUser) return [];

  // Get unique chat partners
  const chatPartners = new Set<string>();
  messages.forEach(message => {
    if (message.senderId === userId) {
      chatPartners.add(message.receiverId);
    } else if (message.receiverId === userId) {
      chatPartners.add(message.senderId);
    }
  });

  // Add all other users as potential chats
  users.forEach(user => {
    if (user.id !== userId) {
      chatPartners.add(user.id);
    }
  });

  return Array.from(chatPartners).map(partnerId => {
    const user = getUserById(partnerId);
    if (!user) return null;

    const conversationMessages = getMessagesBetweenUsers(userId, partnerId);
    const lastMessage = conversationMessages[conversationMessages.length - 1];

    return { user, lastMessage };
  }).filter(Boolean) as Array<{user: User, lastMessage?: Message}>;
}