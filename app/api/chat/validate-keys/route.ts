import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { keys } = await request.json();
    const validation = { openai: false, anthropic: false };

    // Validate OpenAI key
    if (keys.openai) {
      try {
        const openai = new OpenAI({ apiKey: keys.openai });
        // Test with a minimal completion instead of models.list()
        await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1,
        });
        validation.openai = true;
      } catch (error) {
        console.error('OpenAI validation error:', error);
        validation.openai = false;
      }
    }

    // Validate Anthropic key
    if (keys.anthropic) {
      try {
        const anthropic = new Anthropic({ apiKey: keys.anthropic });
        // Test with a simple message
        await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        validation.anthropic = true;
      } catch (error) {
        validation.anthropic = false;
      }
    }

    return new Response(JSON.stringify({ validation }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Key validation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Validation failed',
      validation: { openai: false, anthropic: false }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}