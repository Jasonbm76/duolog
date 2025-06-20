import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/services/anthropic';
import { openai } from '@/lib/services/openai';
import { createStreamResponse } from '@/lib/services/streaming';
import { rateLimiter } from '@/lib/services/rate-limiter';
import { emailUsageTracker } from '@/lib/services/email-usage-tracker';
import { validateEmail, validateText, validateSessionId } from '@/lib/utils/input-validation';

export const runtime = 'edge';

// Helper function to fix GPT-4 numbering format
function fixGptNumbering(content: string): string {
  // Fix the pattern where numbers are on separate lines
  // Pattern: "1.\n" followed by content becomes "1. " on same line
  return content.replace(/(\d+)\.\s*\n\s*/g, '$1. ');
}

// Simple chunk fix for obvious patterns
function fixChunkNumbering(chunk: string): string {
  // Fix obvious patterns: if chunk is just a number with period and newline
  if (/^\d+\.\s*\n$/.test(chunk)) {
    return chunk.replace(/\n$/, ' ');
  }
  return chunk;
}

// Helper function to extract content from different file types
async function extractFileContent(file: { url: string; name: string; type: string; size: number }): Promise<{ content: string; isBase64?: boolean; mediaType?: string }> {
  try {
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    // Handle different file types
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return { content: await response.text() };
    } else if (file.type === 'application/json') {
      const json = await response.json();
      return { content: JSON.stringify(json, null, 2) };
    } else if (file.type.startsWith('text/')) {
      // Handle other text files (css, js, html, etc.)
      return { content: await response.text() };
    } else if (file.type === 'application/pdf') {
      // For PDFs, always use universal text extraction (much more cost-effective)
      const arrayBuffer = await response.arrayBuffer();
      const { extractPDFText } = await import('@/lib/utils/pdf-extractor');
      return { content: await extractPDFText(arrayBuffer) };
    } else if (file.type.startsWith('image/')) {
      // For images, return base64 encoded data
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { 
        content: base64, 
        isBase64: true, 
        mediaType: file.type 
      };
    } else {
      return { content: `[File type ${file.type} not supported for content extraction]` };
    }
  } catch (error) {
    console.error('Error extracting file content:', error);
    return { content: `[Error reading file content: ${error instanceof Error ? error.message : 'Unknown error'}]` };
  }
}

// Helper function to generate file context for prompts
async function getFileContext(file?: { url: string; name: string; type: string; size: number }): Promise<string> {
  if (!file) return '';
  
  const fileData = await extractFileContent(file);
  
  if (fileData.isBase64 && fileData.mediaType) {
    // For base64 files (images), format for Claude
    return `
The user has attached a file: "${file.name}" (${file.type}, ${Math.round(file.size / 1024)}KB)

<document>
<source>${file.name}</source>
<media_type>${fileData.mediaType}</media_type>
<data>${fileData.content}</data>
</document>

Please analyze this file content as part of your response. Consider how it relates to the user's question.`;
  } else {
    // For text files and PDFs (extracted text), include content directly
    return `
The user has attached a file: "${file.name}" (${file.type}, ${Math.round(file.size / 1024)}KB)

File content:
${fileData.content}

Please analyze this file content as part of your response. Consider how it relates to the user's question.`;
  }
}

// Helper function to generate tone instructions
function getToneInstructions(tone: string = 'conversational'): string {
  const toneInstructions = {
    professional: "Respond in a professional, business-focused manner with formal language and structured presentation.",
    conversational: "Respond in a friendly, casual, and approachable manner as if having a natural conversation.",
    creative: "Respond with imagination, expressiveness, and inspiration. Be original and think outside the box.",
    technical: "Respond with detailed, precise, and analytical information. Focus on accuracy and technical depth.",
    concise: "Respond briefly and to-the-point. Be clear and direct without unnecessary elaboration.",
    educational: "Respond in a teaching-focused manner with step-by-step explanations and helpful guidance.",
    enthusiastic: "Respond with energy, motivation, and excitement. Be positive and encouraging.",
    sarcastic: "Respond with wit, clever humor, and a touch of sarcasm. Be entertaining while remaining helpful.",
    roast: "Roast the user playfully and creatively. Be brutally honest, hilariously savage, but never actually mean or hurtful. Think comedy roast style - entertaining burns that make people laugh at themselves."
  };
  
  return toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.conversational;
}

interface CollaborateRequest {
  prompt: string;
  userKeys?: {
    openai?: string;
    anthropic?: string;
  };
  sessionId: string;
  email: string; // Now required
  fingerprint?: string;
  tone?: string;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CollaborateRequest = await request.json();
    const { prompt, userKeys, sessionId, email, fingerprint, tone, file } = body;

    // Validate and sanitize prompt
    const promptValidation = validateText(prompt, {
      maxLength: 5000,
      minLength: 1,
      allowHtml: false,
      allowSpecialChars: true
    });

    if (!promptValidation.isValid) {
      return new Response(JSON.stringify({ 
        error: promptValidation.errors[0] || 'Invalid prompt' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return new Response(JSON.stringify({ 
        error: emailValidation.errors[0] || 'Invalid email address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session ID
    if (!validateSessionId(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate fingerprint if provided
    let sanitizedFingerprint = '';
    if (fingerprint) {
      const fingerprintValidation = validateText(fingerprint, {
        maxLength: 100,
        allowHtml: false,
        allowSpecialChars: false
      });
      if (fingerprintValidation.isValid) {
        sanitizedFingerprint = fingerprintValidation.sanitized;
      }
    }

    // Extract IP address for usage tracking
    const { extractIPAddress } = await import('@/lib/utils/ip-utils');
    const ip = extractIPAddress(request);
    
    // Create user identifiers for email-based tracking
    const identifiers = {
      email: emailValidation.sanitized,
      fingerprint: sanitizedFingerprint,
      ip,
      sessionId,
    };

    // Check rate limits if using our keys
    if (!userKeys?.openai || !userKeys?.anthropic) {
      const rateLimitCheck = rateLimiter.canAttempt(request);
      if (!rateLimitCheck.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          remaining: rateLimitCheck.remaining,
          resetTime: rateLimitCheck.resetTime
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Record the attempt
      rateLimiter.recordAttempt(request);

      // Check usage limits with email-based tracking
      const usageCheck = await emailUsageTracker.checkLimit(request, identifiers, userKeys);
      if (!usageCheck.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Free usage limit reached', 
          upgradeRequired: true,
          limit: usageCheck.limit,
          used: usageCheck.used,
          email: emailValidation.sanitized
        }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Log if suspicious activity detected
      if (usageCheck.suspiciousActivity) {
        console.warn('🚨 Suspicious activity detected:', { 
          email: emailValidation.sanitized, 
          fingerprint: sanitizedFingerprint, 
          ip 
        });
      }
    }

    // Create streaming response
    const stream = createStreamResponse(async (writer) => {
      try {
        let conversationHistory: Array<{role: 'claude' | 'gpt-4', content: string}> = [];
        let currentRound = 1;
        let lastSpeaker: 'claude' | 'gpt-4' = 'gpt-4'; // Start with GPT-4
        const maxRounds = 5; // Max 5 total rounds for efficiency
        let conversationComplete = false;

        // Helper function to check for agreement/completion
        const checkForAgreement = (response: string): boolean => {
          const agreementPhrases = [
            'I agree with',
            'I concur with',
            'Claude is right',
            'GPT-4 is correct',
            'I think we\'ve covered',
            'This covers everything',
            'I believe we\'ve thoroughly',
            'I think this response is comprehensive',
            'I\'m satisfied with',
            'This is a complete',
            'perfect response',
            'nothing more to add',
            'fully addresses'
          ];
          return agreementPhrases.some(phrase => 
            response.toLowerCase().includes(phrase.toLowerCase())
          );
        };

        // Round 1: Start with Claude if file is present (better document handling)
        const initialModel = file ? 'claude' : 'gpt-4';
        
        await writer.write({
          type: 'round_start',
          round: currentRound,
          model: initialModel,
          inputPrompt: promptValidation.sanitized,
        });

        if (initialModel === 'claude') {
          // Start with Claude when file is present
          const toneInstruction = getToneInstructions(tone);
          const fileContext = await getFileContext(file);
          
          const claudeResult1 = await anthropic.streamCompletion({
            prompt: `You are Claude, collaborating with GPT-4 to provide the best possible answer. ${toneInstruction}

A user has asked: "${promptValidation.sanitized}"${fileContext}

Provide a thorough, helpful response. After you respond, GPT-4 will review your answer and potentially add to it or suggest improvements. Focus on being comprehensive but know that this is the start of a collaborative process.${file ? ' Pay special attention to analyzing the attached file.' : ''}`,
            apiKey: userKeys?.anthropic,
            onChunk: (chunk) => {
              try {
                writer.write({
                  type: 'content_chunk',
                  round: currentRound,
                  model: 'claude',
                  content: chunk,
                });
              } catch (error) {
                // Stream might be closed, ignore write errors
                console.warn('Failed to write chunk to closed stream');
              }
            },
          });

          conversationHistory.push({ role: 'claude', content: claudeResult1.content });
          lastSpeaker = 'claude';

          if (claudeResult1.usage) {
            await writer.write({
              type: 'token_update',
              tokenUsage: {
                model: 'claude-3-sonnet',
                inputTokens: claudeResult1.usage.inputTokens,
                outputTokens: claudeResult1.usage.outputTokens,
              },
            });
          }

          await writer.write({
            type: 'round_complete',
            round: currentRound,
            model: 'claude',
          });

          currentRound++;
        } else {
          // Start with GPT-4 when no file is present
          let gptResult1;
          try {
            // Check if OpenAI is available before attempting
            if (!userKeys?.openai && !process.env.OPENAI_API_KEY) {
              throw new Error('No OpenAI API key available');
            }
            
            const toneInstruction = getToneInstructions(tone);
            const fileContext = await getFileContext(file);
            
            gptResult1 = await openai.streamCompletion({
              prompt: `You are GPT-4, collaborating with Claude to provide the best possible answer. ${toneInstruction}

A user has asked: "${promptValidation.sanitized}"${fileContext}

Provide a thorough, helpful response. After you respond, Claude will review your answer and potentially add to it or suggest improvements. Focus on being comprehensive but know that this is the start of a collaborative process.`,
              apiKey: userKeys?.openai,
              onChunk: (chunk) => {
                try {
                  const fixedChunk = fixChunkNumbering(chunk);
                  writer.write({
                    type: 'content_chunk',
                    round: currentRound,
                    model: 'gpt-4',
                    content: fixedChunk,
                  });
                } catch (error) {
                  // Stream might be closed, ignore write errors
                  console.warn('Failed to write chunk to closed stream');
                }
              },
            });

            // Fix formatting and add to conversation history
            const fixedContent = fixGptNumbering(gptResult1.content);
            conversationHistory.push({ role: 'gpt-4', content: fixedContent });
            lastSpeaker = 'gpt-4';

            // Send token update for GPT-4 round 1
            if (gptResult1.usage) {
              await writer.write({
                type: 'token_update',
                tokenUsage: {
                  model: 'gpt-4',
                  inputTokens: gptResult1.usage.inputTokens,
                  outputTokens: gptResult1.usage.outputTokens,
                },
              });
            }

            await writer.write({
              type: 'round_complete',
              round: currentRound,
              model: 'gpt-4',
            });

            currentRound++;
          } catch (error) {
            console.error('🚨 GPT-4 FAILED in production:', {
              error: error instanceof Error ? error.message : String(error),
              hasUserOpenAI: !!userKeys?.openai,
              hasEnvOpenAI: !!process.env.OPENAI_API_KEY,
              apiKeyLength: userKeys?.openai?.length || process.env.OPENAI_API_KEY?.length || 0
            });
            
            // Send error info to client for debugging
            await writer.write({
              type: 'error', 
              error: `GPT-4 unavailable: ${error instanceof Error ? error.message : 'API key issue'}. Starting with Claude instead.`
            });
            
            // Update round to show Claude starting
            await writer.write({
              type: 'round_start',
              round: currentRound,
              model: 'claude',
              inputPrompt: promptValidation.sanitized,
            });
            
            // Fallback to Claude for initial response
            const toneInstruction = getToneInstructions(tone);
            const fileContext = await getFileContext(file);
            
            const claudeResult1 = await anthropic.streamCompletion({
              prompt: `You are Claude providing the initial response to a user question. ${toneInstruction}

A user has asked: "${promptValidation.sanitized}"${fileContext}

Provide a thorough, helpful response. Focus on being comprehensive and addressing all aspects of their question.${file ? ' Pay special attention to analyzing the attached file.' : ''}`,
              apiKey: userKeys?.anthropic,
              onChunk: (chunk) => {
                try {
                  writer.write({
                    type: 'content_chunk',
                    round: currentRound,
                    model: 'claude',
                    content: chunk,
                  });
                } catch (error) {
                  // Stream might be closed, ignore write errors
                  console.warn('Failed to write chunk to closed stream');
                }
              },
            });

            conversationHistory.push({ role: 'claude', content: claudeResult1.content });
            lastSpeaker = 'claude';

            if (claudeResult1.usage) {
              await writer.write({
                type: 'token_update',
                tokenUsage: {
                  model: 'claude-3-sonnet',
                  inputTokens: claudeResult1.usage.inputTokens,
                  outputTokens: claudeResult1.usage.outputTokens,
                },
              });
            }

            await writer.write({
              type: 'round_complete',
              round: currentRound,
              model: 'claude',
            });

            currentRound++;
          }
        }

        // Start iterative conversation
        while (currentRound <= maxRounds && !conversationComplete) {
          const nextSpeaker = lastSpeaker === 'gpt-4' ? 'claude' : 'gpt-4';
          
          await writer.write({
            type: 'round_start',
            round: currentRound,
            model: nextSpeaker,
            inputPrompt: `Reviewing previous response and adding insights`,
          });

          let result: any = { content: '' };

          if (nextSpeaker === 'gpt-4') {
            try {
              // Build conversation context for GPT-4
              const conversationContext = conversationHistory.map((msg) => 
                `${msg.role === 'claude' ? 'Claude' : 'GPT-4'}: ${msg.content}`
              ).join('\n\n');

              const toneInstruction = getToneInstructions(tone);
              
              result = await openai.streamCompletion({
                prompt: `You are GPT-4, collaborating with Claude to provide the best possible answer to this user question: "${promptValidation.sanitized}" ${toneInstruction}

Conversation so far:
${conversationContext}

Review Claude's latest response carefully. If you think it fully and comprehensively addresses the user's question with no significant gaps, respond with "I agree with Claude's response - it fully addresses the question" and briefly explain why it's complete.

If you think it could be improved or expanded, provide your own insights that build upon Claude's response. Focus on adding value, different perspectives, or addressing any gaps you notice.

Be honest about whether the current answer is sufficient or needs enhancement.`,
                apiKey: userKeys?.openai,
                onChunk: (chunk) => {
                  try {
                    const fixedChunk = fixChunkNumbering(chunk);
                    writer.write({
                      type: 'content_chunk',
                      round: currentRound,
                      model: 'gpt-4',
                      content: fixedChunk,
                    });
                  } catch (error) {
                    // Stream might be closed, ignore write errors
                    console.warn('Failed to write chunk to closed stream');
                  }
                },
              });

              // Send token update for GPT-4
              if (result.usage) {
                await writer.write({
                  type: 'token_update',
                  tokenUsage: {
                    model: 'gpt-4',
                    inputTokens: result.usage.inputTokens,
                    outputTokens: result.usage.outputTokens,
                  },
                });
              }
            } catch (error) {
              console.error('GPT-4 unavailable, using Claude-only mode:', error);
              // Skip this round and continue with Claude
              continue;
            }
          } else {
            // Claude's turn
            const conversationContext = conversationHistory.map((msg) => 
              `${msg.role === 'claude' ? 'Claude' : 'GPT-4'}: ${msg.content}`
            ).join('\n\n');

            const toneInstruction = getToneInstructions(tone);
            
            result = await anthropic.streamCompletion({
              prompt: `You are Claude, collaborating with GPT-4 to provide the best possible answer to this user question: "${promptValidation.sanitized}" ${toneInstruction}

Conversation so far:
${conversationContext}

Review GPT-4's latest response carefully. If you think between both of your responses, the user's question is now fully and comprehensively addressed, respond with "I agree with our collaborative response - this fully addresses the question" and briefly summarize the complete answer.

If you think the response could still be improved or if there are important aspects missing, provide additional insights that build upon the conversation so far.

Be honest about whether the current combined answer is sufficient or needs more work.`,
              apiKey: userKeys?.anthropic,
              onChunk: (chunk) => {
                try {
                  writer.write({
                    type: 'content_chunk',
                    round: currentRound,
                    model: 'claude',
                    content: chunk,
                  });
                } catch (error) {
                  // Stream might be closed, ignore write errors
                  console.warn('Failed to write chunk to closed stream');
                }
              },
            });

            // Send token update for Claude
            if (result.usage) {
              await writer.write({
                type: 'token_update',
                tokenUsage: {
                  model: 'claude-3-sonnet',
                  inputTokens: result.usage.inputTokens,
                  outputTokens: result.usage.outputTokens,
                },
              });
            }
          }

          // Fix formatting if GPT-4 and add to conversation history
          const finalContent = nextSpeaker === 'gpt-4' ? fixGptNumbering(result.content) : result.content;
          conversationHistory.push({ role: nextSpeaker, content: finalContent });
          lastSpeaker = nextSpeaker;

          // Check for agreement
          if (checkForAgreement(result.content)) {
            conversationComplete = true;
          }

          await writer.write({
            type: 'round_complete',
            round: currentRound,
            model: nextSpeaker,
          });

          currentRound++;
        }

        // Generate final synthesis when conversation is complete
        if (conversationComplete && conversationHistory.length >= 2) {
          await writer.write({
            type: 'round_start',
            round: currentRound,
            model: 'claude',
            inputPrompt: 'Creating final synthesis',
          });

          // Create a comprehensive summary of all responses
          const conversationContext = conversationHistory.map((msg, i) => 
            `${msg.role === 'claude' ? 'Claude' : 'GPT-4'}: ${msg.content}`
          ).join('\n\n');

          let finalSynthesis;
          try {
            const toneInstruction = getToneInstructions(tone);
            
            finalSynthesis = await anthropic.streamCompletion({
              prompt: `You are Claude creating a final, polished synthesis of the collaborative discussion. The user asked: "${promptValidation.sanitized}" ${toneInstruction}

Here's the complete discussion:
${conversationContext}

Create a concise, well-structured final answer that:
1. Synthesizes the best insights from both Claude and GPT-4
2. Presents the information in a clear, actionable format
3. Removes any redundancy or back-and-forth discussion
4. Focuses on giving the user exactly what they need
5. Uses appropriate formatting (bullet points, numbered lists, etc.) for clarity

Do not mention the collaboration process or that this is a synthesis. Just provide the clean, final answer.`,
              apiKey: userKeys?.anthropic,
              onChunk: (chunk) => {
                try {
                  writer.write({
                    type: 'content_chunk',
                    round: currentRound,
                    model: 'claude',
                    content: chunk,
                    isFinalSynthesis: true,
                  });
                } catch (error) {
                  // Stream might be closed, ignore write errors
                  console.warn('Failed to write chunk to closed stream');
                }
              },
            });
          } catch (anthropicError) {
            console.warn('Anthropic overloaded for final synthesis, falling back to GPT-4:', anthropicError);
            
            // Fallback to GPT-4 for final synthesis
            const toneInstruction = getToneInstructions(tone);
            
            finalSynthesis = await openai.streamCompletion({
              prompt: `You are GPT-4 creating a final, polished synthesis of the collaborative discussion. The user asked: "${promptValidation.sanitized}" ${toneInstruction}

Here's the complete discussion:
${conversationContext}

Create a concise, well-structured final answer that:
1. Synthesizes the best insights from both Claude and GPT-4
2. Presents the information in a clear, actionable format
3. Removes any redundancy or back-and-forth discussion
4. Focuses on giving the user exactly what they need
5. Uses appropriate formatting (bullet points, numbered lists, etc.) for clarity
6. Make sure that when you use numbered lists, you use the correct format where the text is on the same line as the number.

Do not mention the collaboration process or that this is a synthesis. Just provide the clean, final answer.`,
              apiKey: userKeys?.openai,
              onChunk: (chunk) => {
                try {
                  const fixedChunk = fixChunkNumbering(chunk);
                  writer.write({
                    type: 'content_chunk',
                    round: currentRound,
                    model: 'gpt-4',
                    content: fixedChunk,
                    isFinalSynthesis: true,
                  });
                } catch (error) {
                  // Stream might be closed, ignore write errors
                  console.warn('Failed to write chunk to closed stream');
                }
              },
            });
          }

          if (finalSynthesis.usage) {
            await writer.write({
              type: 'token_update',
              tokenUsage: {
                model: 'claude-3-sonnet',
                inputTokens: finalSynthesis.usage.inputTokens,
                outputTokens: finalSynthesis.usage.outputTokens,
              },
            });
          }

          await writer.write({
            type: 'round_complete',
            round: currentRound,
            model: 'claude',
            isFinalSynthesis: true,
          });
        }

        // Track usage if using our keys
        if (!userKeys?.openai || !userKeys?.anthropic) {
          await emailUsageTracker.increment(request, identifiers, userKeys);
        }

        await writer.write({
          type: 'conversation_complete',
        });

      } catch (error) {
        console.error('Collaboration error:', error);
        await writer.write({
          type: 'error',
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      } finally {
        await writer.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}