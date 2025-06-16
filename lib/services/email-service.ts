interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationEmailOptions {
  email: string;
  verificationUrl: string;
  isExistingUser?: boolean;
}

class EmailService {
  private resendApiKey: string | undefined;
  private fromEmail: string;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || process.env.RESEND_FROM_ADDRESS || 'DuoLog.ai <noreply@duolog.ai>';
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
    // Development bypass - just log the email
    if (process.env.NODE_ENV === 'development' && !this.resendApiKey) {
      console.log('\n📧 EMAIL WOULD BE SENT (Development Mode):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.text || 'HTML content');
      console.log('---\n');
      
      return { 
        success: true, 
        messageId: `dev-${Date.now()}` 
      };
    }

    if (!this.resendApiKey) {
      console.error('No Resend API key configured');
      return { 
        success: false, 
        error: 'Email service not configured' 
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Resend API error:', result);
        return { 
          success: false, 
          error: result.message || 'Failed to send email' 
        };
      }

      return { 
        success: true, 
        messageId: result.id 
      };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: 'Network error sending email' 
      };
    }
  }

  async sendVerificationEmail(options: VerificationEmailOptions): Promise<{ success: boolean; error?: string }> {
    const { email, verificationUrl, isExistingUser = false } = options;

    const subject = isExistingUser 
      ? 'Verify your email to continue using DuoLog'
      : 'Welcome to DuoLog - Verify your email to get started';

    const html = this.generateVerificationEmailHTML({
      email,
      verificationUrl,
      isExistingUser
    });

    const text = this.generateVerificationEmailText({
      email,
      verificationUrl,
      isExistingUser
    });

    const result = await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });

    return {
      success: result.success,
      error: result.error
    };
  }

  private generateVerificationEmailHTML({ email, verificationUrl, isExistingUser }: VerificationEmailOptions): string {
    const greeting = isExistingUser 
      ? 'Welcome back!' 
      : 'Welcome to DuoLog!';
    
    const subtitle = isExistingUser
      ? 'Please verify your email to continue accessing your conversations.'
      : 'Experience Claude + GPT-4 working together to give you the best possible answers.';

    const baseUrl = 'https://duolog.ai';

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email - DuoLog.ai</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <!-- Wrapper Table -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0d1117; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #1f2937; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #374151; padding: 40px 30px; border-bottom: 1px solid rgba(250, 250, 250, 0.1);">
              <img src="${baseUrl}/logo-email.png" alt="DuoLog.ai" width="150" height="40" style="display: block; border: 0; outline: none; text-decoration: none;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; color: #D4D4D4;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 20px 0; color: #FFFFFF; font-size: 24px; font-weight: 600; line-height: 1.3;">${greeting}</h2>
              <p style="margin: 0 0 20px 0; color: #D4D4D4; line-height: 1.7; font-size: 16px;">${subtitle}</p>
              
              <!-- Main Message -->
              <p style="margin: 0 0 20px 0; color: #D4D4D4; line-height: 1.7; font-size: 16px;">
                Hi there! Please verify your email address to ${isExistingUser ? 'continue using' : 'start using'} DuoLog:
              </p>
              
              <!-- Email Display -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #374151; padding: 12px; border-radius: 8px; border: 1px solid rgba(250, 250, 250, 0.1);">
                    <p style="margin: 0; font-weight: 600; color: #FFFFFF; font-size: 18px; text-align: center;">${email}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 40px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); background-color: #2563EB; border-radius: 8px;">
                          <a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Notice -->
              <p style="margin: 20px 0; color: #D4D4D4; font-size: 14px; line-height: 1.7;">
                This link will expire in 1 hour for security reasons.
              </p>
              
            </td>
          </tr>
          
          ${!isExistingUser ? `
          <!-- Features Section -->
          <tr>
            <td style="padding: 0 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #374151; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="margin: 0 0 20px 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">What you'll get:</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #10b981; font-weight: bold; margin-right: 12px;">✓</span>
                          <span style="color: #D4D4D4;">3 free AI collaboration sessions</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #10b981; font-weight: bold; margin-right: 12px;">✓</span>
                          <span style="color: #D4D4D4;">Claude + GPT-4 working together on your questions</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #10b981; font-weight: bold; margin-right: 12px;">✓</span>
                          <span style="color: #D4D4D4;">Cross-device conversation history</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #10b981; font-weight: bold; margin-right: 12px;">✓</span>
                          <span style="color: #D4D4D4;">Option to bring your own API keys for unlimited use</span>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Trouble Section -->
          <tr>
            <td style="padding: 0 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #374151; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #D4D4D4; font-size: 14px; line-height: 1.7;">
                      <strong style="color: #FFFFFF;">Having trouble?</strong> Copy and paste this link into your browser:<br>
                      <span style="font-family: monospace; font-size: 12px; word-break: break-all; color: #2563EB;">${verificationUrl}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; border-top: 1px solid rgba(250, 250, 250, 0.1); color: #FFFFFF; font-size: 14px; text-align: center;">
              <p style="margin: 0 0 16px 0; line-height: 1.7; color: #FFFFFF;">
                If you didn't request this email, you can safely ignore it.<br>
                This verification link will expire in 1 hour.
              </p>
              <p style="margin: 0; line-height: 1.7; color: #FFFFFF;">
                Questions? Reply to this email or visit <a href="https://duolog.ai" style="color: #2563EB; text-decoration: none;">duolog.ai</a>
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
  }

  private generateVerificationEmailText({ email, verificationUrl, isExistingUser }: VerificationEmailOptions): string {
    const greeting = isExistingUser ? 'Welcome back!' : 'Welcome to DuoLog!';
    
    return `
${greeting}

Please verify your email address to ${isExistingUser ? 'continue using' : 'start using'} DuoLog:

Email: ${email}
Verification Link: ${verificationUrl}

${!isExistingUser ? `
What you'll get:
• 3 free AI collaboration sessions
• Claude + GPT-4 working together on your questions  
• Cross-device conversation history
• Option to bring your own API keys for unlimited use
` : ''}

This link will expire in 1 hour for security reasons.

If you didn't request this email, you can safely ignore it.

Questions? Visit https://duolog.ai

---
DuoLog - AI Collaboration Platform
`;
  }
}

export const emailService = new EmailService();