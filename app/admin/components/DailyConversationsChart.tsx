"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageSquare, Calendar, BarChart3, RefreshCw } from 'lucide-react';

interface DailyConversationData {
  date: string;
  conversation_count: number;
}

interface DailyConversationsChartProps {
  className?: string;
}

export default function DailyConversationsChart({ className }: DailyConversationsChartProps) {
  const [data, setData] = useState<DailyConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/analytics/daily-conversations?days=30');
      const result = await response.json();

      if (result.success) {
        console.log('Chart data received:', result.data);
        const last5 = result.data.slice(-5);
        console.log('Last 5 dates in data:', last5.map(d => ({ date: d.date, count: d.conversation_count })));
        console.log('Today should be 2025-06-16, last date is:', result.data[result.data.length - 1]?.date);
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching daily conversations:', err);
      setError('Failed to load conversation data');
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!data.length) return { total: 0, average: 0, maxValue: 0, trend: 0 };
    
    const total = data.reduce((sum, item) => sum + item.conversation_count, 0);
    const average = total / 30; // Always 30 days
    const maxValue = Math.max(...data.map(d => d.conversation_count));
    
    // Calculate trend (last 7 days vs previous 7 days)
    const recent7 = data.slice(-7).reduce((sum, item) => sum + item.conversation_count, 0);
    const previous7 = data.slice(-14, -7).reduce((sum, item) => sum + item.conversation_count, 0);
    const trend = previous7 > 0 ? ((recent7 - previous7) / previous7) * 100 : 0;
    
    return { total, average, maxValue, trend };
  }, [data]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-on-light">
            <BarChart3 className="w-5 h-5 text-primary" />
            Conversation Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-on-light-muted">Loading conversation data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-on-light">
            <BarChart3 className="w-5 h-5 text-primary" />
            Conversation Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-error" />
              </div>
              <p className="text-sm text-error font-medium">Error loading data</p>
              <p className="text-xs text-on-light-muted">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-on-light">
            <BarChart3 className="w-5 h-5 text-primary" />
            Conversation Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-600 font-medium">No data available</p>
              <p className="text-xs text-on-light-muted">No conversations found in the last 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
                         <CardTitle className="flex items-center gap-2 text-lg font-semibold mb-2 text-on-light">
               <BarChart3 className="w-5 h-5 text-primary" />
               Conversation Activity
             </CardTitle>
             <p className="text-sm text-on-light-muted">
               Daily conversation volume over the last 30 days
             </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              className="h-8 px-3 hover:bg-primary hover:text-white hover:border-primary transition-colors"
              disabled={loading}
              title="Refresh chart data"
            >
              <RefreshCw className={`w-3 h-3 text-primary ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">30 days</span>
            </div>
          </div>
        </div>
        
        {/* Analytics Summary */}
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-on-light-muted" />
            <span className="text-sm text-on-light-muted">
              <span className="font-semibold text-on-light">{analytics.total}</span> total conversations
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-on-light-muted" />
            <span className="text-sm text-on-light-muted">
              <span className="font-semibold text-on-light">{analytics.average.toFixed(1)}</span> daily average
            </span>
          </div>
          {analytics.trend !== 0 && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${analytics.trend > 0 ? 'bg-success' : 'bg-error'}`} />
              <span className={`text-xs font-medium ${analytics.trend > 0 ? 'text-success' : 'text-error'}`}>
                {analytics.trend > 0 ? '+' : ''}{analytics.trend.toFixed(1)}% this week
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="relative pl-12">
          {/* Chart Container */}
          <div className="flex items-end gap-1 h-64 px-4 pt-4 pb-8 bg-gradient-to-t from-primary/2 to-transparent rounded-lg border border-neutral-200/50">
            {data.map((item, index) => {
              const maxValue = Math.max(analytics.maxValue, 1);
              const heightPercent = (item.conversation_count / maxValue) * 100;
              const isHighest = item.conversation_count === analytics.maxValue && analytics.maxValue > 0;
              const hasConversations = item.conversation_count > 0;
              
              // Calculate actual pixel height for the inner chart area (h-64 = 256px, minus padding)
              const chartHeight = 256 - 48; // 256px - (16px padding top + 32px padding bottom)
              const barHeightPixels = hasConversations ? Math.max((heightPercent / 100) * chartHeight, 4) : 2;
              
              return (
                <div
                  key={item.date}
                  className="flex-1 flex flex-col justify-end items-center group relative h-full"
                  title={`${formatDate(item.date)}: ${item.conversation_count} conversations`}
                >
                  {/* Bar */}
                  <div 
                    className={`w-full max-w-full transition-all duration-300 rounded-t-md relative overflow-hidden ${
                      hasConversations 
                        ? 'bg-gradient-to-t from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                        : 'bg-neutral-200/30 hover:bg-neutral-200/50'
                    }`}
                    style={{ 
                      height: `${barHeightPixels}px`
                    }}
                  >
                    {/* Shimmer effect for active bars */}
                    {hasConversations && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    )}
                    
                    {/* Highlight for highest value */}
                    {isHighest && (
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-400/30 to-transparent" />
                    )}
                  </div>
                  
                  {/* Value Label */}
                  {hasConversations && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-neutral-900 text-white text-xs px-2 py-1 rounded-md shadow-lg">
                        {item.conversation_count}
                      </div>
                    </div>
                  )}
                  
                  {/* Date Label */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 rotate-45 text-xs text-on-light-muted whitespace-nowrap">
                    {index % 5 === 0 || index === data.length - 1 ? formatDate(item.date) : ''}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-64 flex flex-col justify-between py-4">
            {(() => {
              const maxValue = Math.max(analytics.maxValue, 1);
              const labels = [];
              
              if (maxValue <= 10) {
                // For small numbers, show each integer from max down to 0
                for (let i = maxValue; i >= 0; i--) {
                  labels.push(i);
                }
              } else {
                // For larger numbers, create 5-6 sensible intervals
                const interval = Math.ceil(maxValue / 5);
                for (let i = Math.ceil(maxValue / interval) * interval; i >= 0; i -= interval) {
                  labels.push(i);
                }
              }
              
              return labels.map((value, index) => (
                <div key={index} className="text-xs text-on-light-muted font-mono">
                  {value}
                </div>
              ));
            })()}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-200/50">
          <p className="text-xs text-on-light-muted">
            Hover over bars to see exact values • Data refreshes every hour
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-on-light-muted">
              Debug: Max: {analytics.maxValue}, Data points: {data.length}, Has data: {data.some(d => d.conversation_count > 0) ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}