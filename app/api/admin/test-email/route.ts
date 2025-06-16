import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';
import { validateEmail } from '@/lib/utils/input-validation';
import { emailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const sessionToken = AdminAuth.getSessionFromRequest(request);
    const validation = await AdminAuth.validateSession(sessionToken || '');
    
    if (!validation.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, variant, testEmail } = body;

    // Validate inputs
    if (!templateId || !testEmail) {
      return NextResponse.json(
        { success: false, error: 'Template ID and test email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(testEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailValidation.errors[0] || 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    const cleanEmail = emailValidation.sanitized;
    
    let emailResult;

    // Generate test email based on template
    switch (templateId) {
      case 'user-verification':
        const isExistingUser = variant === 'Existing User';
        const userVerificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5001'}/verify?token=TEST_TOKEN_123`;
        
        emailResult = await emailService.sendVerificationEmail({
          email: cleanEmail,
          verificationUrl: userVerificationUrl,
          isExistingUser
        });
        break;

      case 'admin-verification':
        const adminVerificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5001'}/admin/verify?token=TEST_ADMIN_TOKEN_123`;
        
        emailResult = await emailService.sendEmail({
          to: cleanEmail,
          subject: 'TEST: DuoLog Admin Access - Verify Your Identity',
          html: generateTestAdminVerificationEmailHTML({
            email: cleanEmail,
            verificationUrl: adminVerificationUrl
          }),
          text: generateTestAdminVerificationEmailText({
            email: cleanEmail,
            verificationUrl: adminVerificationUrl
          })
        });
        break;

      case 'welcome-email':
        const withConfirmation = variant === 'With Confirmation';
        const confirmationToken = withConfirmation ? 'TEST_CONFIRMATION_TOKEN_123' : undefined;
        
        // Import and use the welcome email function
        const { sendWelcomeEmail } = await import('@/lib/resend');
        
        try {
          await sendWelcomeEmail({
            email: cleanEmail,
            confirmationToken
          });
          emailResult = { success: true };
        } catch (error) {
          console.error('Welcome email error:', error);
          emailResult = { success: false, error: 'Failed to send welcome email' };
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown template ID' },
          { status: 400 }
        );
    }

    if (!emailResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error || 'Failed to send test email' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Test email sent successfully to ${cleanEmail}`,
      template: templateId,
      variant: variant || null
    });

  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Test admin verification email template (using old CSS-based version for now)
function generateTestAdminVerificationEmailHTML({ email, verificationUrl }: { email: string; verificationUrl: string }) {
  const baseUrl = 'https://duolog.ai';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEST: Admin Access Verification - DuoLog.ai</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      margin: 0;
      padding: 0;
      background-color: #0d1117;
    }
    .wrapper {
      background-color: #0d1117;
      padding: 40px 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: rgba(31, 41, 55, 0.4);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .header { 
      background: rgba(31, 41, 55, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(250, 250, 250, 0.1);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      width: 150px;
      height: 40px;
      margin: 0 auto;
    }
    .content { 
      padding: 40px 30px;
      color: #D4D4D4;
    }
    .content h2 {
      color: #FFFFFF;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    .content p {
      margin: 0 0 20px 0;
      line-height: 1.7;
      color: #D4D4D4;
    }
    .test-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin: 16px 0;
    }
    .admin-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button-wrapper {
      text-align: center;
      margin: 40px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
      color: #FFFFFF !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
      transition: all 0.3s ease;
    }
    .security-notice {
      background: rgba(31, 41, 55, 0.6);
      border: 1px solid rgba(250, 250, 250, 0.1);
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .footer { 
      margin-top: 32px; 
      padding-top: 24px; 
      border-top: 1px solid rgba(250, 250, 250, 0.1); 
      font-size: 14px; 
      color: #FFFFFF; 
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="${baseUrl}/logo-email.png" alt="DuoLog.ai" class="logo" />
      </div>

      <div class="content">
        <div class="test-badge">
          🧪 TEST EMAIL
        </div>
        
        <h2>🔐 Admin Access Request</h2>
        
        <div class="admin-badge">
          🛡️ ADMIN VERIFICATION
        </div>
        
        <p>A request to access the DuoLog admin panel has been made for:</p>
        
        <p style="font-weight: 600; color: #FFFFFF; font-size: 18px; background: rgba(31, 41, 55, 0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(250, 250, 250, 0.1);">${email}</p>
        
        <div class="button-wrapper">
          <a href="${verificationUrl}" class="button">🔓 Access Admin Panel (TEST)</a>
        </div>
        
        <div class="security-notice">
          <p style="margin: 0; color: #D4D4D4;">
            <strong style="color: #FFFFFF;">This is a TEST email.</strong><br>
            • The verification link will not work<br>
            • This is for design and formatting testing only<br>
            • Check styling, images, and layout
          </p>
        </div>
      </div>

      <div class="footer">
        <p>
          This is a TEST email from DuoLog.ai<br>
          Test sent at ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateTestAdminVerificationEmailText({ email, verificationUrl }: { email: string; verificationUrl: string }) {
  return `
🧪 TEST EMAIL - ADMIN ACCESS REQUEST

A request to access the DuoLog admin panel has been made for: ${email}

TEST VERIFICATION LINK (will not work):
${verificationUrl}

This is a TEST email for design and formatting testing only.

---
Test email sent at ${new Date().toLocaleString()}
`;
}