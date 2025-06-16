"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { validateEmail } from '@/lib/utils/input-validation';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  variants?: string[];
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'user-verification',
    name: 'User Email Verification',
    description: 'Verification email sent to users when they enter their email in chat',
    variants: ['New User', 'Existing User']
  },
  {
    id: 'admin-verification', 
    name: 'Admin Email Verification',
    description: 'Verification email sent to admin users for admin panel access',
  },
  {
    id: 'welcome-email',
    name: 'Welcome/Waitlist Email',
    description: 'Welcome email sent to early access signups',
    variants: ['With Confirmation', 'Welcome Only']
  }
];

export default function EmailTestPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [selectedVariant, setSelectedVariant] = useState<string>(EMAIL_TEMPLATES[0].variants?.[0] || '');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<{ template: string; variant: string; email: string } | null>(null);

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSelectedVariant(template.variants?.[0] || '');
  };

  const handleSendTest = async () => {
    // Validate email
    const emailValidation = validateEmail(testEmail);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.errors[0] || 'Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variant: selectedVariant,
          testEmail: emailValidation.sanitized
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test email sent successfully!');
        setLastSent({
          template: selectedTemplate.name,
          variant: selectedVariant,
          email: emailValidation.sanitized
        });
      } else {
        toast.error(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Network error - please try again');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Testing</h1>
        <p className="text-on-dark-muted">
          Send test emails to yourself to preview and perfect the templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Email Template Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Cards */}
            <div className="space-y-3">
              {EMAIL_TEMPLATES.map((template) => {
                const isSelected = selectedTemplate.id === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-on-dark shadow-md'
                        : 'border-neutral-600/30 hover:border-neutral-500 hover:bg-white/5 text-on-dark-muted hover:text-on-dark'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Mail className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        isSelected ? 'text-primary' : 'text-on-dark-muted'
                      }`} />
                      <div>
                        <div className={`font-medium ${
                          isSelected ? 'text-on-dark' : 'text-on-dark-muted'
                        }`}>
                          {template.name}
                        </div>
                        <div className={`text-sm mt-1 ${
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
            </div>

            {/* Variant Selection */}
            {selectedTemplate.variants && (
              <div className="pt-4 border-t border-neutral-600/30">
                <label className="text-sm font-medium text-on-dark-muted block mb-2">
                  Template Variant:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variants.map((variant) => (
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
          </CardContent>
        </Card>

        {/* Email Testing */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Test Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Template Info */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-medium text-on-dark">Selected Template</span>
              </div>
              <p className="text-sm text-on-dark-muted mb-1">{selectedTemplate.name}</p>
              {selectedVariant && (
                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                  {selectedVariant}
                </Badge>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="testEmail" className="text-sm font-medium text-on-dark-muted block mb-2">
                Send test email to:
              </label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@domain.com"
                className="bg-white/5 border-white/10 text-on-dark placeholder-on-dark-muted focus:border-primary/50 focus:ring-primary/50"
                disabled={isSending}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendTest}
              disabled={isSending || !testEmail.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
            >
              {isSending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Test Email...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Test Email
                </div>
              )}
            </Button>

            {/* Last Sent Info */}
            <AnimatePresence>
              {lastSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-success/10 border border-success/20 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-medium text-success">Last Test Sent</span>
                  </div>
                  <div className="text-sm text-on-dark-muted space-y-1">
                    <p><strong>Template:</strong> {lastSent.template}</p>
                    {lastSent.variant && <p><strong>Variant:</strong> {lastSent.variant}</p>}
                    <p><strong>Sent to:</strong> {lastSent.email}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instructions */}
            <div className="bg-warning/5 border border-warning/10 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm text-on-dark-muted">
                  <p className="font-medium text-warning mb-1">Testing Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Check your inbox (and spam folder)</li>
                    <li>• Test on different email clients (Gmail, Outlook, Apple Mail)</li>
                    <li>• Verify images, buttons, and styling render correctly</li>
                    <li>• Make sure links work and point to the right URLs</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}