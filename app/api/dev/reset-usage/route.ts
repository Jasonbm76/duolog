import { NextRequest } from 'next/server';

// Only allow in development
if (process.env.NODE_ENV !== 'development') {
  throw new Error('This API route is only available in development');
}

// Dynamic imports to avoid issues if Supabase isn't configured
async function getSupabaseClient() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.warn('Supabase environment variables not configured');
      return null;
    }

    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  } catch (error) {
    console.warn('Supabase client creation failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return new Response(JSON.stringify({ 
        error: 'This endpoint is only available in development' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { action } = body;

    // Get Supabase client
    const supabase = await getSupabaseClient();

    if (!supabase) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured. Usage tracking is using in-memory storage.',
        success: false,
        message: 'Restart the development server to reset in-memory usage tracking.'
      }), {
        status: 200, // Not an error, just informational
        headers: { 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'clear_all':
        // Delete all usage records
        const { error: deleteError } = await supabase
          .from('usage_tracking')
          .delete()
          .not('id', 'is', null); // Delete all records (where id is not null)

        if (deleteError) {
          throw deleteError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'All usage records cleared' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'reset_counts':
        // Reset conversation counts to 0
        const { error: resetError } = await supabase
          .from('usage_tracking')
          .update({ 
            conversation_count: 0,
            updated_at: new Date().toISOString() 
          })
          .not('id', 'is', null); // Update all records (where id is not null)

        if (resetError) {
          throw resetError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'All conversation counts reset to 0' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'increase_limits':
        // Increase daily limits to 100 for development
        const { error: limitError } = await supabase
          .from('usage_tracking')
          .update({ 
            daily_limit: 100,
            updated_at: new Date().toISOString() 
          })
          .not('id', 'is', null); // Update all records (where id is not null)

        if (limitError) {
          throw limitError;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Daily limits increased to 100' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action. Use: clear_all, reset_counts, or increase_limits' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Dev reset API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
    });
    
    // Provide more helpful error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: 'Database operation failed',
      details: errorMessage,
      errorType: error instanceof Error ? error.name : 'Unknown',
      suggestion: 'Make sure Supabase is configured and the database is accessible. Check the server console for detailed error logs.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}