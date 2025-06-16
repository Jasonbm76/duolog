import validator from 'validator';

// DOMPurify for browser environments only
let DOMPurify: any = null;
if (typeof window !== 'undefined') {
  try {
    DOMPurify = require('dompurify');
  } catch (error) {
    console.warn('DOMPurify not available in browser environment');
  }
}

/**
 * Comprehensive input validation and sanitization utilities
 * Protects against XSS, SQL injection, and enforces business rules
 */

interface EmailValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

interface TextValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

export class InputValidator {
  
  /**
   * Validate and sanitize email addresses
   * - No + characters allowed (prevents email aliasing abuse)
   * - Standard email format validation
   * - Length limits for security
   * - Domain validation
   */
  static validateEmail(email: string): EmailValidationResult {
    const errors: string[] = [];
    let sanitized = '';

    try {
      // Basic sanitization
      const trimmed = email?.toString().trim() || '';
      
      // Check for empty input
      if (!trimmed) {
        errors.push('Email is required');
        return { isValid: false, sanitized: '', errors };
      }

      // Length validation (prevent DoS)
      if (trimmed.length > 254) {
        errors.push('Email address is too long');
      }

      if (trimmed.length < 5) {
        errors.push('Email address is too short');
      }

      // Sanitize and normalize
      sanitized = validator.normalizeEmail(trimmed, {
        all_lowercase: true,
        gmail_lowercase: true,
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        gmail_convert_googlemaildotcom: true,
        outlookdotcom_lowercase: true,
        outlookdotcom_remove_subaddress: false,
        yahoo_lowercase: true,
        yahoo_remove_subaddress: false,
        icloud_lowercase: true,
        icloud_remove_subaddress: false
      }) || trimmed.toLowerCase();

      // Check for + character (business rule - prevents aliasing abuse)
      if (sanitized.includes('+')) {
        errors.push('Email addresses with + characters are not allowed');
      }

      // Advanced email validation (allow developer@test.local for development)
      const isDeveloperTestEmail = sanitized === 'developer@test.local';
      
      if (!isDeveloperTestEmail && !validator.isEmail(sanitized, {
        allow_utf8_local_part: false,
        require_tld: true,
        allow_ip_domain: false,
        domain_specific_validation: true,
        blacklisted_chars: '+<>()[]{}|\\,;:',
        host_blacklist: []
      })) {
        errors.push('Please enter a valid email address');
      }

      // Additional security checks
      if (sanitized.includes('<') || sanitized.includes('>') || sanitized.includes('"')) {
        errors.push('Email contains invalid characters');
      }

      // Block common throwaway email domains
      const throwawayDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com',
        'yopmail.com',
        'temp-mail.org',
        'throwaway.email'
      ];

      const domain = sanitized.split('@')[1];
      if (domain && throwawayDomains.includes(domain.toLowerCase())) {
        errors.push('Temporary email addresses are not allowed');
      }

      return {
        isValid: errors.length === 0,
        sanitized,
        errors
      };

    } catch (error) {
      console.error('Email validation error:', error);
      return {
        isValid: false,
        sanitized: '',
        errors: ['Invalid email format']
      };
    }
  }

  /**
   * Validate and sanitize general text input
   * - XSS protection with DOMPurify
   * - Length limits
   * - Character restrictions
   */
  static validateText(text: string, options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowSpecialChars?: boolean;
  } = {}): TextValidationResult {
    const {
      maxLength = 1000,
      minLength = 0,
      allowHtml = false,
      allowSpecialChars = true
    } = options;

    const errors: string[] = [];
    let sanitized = '';

    try {
      // Basic sanitization
      const trimmed = text?.toString().trim() || '';

      // Length validation
      if (trimmed.length < minLength) {
        errors.push(`Text must be at least ${minLength} characters`);
      }

      if (trimmed.length > maxLength) {
        errors.push(`Text must be no more than ${maxLength} characters`);
      }

      // XSS Protection
      if (DOMPurify) {
        if (allowHtml) {
          // Allow basic HTML but sanitize dangerous elements
          sanitized = DOMPurify.sanitize(trimmed, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true,
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
            SANITIZE_DOM: true
          });
        } else {
          // Strip all HTML
          sanitized = DOMPurify.sanitize(trimmed, { 
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true 
          });
        }
      } else {
        // Fallback: Basic HTML stripping without DOMPurify
        if (allowHtml) {
          // Allow basic tags, strip dangerous ones
          sanitized = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
                            .replace(/<embed[^>]*>/gi, '')
                            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
                            .replace(/on\w+\s*=\s*'[^']*'/gi, '')
                            .replace(/javascript:/gi, '');
        } else {
          // Strip all HTML tags
          sanitized = trimmed.replace(/<[^>]*>/g, '');
        }
      }

      // Additional character restrictions
      if (!allowSpecialChars) {
        // Only allow alphanumeric, spaces, and basic punctuation
        const allowedCharsRegex = /^[a-zA-Z0-9\s.,!?-]*$/;
        if (!allowedCharsRegex.test(sanitized)) {
          errors.push('Text contains invalid characters');
        }
      }

      // Check for potential SQL injection patterns (defense in depth)
      // Note: Be careful not to block normal user text like contractions and quotes
      const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s+)/gi,
        /(;\s*(DROP|DELETE|INSERT|UPDATE|CREATE))/gi,
        /(\bunion\s+select)/gi,
        /(--\s*[^\r\n]*)/g, // SQL comments but not double hyphens in normal text
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
      ];

      // Only flag as SQL injection if we find actual SQL patterns, not just quotes/apostrophes
      const hasSqlInjection = sqlInjectionPatterns.some(pattern => pattern.test(sanitized));
      if (hasSqlInjection) {
        errors.push('Text contains invalid characters');
        // Basic cleanup - remove dangerous SQL patterns but preserve normal quotes
        sanitized = sanitized.replace(/(;\s*(DROP|DELETE|INSERT|UPDATE|CREATE))/gi, '')
                            .replace(/(\bunion\s+select)/gi, '')
                            .replace(/(--\s*[^\r\n]*)/g, '');
      }

      return {
        isValid: errors.length === 0,
        sanitized,
        errors
      };

    } catch (error) {
      console.error('Text validation error:', error);
      return {
        isValid: false,
        sanitized: '',
        errors: ['Invalid input format']
      };
    }
  }

  /**
   * Validate API tokens and secrets
   */
  static validateApiKey(key: string, keyType: 'openai' | 'anthropic'): TextValidationResult {
    const errors: string[] = [];
    let sanitized = key?.toString().trim() || '';

    // Basic validation
    if (!sanitized) {
      errors.push(`${keyType} API key is required`);
      return { isValid: false, sanitized: '', errors };
    }

    // Length and format validation based on key type
    if (keyType === 'openai') {
      if (!sanitized.startsWith('sk-')) {
        errors.push('OpenAI API key must start with "sk-"');
      }
      if (sanitized.length < 20 || sanitized.length > 100) {
        errors.push('OpenAI API key has invalid length');
      }
    } else if (keyType === 'anthropic') {
      if (!sanitized.startsWith('sk-ant-')) {
        errors.push('Anthropic API key must start with "sk-ant-"');
      }
      if (sanitized.length < 20 || sanitized.length > 150) {
        errors.push('Anthropic API key has invalid length');
      }
    }

    // Security checks
    const allowedChars = /^[a-zA-Z0-9_-]+$/;
    if (!allowedChars.test(sanitized)) {
      errors.push('API key contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string): boolean {
    return validator.isUUID(uuid, 4);
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId: string): boolean {
    // Session IDs should be alphanumeric and reasonable length
    const sessionRegex = /^[a-zA-Z0-9_-]{8,64}$/;
    return sessionRegex.test(sessionId);
  }

  /**
   * Sanitize URL parameters
   */
  static sanitizeUrlParam(param: string): string {
    try {
      const decoded = decodeURIComponent(param);
      if (DOMPurify) {
        return DOMPurify.sanitize(decoded, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      } else {
        // Fallback: Basic HTML stripping
        return decoded.replace(/<[^>]*>/g, '');
      }
    } catch {
      return '';
    }
  }
}

/**
 * Express middleware for request validation
 */
export function validateRequest(req: any, res: any, next: any) {
  // Sanitize common request fields
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        if (key === 'email') {
          const emailValidation = InputValidator.validateEmail(value);
          if (!emailValidation.isValid) {
            return res.status(400).json({
              error: 'Invalid email',
              details: emailValidation.errors
            });
          }
          req.body[key] = emailValidation.sanitized;
        } else {
          const textValidation = InputValidator.validateText(value, {
            maxLength: key === 'prompt' ? 5000 : 1000
          });
          if (!textValidation.isValid) {
            return res.status(400).json({
              error: `Invalid ${key}`,
              details: textValidation.errors
            });
          }
          req.body[key] = textValidation.sanitized;
        }
      }
    }
  }

  next();
}

// Export convenience functions
export const validateEmail = InputValidator.validateEmail;
export const validateText = InputValidator.validateText;
export const validateApiKey = InputValidator.validateApiKey;
export const validateUUID = InputValidator.validateUUID;
export const validateSessionId = InputValidator.validateSessionId;