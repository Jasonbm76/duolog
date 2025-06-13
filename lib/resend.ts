import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS;

if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

if (!RESEND_FROM_ADDRESS) {
  throw new Error('Missing RESEND_FROM_ADDRESS environment variable');
}

export const resend = new Resend(RESEND_API_KEY);

export interface WelcomeEmailData {
  email: string;
  confirmationToken?: string;
}

export async function sendWelcomeEmail({ email, confirmationToken }: WelcomeEmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_ADDRESS,
      to: email,
      subject: 'Welcome to DuoLog.ai - Early Access',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DuoLog.ai</title>
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
              .content ul {
                margin: 20px 0;
                padding-left: 20px;
              }
              .content li {
                margin: 10px 0;
                color: #D4D4D4;
              }
              .icon-list {
                list-style: none;
                padding: 0;
              }
              .icon-list li {
                display: flex;
                align-items: start;
                margin: 15px 0;
              }
              .icon-list .icon {
                width: 24px;
                height: 24px;
                margin-right: 15px;
                flex-shrink: 0;
                background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
              }
              .button-wrapper {
                text-align: center;
                margin: 40px 0;
              }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%);
                color: #FFFFFF !important;
                padding: 14px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
                transition: all 0.3s ease;
              }
              .button:hover {
                box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
                transform: translateY(-2px);
              }
              .footer { 
                padding: 30px;
                text-align: center;
                color: #71717A;
                font-size: 14px;
                border-top: 1px solid rgba(250, 250, 250, 0.1);
              }
              .footer p {
                margin: 5px 0;
                color: #71717A;
              }
              .footer a {
                color: #93C5FD;
                text-decoration: none;
              }
              .highlight {
                background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="DuoLog.ai" class="logo" />
                </div>
                <div class="content">
                  <h2>You're on the early access list! 🎉</h2>
                  <p>Thank you for your interest in <span class="highlight">DuoLog.ai</span> - where two AI minds collaborate to give you the perfect response.</p>
                  <p>We're working hard to bring you the best AI collaboration experience. As an early access member, you'll be among the first to:</p>
                  <ul class="icon-list">
                    <li>
                      <span class="icon">✨</span>
                      <span>Experience real-time AI collaboration between ChatGPT and Claude</span>
                    </li>
                    <li>
                      <span class="icon">🚀</span>
                      <span>Get the best answers from multiple AI models working together</span>
                    </li>
                    <li>
                      <span class="icon">⚡</span>
                      <span>Save time by eliminating copy-pasting between different AI tools</span>
                    </li>
                  </ul>
                  <p>We'll notify you as soon as we're ready to launch. Stay tuned for something amazing!</p>
                  ${confirmationToken ? `
                    <div class="button-wrapper">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/confirm?token=${confirmationToken}" class="button">Confirm Your Email</a>
                    </div>
                  ` : ''}
                </div>
                <div class="footer">
                  <p>© 2025 DuoLog.ai - Two AI minds. One perfect response.</p>
                  <p>You're receiving this because you signed up for early access at <a href="${process.env.NEXT_PUBLIC_APP_URL}">duolog.ai</a></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
You're on the early access list! 🎉

Thank you for your interest in DuoLog.ai - where two AI minds collaborate to give you the perfect response.

We're working hard to bring you the best AI collaboration experience. As an early access member, you'll be among the first to:

- Experience real-time AI collaboration
- Get the best answers from multiple AI models  
- Save time by eliminating copy-pasting between different AI tools

We'll notify you as soon as we're ready to launch. Stay tuned!

${confirmationToken ? `Confirm your email: ${process.env.NEXT_PUBLIC_APP_URL}/confirm?token=${confirmationToken}` : ''}

© 2025 DuoLog.ai - Two AI minds. One perfect response.
You're receiving this because you signed up for early access at duolog.ai
      `
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}