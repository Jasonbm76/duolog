import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/services/rate-limiter';
import { z } from 'zod';

const startChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long')
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limit first
    const rateLimitCheck = rateLimiter.canAttempt(request);
    
    if (!rateLimitCheck.allowed) {
      const timeUntilReset = rateLimitCheck.resetTime ? 
        Math.ceil((rateLimitCheck.resetTime.getTime() - Date.now()) / (1000 * 60 * 60)) : 24;
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `You've reached the 3 conversation limit. Try again in ${timeUntilReset} hours.`,
          rateLimitExceeded: true,
          resetTime: rateLimitCheck.resetTime
        },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await request.json();
    const { prompt } = startChatSchema.parse(body);

    // Record the attempt
    rateLimiter.recordAttempt(request);

    // Get updated status
    const status = rateLimiter.getStatus(request);

    // Return conversation started successfully
    return NextResponse.json({
      success: true,
      conversationId: `conv-${Date.now()}`,
      message: 'Conversation started successfully',
      rateLimit: {
        remaining: status.remaining,
        resetTime: status.resetTime
      }
    });

  } catch (error) {
    console.error('Error starting chat:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current rate limit status
    const status = rateLimiter.getStatus(request);
    
    return NextResponse.json({
      rateLimit: {
        attempts: status.attempts,
        remaining: status.remaining,
        resetTime: status.resetTime,
        maxAttempts: 3
      }
    });
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}