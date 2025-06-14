// Simple in-memory rate limiter for chat attempts
// In production, this should use Redis or a database

interface AttemptRecord {
  count: number;
  lastAttempt: Date;
  resetTime: Date;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private readonly maxAttempts = 3;
  private readonly resetPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Get client IP from various sources
  getClientIP(request: Request): string {
    // Get IP from various headers (common in production with proxies)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback for development
    return '127.0.0.1';
  }

  // Generate a more robust client identifier
  getClientIdentifier(request: Request): string {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const acceptLanguage = request.headers.get('accept-language') || 'unknown';
    
    // Create a hash of IP + browser fingerprint
    // This makes it harder to bypass by just changing IP
    const identifier = `${ip}:${userAgent.substring(0, 50)}:${acceptLanguage.substring(0, 20)}`;
    return identifier;
  }

  // Check if client can make an attempt
  canAttempt(request: Request): { allowed: boolean; remaining: number; resetTime?: Date } {
    const identifier = this.getClientIdentifier(request);
    const now = new Date();
    
    let record = this.attempts.get(identifier);
    
    // Clean up old records or reset if past reset time
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        lastAttempt: now,
        resetTime: new Date(now.getTime() + this.resetPeriod)
      };
      this.attempts.set(identifier, record);
    }

    const remaining = Math.max(0, this.maxAttempts - record.count);
    
    return {
      allowed: record.count < this.maxAttempts,
      remaining,
      resetTime: record.resetTime
    };
  }

  // Record an attempt
  recordAttempt(request: Request): void {
    const identifier = this.getClientIdentifier(request);
    const now = new Date();
    
    let record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        lastAttempt: now,
        resetTime: new Date(now.getTime() + this.resetPeriod)
      };
    } else {
      record.count += 1;
      record.lastAttempt = now;
    }
    
    this.attempts.set(identifier, record);
  }

  // Get status for a client
  getStatus(request: Request): { attempts: number; remaining: number; resetTime: Date } {
    const identifier = this.getClientIdentifier(request);
    const now = new Date();
    
    let record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      const resetTime = new Date(now.getTime() + this.resetPeriod);
      return {
        attempts: 0,
        remaining: this.maxAttempts,
        resetTime
      };
    }

    return {
      attempts: record.count,
      remaining: Math.max(0, this.maxAttempts - record.count),
      resetTime: record.resetTime
    };
  }

  // Clean up old records (call periodically)
  cleanup(): void {
    const now = new Date();
    for (const [identifier, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(identifier);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Clean up every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}