import { NextRequest, NextResponse } from 'next/server';
import { getMessagesBetweenUsers, createMessage } from '@/lib/storage';
import { z } from 'zod';

const messageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1, 'Message content is required'),
  type: z.literal('text').default('text'),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');

    if (!userId || !otherUserId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const messages = getMessagesBetweenUsers(userId, otherUserId);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, type } = messageSchema.parse(body);

    const message = createMessage({
      senderId: userId,
      receiverId,
      content,
      type,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}