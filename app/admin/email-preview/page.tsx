"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Code, Smartphone, Monitor } from 'lucide-react';

// Import the email function to get the template
import { sendWelcomeEmail } from '@/lib/resend';

interface EmailPreviewProps {
  withConfirmation: boolean;
  viewMode: 'desktop' | 'mobile';
  contentType: 'html' | 'text';
}

function EmailPreview({ withConfirmation, viewMode, contentType }: EmailPreviewProps) {
  // Generate the email HTML (we'll extract this logic)
  const sampleEmail = "user@example.com";
  const sampleToken = withConfirmation ? "sample-confirmation-token-123" : undefined;
  
  const emailHtml = `
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
              <img src="http://localhost:5001/logo-email.png" alt="DuoLog.ai" class="logo" />
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
              ${withConfirmation ? `
                <div class="button-wrapper">
                  <a href="http://localhost:5001/confirm?token=${sampleToken}" class="button">Confirm Your Email</a>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>© 2025 DuoLog.ai - Two AI minds. One perfect response.</p>
              <p>You're receiving this because you signed up for early access at <a href="http://localhost:5001">duolog.ai</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const emailText = `
You're on the early access list! 🎉

Thank you for your interest in DuoLog.ai - where two AI minds collaborate to give you the perfect response.

We're working hard to bring you the best AI collaboration experience. As an early access member, you'll be among the first to:

- Experience real-time AI collaboration between ChatGPT and Claude
- Get the best answers from multiple AI models working together
- Save time by eliminating copy-pasting between different AI tools

We'll notify you as soon as we're ready to launch. Stay tuned for something amazing!

${withConfirmation ? `Confirm your email: http://localhost:5001/confirm?token=${sampleToken}` : ''}

© 2025 DuoLog.ai - Two AI minds. One perfect response.
You're receiving this because you signed up for early access at duolog.ai
  `;

  if (contentType === 'text') {
    return (
      <div className="w-full h-full bg-neutral-50 text-neutral-900 p-6 font-mono text-sm whitespace-pre-wrap">
        {emailText}
      </div>
    );
  }

  return (
    <div 
      className={`mx-auto transition-all duration-300 ${
        viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
      }`}
      style={{ 
        transform: viewMode === 'mobile' ? 'scale(0.8)' : 'scale(1)',
        transformOrigin: 'top center'
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
    </div>
  );
}

export default function EmailPreviewPage() {
  const [withConfirmation, setWithConfirmation] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [contentType, setContentType] = useState<'html' | 'text'>('html');

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Preview</h1>
        <p className="text-on-dark-muted">
          Preview and test email templates with different configurations
        </p>
      </div>

      {/* Controls */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Type */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-on-dark-muted min-w-[100px]">Email Type:</span>
            <div className="flex gap-2">
              <Button
                variant={withConfirmation ? "default" : "outline"}
                size="sm"
                onClick={() => setWithConfirmation(true)}
                className="hover:scale-105 transition-transform"
              >
                With Confirmation
              </Button>
              <Button
                variant={!withConfirmation ? "default" : "outline"}
                size="sm"
                onClick={() => setWithConfirmation(false)}
                className="hover:scale-105 transition-transform"
              >
                Welcome Only
              </Button>
            </div>
            {withConfirmation && (
              <Badge variant="outline" className="ml-2 text-on-dark-muted border-neutral-600">
                Includes confirmation button
              </Badge>
            )}
          </div>

          {/* View Mode */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-on-dark-muted min-w-[100px]">View Mode:</span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'desktop' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="hover:scale-105 transition-transform"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={viewMode === 'mobile' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="hover:scale-105 transition-transform"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Content Type */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-on-dark-muted min-w-[100px]">Content:</span>
            <div className="flex gap-2">
              <Button
                variant={contentType === 'html' ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType('html')}
                className="hover:scale-105 transition-transform"
              >
                <Eye className="w-4 h-4 mr-2" />
                HTML Preview
              </Button>
              <Button
                variant={contentType === 'text' ? "default" : "outline"}
                size="sm"
                onClick={() => setContentType('text')}
                className="hover:scale-105 transition-transform"
              >
                <Code className="w-4 h-4 mr-2" />
                Text Version
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {contentType === 'html' ? 'HTML Email Preview' : 'Text Email Preview'}
            </CardTitle>
            <Badge variant="outline" className="text-on-dark-muted border-neutral-600">
              {viewMode === 'desktop' ? 'Desktop view' : 'Mobile view'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`mx-auto border border-neutral-600/30 rounded-lg overflow-hidden ${
            viewMode === 'desktop' ? 'max-w-4xl' : 'max-w-sm'
          }`}>
            <EmailPreview 
              withConfirmation={withConfirmation}
              viewMode={viewMode}
              contentType={contentType}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}