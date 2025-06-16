"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mail, MessageSquare, AlertTriangle, RefreshCw, TrendingUp, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DailyConversationsChart from '@/app/admin/components/DailyConversationsChart';

interface AnalyticsData {
  totalUsers: number;
  totalVerifiedUsers: number;
  totalUnverifiedUsers: number;
  totalConversations: number;
  avgConversationsPerUser: number;
  suspiciousUsers: number;
  usersAtLimit: number;
  recentSignups: Array<{
    email: string;
    conversations_used: number;
    max_conversations: number;
    email_verified: boolean;
    created_at: string;
    last_conversation_at?: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserUsage = async (email: string) => {
    setResettingUser(email);
    try {
      const response = await fetch('/api/admin/reset-user-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset user usage');
      }
      
      // Refresh analytics data
      await fetchAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset user usage');
    } finally {
      setResettingUser(null);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge variant="outline" className="bg-success/20 text-success border-success/30">
        Verified
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
        Unverified
      </Badge>
    );
  };

  const getUsageBadge = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) {
      return <Badge className="bg-error/20 text-error border-error/30">At Limit</Badge>;
    } else if (percentage >= 66) {
      return <Badge className="bg-warning/20 text-warning border-warning/30">High Usage</Badge>;
    } else {
      return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Analytics</h1>
          <p className="text-on-dark-muted">Loading analytics data...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white shadow-sm animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Analytics</h1>
          <p className="text-error">Error loading analytics: {error}</p>
        </div>
        <Button onClick={fetchAnalytics} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Analytics</h1>
          <p className="text-on-dark-muted">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Analytics</h1>
          <p className="text-on-dark-muted">
            Track user signups, email verifications, and conversation usage stats
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.totalUsers}</div>
            <p className="text-xs text-gray-500">
              {data.totalVerifiedUsers} verified, {data.totalUnverifiedUsers} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm text-on-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-on-light-muted">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.totalConversations}</div>
            <p className="text-xs text-gray-500">
              {data.avgConversationsPerUser.toFixed(1)} avg per user
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Email Verification</CardTitle>
            <Mail className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {((data.totalVerifiedUsers / data.totalUsers) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500">
              {data.totalVerifiedUsers} of {data.totalUsers} verified
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">At Usage Limit</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.usersAtLimit}</div>
            <p className="text-xs text-gray-500">
              {data.suspiciousUsers > 0 && (
                <span className="text-warning">{data.suspiciousUsers} suspicious</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Conversations Chart */}
      <DailyConversationsChart className="bg-white shadow-sm" />

      {/* Recent Signups */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            Recent User Activity
          </CardTitle>
          <CardDescription className="text-on-light-muted">
            Latest user signups and their usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentSignups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent signups</p>
          ) : (
            <div className="space-y-4">
              {data.recentSignups.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Signed up {formatDate(user.created_at)}
                        {user.last_conversation_at && (
                          <span> • Last active {formatDate(user.last_conversation_at)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getVerificationBadge(user.email_verified)}
                    {getUsageBadge(user.conversations_used, user.max_conversations)}
                    <Badge variant="outline" className="text-gray-600">
                      {user.conversations_used}/{user.max_conversations}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetUserUsage(user.email)}
                      disabled={resettingUser === user.email}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      {resettingUser === user.email ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      {data.suspiciousUsers > 0 && (
        <Card className="bg-white shadow-sm border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Suspicious Activity Alert
            </CardTitle>
            <CardDescription>
              {data.suspiciousUsers} users flagged for suspicious behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Review users with multiple emails from same fingerprint or IP address.
              This could indicate attempts to bypass usage limits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}