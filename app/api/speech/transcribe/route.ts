import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Speech transcription request received');

    // Get the audio file from the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    // Check file size (Whisper has a 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large. Maximum size is 25MB.' }, { status: 400 });
    }

    // Convert to buffer for OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    console.log('Sending to OpenAI Whisper API...');

    // Send to OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      model: 'whisper-1',
      language: 'en', // Optimize for English
      response_format: 'text'
    });

    console.log('Transcription successful:', transcription);

    return NextResponse.json({
      transcript: transcription,
      success: true
    });

  } catch (error) {
    console.error('Error in speech transcription:', error);
    
    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json({ 
          error: 'OpenAI quota exceeded. Please try again later.' 
        }, { status: 429 });
      }
      
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json({ 
          error: 'API configuration error. Please contact support.' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to transcribe audio. Please try again.' 
    }, { status: 500 });
  }
}