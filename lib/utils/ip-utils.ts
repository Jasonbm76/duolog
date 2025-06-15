import { NextRequest } from 'next/server';

// Extract real IP address from request headers
export function extractIPAddress(request: NextRequest): string {
  // Try multiple headers to get the real IP (in order of preference)
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback to connection remote address
  const remoteAddress = request.ip;
  if (remoteAddress && isValidIP(remoteAddress)) {
    return remoteAddress;
  }

  // For local development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  // Ultimate fallback
  return 'unknown';
}

// Validate IP address format
function isValidIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  // Remove potential port number
  const cleanIP = ip.split(':')[0];
  
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
  
  if (ipv4Regex.test(cleanIP)) {
    // Validate IPv4 octets
    const octets = cleanIP.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  if (ipv6Regex.test(cleanIP)) {
    return true;
  }
  
  return false;
}

// Check if IP is from a private network
export function isPrivateIP(ip: string): boolean {
  if (!isValidIP(ip)) return false;
  
  // Private IPv4 ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./, // localhost
    /^169\.254\./, // link-local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

// Check if IP might be from a VPN/proxy (basic detection)
export function isLikelyVPN(ip: string): boolean {
  if (!isValidIP(ip) || isPrivateIP(ip)) return false;
  
  // This is a basic check - in production you'd use a service like IPQualityScore
  // For now, we'll just flag some common VPN providers' IP ranges
  const knownVPNRanges = [
    /^185\.199\./, // Some VPN providers
    /^104\.16\./, // Cloudflare (could be VPN)
    // Add more as needed
  ];
  
  return knownVPNRanges.some(range => range.test(ip));
}

// Get approximate location from IP (basic)
export function getCountryCodeFromIP(ip: string): string {
  // In production, integrate with a geolocation service
  // For now, return unknown
  return 'unknown';
}

// Create a hash of IP for storage (privacy-friendly)
export function hashIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  
  // Simple hash function for IP addresses
  let hash = 0;
  if (ip.length === 0) return hash.toString();
  
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Rate limiting by IP
export class IPRateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(ip);

    if (!attempt) {
      this.attempts.set(ip, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > attempt.resetTime) {
      // Reset the window
      this.attempts.set(ip, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (attempt.count >= this.maxAttempts) {
      return true;
    }

    attempt.count++;
    return false;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [ip, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime) {
        this.attempts.delete(ip);
      }
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new IPRateLimiter(20, 60000); // 20 requests per minute

// Start cleanup process
if (typeof window === 'undefined') {
  setInterval(() => {
    globalRateLimiter.cleanup();
  }, 60000); // Cleanup every minute
}