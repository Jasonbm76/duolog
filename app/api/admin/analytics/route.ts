import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
    }

    // Get basic user stats
    const [usersResult, conversationsResult, recentUsersResult, conversationHistoryResult] = await Promise.all([
      // Total users and verification stats
      supabase
        .from('user_usage')
        .select('email_verified, conversations_used, max_conversations')
        .order('created_at', { ascending: false }),
      
      // Total conversations from conversation history (preserves analytics when users reset)
      supabase
        .from('conversation_history')
        .select('email'),
      
      // Recent user activity (last 50 users)
      supabase
        .from('user_usage')
        .select('email, conversations_used, max_conversations, email_verified, created_at, last_conversation_at')
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Get actual conversation counts per user from history (for display)
      supabase
        .from('conversation_history')
        .select('email')
        .order('started_at', { ascending: false })
    ]);

    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (conversationsResult.error) {
      console.error('Error fetching conversations:', conversationsResult.error);
      return NextResponse.json({ error: 'Failed to fetch conversation data' }, { status: 500 });
    }

    if (conversationHistoryResult.error) {
      console.error('Error fetching conversation history:', conversationHistoryResult.error);
      return NextResponse.json({ error: 'Failed to fetch conversation history' }, { status: 500 });
    }

    const users = usersResult.data || [];
    const conversationHistory = conversationsResult.data || []; // Total conversations from history
    const recentUsers = recentUsersResult.data || [];
    const allConversations = conversationHistoryResult.data || []; // All conversations for per-user counts

    // Calculate stats
    const totalUsers = users.length;
    const totalVerifiedUsers = users.filter(u => u.email_verified).length;
    const totalUnverifiedUsers = totalUsers - totalVerifiedUsers;
    const totalConversations = conversationHistory.length; // Count actual conversations, not user usage
    const avgConversationsPerUser = totalUsers > 0 ? totalConversations / totalUsers : 0;
    const usersAtLimit = users.filter(u => u.conversations_used >= u.max_conversations).length;

    // Check for suspicious activity (simplified - could be enhanced)
    const { data: abuseData } = await supabase
      .from('usage_abuse_log')
      .select('email', { count: 'exact' });
    
    const suspiciousUsers = abuseData ? Math.min(abuseData.length, 50) : 0; // Cap at reasonable number

    // Count actual conversations per user from history
    const conversationCounts = allConversations.reduce((counts, conv) => {
      counts[conv.email] = (counts[conv.email] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Anonymize email addresses for privacy but keep real email for admin functions
    const anonymizedRecentUsers = recentUsers.map(user => ({
      ...user,
      displayEmail: user.email.length > 3 
        ? user.email.substring(0, 3) + '***@' + user.email.split('@')[1]
        : '***@' + user.email.split('@')[1],
      // Keep real email for reset function
      realEmail: user.email,
      // Show actual conversation count from history (never reset)
      total_conversations: conversationCounts[user.email] || 0,
      // Keep current usage count for limit display
      current_usage: user.conversations_used
    }));

    const analytics = {
      totalUsers,
      totalVerifiedUsers,
      totalUnverifiedUsers,
      totalConversations,
      avgConversationsPerUser: Math.round(avgConversationsPerUser * 10) / 10,
      suspiciousUsers,
      usersAtLimit,
      recentSignups: anonymizedRecentUsers
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}