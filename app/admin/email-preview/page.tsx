"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Code, Smartphone, Monitor, CheckCircle, UserPlus, Shield } from 'lucide-react';

// Import email services
import { emailService } from '@/lib/services/email-service';

interface EmailTemplate {
  id: string;
  name: string;
  category: 'Authentication' | 'Onboarding' | 'System';
  icon: any;
  description: string;
  variants?: string[];
}

interface EmailPreviewProps {
  template?: EmailTemplate;
  variant?: string;
  viewMode: 'desktop' | 'mobile';
  contentType: 'html' | 'text';
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'email-verification',
    name: 'Email Verification',
    category: 'Authentication',
    icon: CheckCircle,
    description: 'Email verification for new users',
    variants: ['New User', 'Existing User']
  },
  {
    id: 'admin-verification',
    name: 'Admin Verification',
    category: 'System',
    icon: Shield,
    description: 'Admin access verification email'
  },
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    category: 'Onboarding', 
    icon: UserPlus,
    description: 'Welcome email for waitlist signups',
    variants: ['With Confirmation', 'Welcome Only']
  }
].sort((a, b) => a.name.localeCompare(b.name));

const EMAIL_CATEGORIES = EMAIL_TEMPLATES.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, EmailTemplate[]>);

function EmailPreview({ template, variant, viewMode, contentType }: EmailPreviewProps) {
  const sampleEmail = "user@example.com";
  const sampleToken = "sample-verification-token-123";
  
  // Use a consistent timestamp for hydration safety
  const previewTimestamp = new Date('2025-06-15T14:30:00').toLocaleString();
  
  const generateEmailHtml = () => {
    if (!template) {
      return '<p>No template selected</p>';
    }
    
    if (template.id === 'email-verification') {
      const isExistingUser = variant === 'Existing User';
      const sampleUrl = `http://localhost:5001/verify?token=${sampleToken}`;
      
      // Generate verification email using actual service
      const emailInstance = emailService as any;
      return emailInstance.generateVerificationEmailHTML({
        email: sampleEmail,
        verificationUrl: sampleUrl,
        isExistingUser
      });
    }
    
    if (template.id === 'admin-verification') {
      const sampleUrl = `http://localhost:5001/admin/verify?token=${sampleToken}`;
      
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
        <img src="https://duolog.ai/logo-email.png" alt="DuoLog.ai" class="logo" />
      </div>

      <div class="content">
        <h2>🔐 Admin Access Request</h2>
        
        <div class="admin-badge">
          🛡️ ADMIN VERIFICATION
        </div>
        
        <p>A request to access the DuoLog admin panel has been made for:</p>
        
        <p style="font-weight: 600; color: #FFFFFF; font-size: 18px; background: rgba(31, 41, 55, 0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(250, 250, 250, 0.1);">${sampleEmail}</p>
        
        <div class="button-wrapper">
          <a href="${sampleUrl}" class="button">🔓 Access Admin Panel</a>
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
          Admin verification requested at ${previewTimestamp}
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
    
    if (template.id === 'welcome-email') {
      const withConfirmation = variant === 'With Confirmation';
      
      return `
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
    }
    
    return '<p>Email template not found</p>';
  };

  const emailHtml = generateEmailHtml();

  const generateEmailText = () => {
    if (!template) {
      return 'No template selected';
    }
    
    if (template.id === 'email-verification') {
      const isExistingUser = variant === 'Existing User';
      const sampleUrl = `http://localhost:5001/verify?token=${sampleToken}`;
      
      // Generate verification email text using actual service
      const emailInstance = emailService as any;
      return emailInstance.generateVerificationEmailText({
        email: sampleEmail,
        verificationUrl: sampleUrl,
        isExistingUser
      });
    }
    
    if (template.id === 'admin-verification') {
      const sampleUrl = `http://localhost:5001/admin/verify?token=${sampleToken}`;
      
      return `
🔐 ADMIN ACCESS REQUEST - DuoLog.ai

A request to access the DuoLog admin panel has been made for: ${sampleEmail}

VERIFICATION LINK:
${sampleUrl}

SECURITY NOTICE:
• This link expires in 30 minutes
• Only use this link if you requested admin access
• Admin access provides full system control
• Never share this link with anyone

If you didn't request admin access, please ignore this email and contact support immediately if you're concerned about unauthorized access attempts.

---
This is an automated security email from DuoLog.ai
Admin verification requested at ${previewTimestamp}

Questions? Visit duolog.ai
      `.trim();
    }
    
    if (template.id === 'welcome-email') {
      const withConfirmation = variant === 'With Confirmation';
      
      return `
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
      `.trim();
    }
    
    return 'Email template not found';
  };

  const emailText = generateEmailText();

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
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | undefined>(EMAIL_TEMPLATES[0]);
  const [selectedVariant, setSelectedVariant] = useState<string>(EMAIL_TEMPLATES[0]?.variants?.[0] || '');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [contentType, setContentType] = useState<'html' | 'text'>('html');

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSelectedVariant(template.variants?.[0] || '');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Email List */}
      <div className="lg:col-span-1 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Email Templates</h1>
          <p className="text-on-dark-muted text-sm">
            Preview and test all email templates
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(EMAIL_CATEGORIES)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, templates]) => (
            <Card key={category} className="bg-background/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-on-dark-muted">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {templates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate?.id === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-on-dark shadow-md'
                          : 'border-neutral-600/30 hover:border-neutral-500 hover:bg-white/5 text-on-dark-muted hover:text-on-dark'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          isSelected ? 'text-primary' : 'text-on-dark-muted'
                        }`} />
                        <div>
                          <div className={`font-medium text-sm ${
                            isSelected ? 'text-on-dark' : 'text-on-dark-muted'
                          }`}>
                            {template.name}
                          </div>
                          <div className={`text-xs mt-1 ${
                            isSelected ? 'text-on-dark-muted' : 'text-neutral-500'
                          }`}>
                            {template.description}
                          </div>
                          {template.variants && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.variants.map((variant) => (
                                <Badge
                                  key={variant}
                                  variant="outline"
                                  className={`text-xs ${
                                    isSelected 
                                      ? 'border-primary/50 text-primary' 
                                      : 'border-neutral-600 text-neutral-400'
                                  }`}
                                >
                                  {variant}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Content - Preview */}
      <div className="lg:col-span-3 space-y-4">
        {/* Controls */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Template Variant */}
              {selectedTemplate?.variants && (
                <div>
                  <label className="text-sm font-medium text-on-dark-muted block mb-2">
                    Variant:
                  </label>
                  <div className="flex gap-2">
                    {selectedTemplate?.variants?.map((variant) => (
                      <Button
                        key={variant}
                        variant={selectedVariant === variant ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedVariant(variant)}
                        className="text-xs"
                      >
                        {variant}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* View Mode */}
              <div>
                <label className="text-sm font-medium text-on-dark-muted block mb-2">
                  View Mode:
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'desktop' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    Desktop
                  </Button>
                  <Button
                    variant={viewMode === 'mobile' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4 mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>

              {/* Content Type */}
              <div>
                <label className="text-sm font-medium text-on-dark-muted block mb-2">
                  Content:
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={contentType === 'html' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setContentType('html')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    HTML
                  </Button>
                  <Button
                    variant={contentType === 'text' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setContentType('text')}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Text
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card className="bg-background/50 flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {selectedTemplate?.name || 'No Template'} - {selectedVariant || 'No Variant'}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-on-dark-muted border-neutral-600">
                  {contentType === 'html' ? 'HTML' : 'Text'} · {viewMode}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100vh-20rem)] overflow-auto">
            <div className={`mx-auto border border-neutral-600/30 rounded-lg overflow-hidden ${
              viewMode === 'desktop' ? 'max-w-4xl' : 'max-w-sm'
            }`}>
              <EmailPreview 
                template={selectedTemplate}
                variant={selectedVariant}
                viewMode={viewMode}
                contentType={contentType}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}