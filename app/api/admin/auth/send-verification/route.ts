import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/auth/admin-auth';
import { validateEmail } from '@/lib/utils/input-validation';
import { emailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email format
    const emailValidation = validateEmail(email);
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

    // Check if email is authorized admin
    if (!AdminAuth.isAdminEmail(cleanEmail)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email not authorized for admin access' 
        },
        { status: 403 }
      );
    }

    // Generate admin verification token
    const tokenResult = await AdminAuth.generateAdminToken(cleanEmail);
    
    if (!tokenResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: tokenResult.error || 'Failed to generate verification token' 
        },
        { status: 500 }
      );
    }

    // Send admin verification email
    console.log('🔍 Environment variables check:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      VERCEL_URL: process.env.VERCEL_URL,
    });
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:5001';
                   
    console.log('🔗 Admin verification URL being used:', baseUrl);
    const verificationUrl = `${baseUrl}/admin/verify?token=${tokenResult.token}`;
    
    const emailResult = await emailService.sendEmail({
      to: cleanEmail,
      subject: 'DuoLog Admin Access - Verify Your Identity',
      html: generateAdminVerificationEmailHTML({
        email: cleanEmail,
        verificationUrl
      }),
      text: generateAdminVerificationEmailText({
        email: cleanEmail,
        verificationUrl
      })
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error || 'Failed to send verification email' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin verification email sent successfully'
    });

  } catch (error) {
    console.error('Admin verification email error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

function generateAdminVerificationEmailHTML({ email, verificationUrl }: { email: string; verificationUrl: string }) {
  // Use the same email service template with admin-specific content
  const baseUrl = 'https://duolog.ai';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Access Verification - DuoLog.ai</title>
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
        <h2>🔐 Admin Access Request</h2>
        
        <div class="admin-badge">
          🛡️ ADMIN VERIFICATION
        </div>
        
        <p>A request to access the DuoLog admin panel has been made for:</p>
        
        <p style="font-weight: 600; color: #FFFFFF; font-size: 18px; background: rgba(31, 41, 55, 0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(250, 250, 250, 0.1);">${email}</p>
        
        <div class="button-wrapper">
          <a href="${verificationUrl}" class="button">🔓 Access Admin Panel</a>
        </div>
        
        <div class="security-notice">
          <p style="margin: 0; color: #D4D4D4;">
            <strong style="color: #FFFFFF;">Security Notice:</strong><br>
            • This link expires in 30 minutes<br>
            • Only use this link if you requested admin access<br>
            • Admin access provides full system control<br>
            • Never share this link with anyone
          </p>
        </div>
        
        <p style="font-size: 14px; color: #D4D4D4;">
          If you didn't request admin access, please ignore this email and contact support immediately if you're concerned about unauthorized access attempts.
        </p>
      </div>

      <div class="footer">
        <p>
          This is an automated security email from DuoLog.ai<br>
          Admin verification requested at ${new Date().toLocaleString()}
        </p>
        <p style="margin-top: 16px;">
          Questions? Visit <a href="https://duolog.ai" style="color: #2563EB; text-decoration: none;">duolog.ai</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateAdminVerificationEmailText({ email, verificationUrl }: { email: string; verificationUrl: string }) {
  return `
🔐 ADMIN ACCESS REQUEST - DuoLog.ai

A request to access the DuoLog admin panel has been made for: ${email}

ADMIN VERIFICATION LINK:
${verificationUrl}

SECURITY NOTICE:
• This link expires in 30 minutes
• Only use this link if you requested admin access  
• Admin access provides full system control
• Never share this link with anyone

If you didn't request admin access, please ignore this email and contact support immediately if you're concerned about unauthorized access attempts.

---
This is an automated security email from DuoLog.ai
Admin verification requested at ${new Date().toLocaleString()}

Questions? Visit https://duolog.ai
`;
}