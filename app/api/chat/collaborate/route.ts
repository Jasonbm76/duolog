import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/services/anthropic';
import { openai } from '@/lib/services/openai';
import { createStreamResponse } from '@/lib/services/streaming';
import { rateLimiter } from '@/lib/services/rate-limiter';
import { emailUsageTracker } from '@/lib/services/email-usage-tracker';
import { validateEmail, validateText, validateSessionId } from '@/lib/utils/input-validation';

export const runtime = 'edge';

interface CollaborateRequest {
  prompt: string;
  userKeys?: {
    openai?: string;
    anthropic?: string;
  };
  sessionId: string;
  email: string; // Now required
  fingerprint?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CollaborateRequest = await request.json();
    const { prompt, userKeys, sessionId, email, fingerprint } = body;

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

        // Round 1: GPT-4 initial response
        await writer.write({
          type: 'round_start',
          round: currentRound,
          model: 'gpt-4',
          inputPrompt: promptValidation.sanitized,
        });

        let gptResult1;
        try {
          // Check if OpenAI is available before attempting
          if (!userKeys?.openai && !process.env.OPENAI_API_KEY) {
            throw new Error('No OpenAI API key available');
          }
          
          gptResult1 = await openai.streamCompletion({
            prompt: `You are GPT-4, collaborating with Claude to provide the best possible answer. A user has asked: "${promptValidation.sanitized}"

Provide a thorough, helpful response. After you respond, Claude will review your answer and potentially add to it or suggest improvements. Focus on being comprehensive but know that this is the start of a collaborative process.`,
            apiKey: userKeys?.openai,
            onChunk: (chunk) => {
              try {
                writer.write({
                  type: 'content_chunk',
                  round: currentRound,
                  model: 'gpt-4',
                  content: chunk,
                });
              } catch (error) {
                // Stream might be closed, ignore write errors
                console.warn('Failed to write chunk to closed stream');
              }
            },
          });

          // Add to conversation history
          conversationHistory.push({ role: 'gpt-4', content: gptResult1.content });
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
          const claudeResult1 = await anthropic.streamCompletion({
            prompt: `You are Claude providing the initial response to a user question. A user has asked: "${promptValidation.sanitized}"

Provide a thorough, helpful response. Focus on being comprehensive and addressing all aspects of their question.`,
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

              result = await openai.streamCompletion({
                prompt: `You are GPT-4, collaborating with Claude to provide the best possible answer to this user question: "${promptValidation.sanitized}"

Conversation so far:
${conversationContext}

Review Claude's latest response carefully. If you think it fully and comprehensively addresses the user's question with no significant gaps, respond with "I agree with Claude's response - it fully addresses the question" and briefly explain why it's complete.

If you think it could be improved or expanded, provide your own insights that build upon Claude's response. Focus on adding value, different perspectives, or addressing any gaps you notice.

Be honest about whether the current answer is sufficient or needs enhancement.`,
                apiKey: userKeys?.openai,
                onChunk: (chunk) => {
                  try {
                    writer.write({
                      type: 'content_chunk',
                      round: currentRound,
                      model: 'gpt-4',
                      content: chunk,
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

            result = await anthropic.streamCompletion({
              prompt: `You are Claude, collaborating with GPT-4 to provide the best possible answer to this user question: "${promptValidation.sanitized}"

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

          // Add to conversation history
          conversationHistory.push({ role: nextSpeaker, content: result.content });
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
            finalSynthesis = await anthropic.streamCompletion({
              prompt: `You are Claude creating a final, polished synthesis of the collaborative discussion. The user asked: "${promptValidation.sanitized}"

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
            finalSynthesis = await openai.streamCompletion({
              prompt: `You are GPT-4 creating a final, polished synthesis of the collaborative discussion. The user asked: "${promptValidation.sanitized}"

Here's the complete discussion:
${conversationContext}

Create a concise, well-structured final answer that:
1. Synthesizes the best insights from both Claude and GPT-4
2. Presents the information in a clear, actionable format
3. Removes any redundancy or back-and-forth discussion
4. Focuses on giving the user exactly what they need
5. Uses appropriate formatting (bullet points, numbered lists, etc.) for clarity

Do not mention the collaboration process or that this is a synthesis. Just provide the clean, final answer.`,
              apiKey: userKeys?.openai,
              onChunk: (chunk) => {
                try {
                  writer.write({
                    type: 'content_chunk',
                    round: currentRound,
                    model: 'gpt-4',
                    content: chunk,
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