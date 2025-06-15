// Simple usage tracking for free tier limits
// In production, use Supabase for persistent storage

interface UsageResult {
  allowed: boolean;
  used: number;
  limit: number;
}

interface UsageEntry {
  count: number;
  createdAt: number;
}

class UsageTracker {
  private usage = new Map<string, UsageEntry>();
  private readonly maxFreeConversations = 5;

  async checkLimit(sessionId: string, email?: string): Promise<UsageResult> {
    const identifier = email || sessionId;
    const entry = this.usage.get(identifier);

    if (!entry) {
      return {
        allowed: true,
        used: 0,
        limit: this.maxFreeConversations,
      };
    }

    return {
      allowed: entry.count < this.maxFreeConversations,
      used: entry.count,
      limit: this.maxFreeConversations,
    };
  }

  async increment(sessionId: string, email?: string): Promise<void> {
    const identifier = email || sessionId;
    const entry = this.usage.get(identifier);

    if (!entry) {
      this.usage.set(identifier, {
        count: 1,
        createdAt: Date.now(),
      });
    } else {
      entry.count++;
    }
  }

  async getUsage(sessionId: string, email?: string): Promise<{ used: number; limit: number }> {
    const identifier = email || sessionId;
    const entry = this.usage.get(identifier);

    return {
      used: entry?.count || 0,
      limit: this.maxFreeConversations,
    };
  }

  // Clean up old entries (older than 24 hours)
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      for (const [key, entry] of this.usage.entries()) {
        if (now - entry.createdAt > twentyFourHours) {
          this.usage.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Clean up every hour
  }
}

export const usageTracker = new UsageTracker();

// Start cleanup process
if (typeof window === 'undefined') {
  usageTracker.startCleanup();
}