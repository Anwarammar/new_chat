import { NextRequest, NextResponse } from 'next/server';
import { getChatsForUser } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = getChatsForUser(userId);
    
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Chats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}