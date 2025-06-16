import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
    }

    // Get basic user stats
    const [usersResult, conversationsResult, recentUsersResult] = await Promise.all([
      // Total users and verification stats
      supabase
        .from('user_usage')
        .select('email_verified, conversations_used, max_conversations')
        .order('created_at', { ascending: false }),
      
      // Total conversations across all users
      supabase
        .from('user_usage')
        .select('conversations_used'),
      
      // Recent user activity (last 50 users)
      supabase
        .from('user_usage')
        .select('email, conversations_used, max_conversations, email_verified, created_at, last_conversation_at')
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (conversationsResult.error) {
      console.error('Error fetching conversations:', conversationsResult.error);
      return NextResponse.json({ error: 'Failed to fetch conversation data' }, { status: 500 });
    }

    const users = usersResult.data || [];
    const conversations = conversationsResult.data || [];
    const recentUsers = recentUsersResult.data || [];

    // Calculate stats
    const totalUsers = users.length;
    const totalVerifiedUsers = users.filter(u => u.email_verified).length;
    const totalUnverifiedUsers = totalUsers - totalVerifiedUsers;
    const totalConversations = conversations.reduce((sum, u) => sum + (u.conversations_used || 0), 0);
    const avgConversationsPerUser = totalUsers > 0 ? totalConversations / totalUsers : 0;
    const usersAtLimit = users.filter(u => u.conversations_used >= u.max_conversations).length;

    // Check for suspicious activity (simplified - could be enhanced)
    const { data: abuseData } = await supabase
      .from('usage_abuse_log')
      .select('email', { count: 'exact' });
    
    const suspiciousUsers = abuseData ? Math.min(abuseData.length, 50) : 0; // Cap at reasonable number

    // Anonymize email addresses for privacy (show first 3 chars + domain)
    const anonymizedRecentUsers = recentUsers.map(user => ({
      ...user,
      email: user.email.length > 3 
        ? user.email.substring(0, 3) + '***@' + user.email.split('@')[1]
        : '***@' + user.email.split('@')[1]
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