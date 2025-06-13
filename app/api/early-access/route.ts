import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/resend';
import { z } from 'zod';

// Validation schema
const signupSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(5)
    .max(255)
    .transform(email => email.toLowerCase().trim())
});

// Rate limiting (simple in-memory store for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 5) { // Max 5 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { email } = validationResult.data;
    
    // Initialize Supabase client with service role
    const supabase = createServerClient();
    
    // Check if email already exists
    const { data: existingEmail, error: checkError } = await supabase
      .from('early_access')
      .select('id, confirmed')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database error:', checkError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }
    
    if (existingEmail) {
      // Email already exists
      if (existingEmail.confirmed) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 409 }
        );
      } else {
        // Resend confirmation email
        const { data: updatedRecord, error: updateError } = await supabase
          .from('early_access')
          .update({ 
            confirmation_sent_at: new Date().toISOString(),
            ip_address: ip !== 'unknown' ? ip : null,
            user_agent: request.headers.get('user-agent'),
            referrer: request.headers.get('referer')
          })
          .eq('email', email)
          .select('confirmation_token')
          .single();
        
        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
          );
        }
        
        // Send welcome email
        try {
          await sendWelcomeEmail({ 
            email, 
            confirmationToken: updatedRecord.confirmation_token 
          });
        } catch (emailError) {
          console.error('Email send error:', emailError);
          // Don't fail the request if email fails
        }
        
        return NextResponse.json({
          message: 'Confirmation email resent. Please check your inbox.',
          success: true
        });
      }
    }
    
    // Insert new email
    const { data: newRecord, error: insertError } = await supabase
      .from('early_access')
      .insert({
        email,
        source: 'landing_page',
        ip_address: ip !== 'unknown' ? ip : null,
        user_agent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
        confirmation_sent_at: new Date().toISOString()
      })
      .select('confirmation_token')
      .single();
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save email' },
        { status: 500 }
      );
    }
    
    // Send welcome email
    try {
      await sendWelcomeEmail({ 
        email, 
        confirmationToken: newRecord.confirmation_token 
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({
      message: 'Success! Check your email for confirmation.',
      success: true
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}