"use client";

import { useState, useEffect } from 'react';
import { Settings, Key, AlertCircle, CheckCircle, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecureStorage } from '@/lib/utils/encryption';
import { toast } from 'sonner';
import { validateApiKey } from '@/lib/utils/input-validation';

interface APIKeys {
  openai: string;
  anthropic: string;
}

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: (keys: APIKeys) => void;
  selectedTone?: string;
  onToneChange?: (tone: string) => void;
  toneOptions?: Array<{ value: string; label: string; description: string }>;
}

export default function SettingsDialog({ 
  isOpen, 
  onClose, 
  onKeysUpdated, 
  selectedTone = 'conversational',
  onToneChange,
  toneOptions = []
}: SettingsDialogProps) {
  const [keys, setKeys] = useState<APIKeys>({ openai: '', anthropic: '' });
  const [savedKeys, setSavedKeys] = useState<APIKeys>({ openai: '', anthropic: '' });
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    openai: boolean | null;
    anthropic: boolean | null;
  }>({ openai: null, anthropic: null });

  // Load saved keys on mount
  useEffect(() => {
    if (isOpen) {
      const loadKeys = async () => {
        try {
          const stored = await SecureStorage.getItem('duolog-api-keys');
          if (stored) {
            const parsed = JSON.parse(stored);
            setKeys(parsed);
            setSavedKeys(parsed);
          }
        } catch (error) {
          console.error('Error loading saved keys:', error);
        }
      };
      loadKeys();
    }
  }, [isOpen]);

  const validateKeys = async () => {
    if (!keys.openai && !keys.anthropic) return;
    
    setValidating(true);
    setValidation({ openai: null, anthropic: null });

    // Check if these are mock keys
    const isMockKeys = keys.openai.includes('mock') || keys.anthropic.includes('mock');
    if (isMockKeys) {
      toast.warning('Mock keys cannot be validated - they are for testing encryption only');
      setValidation({ openai: false, anthropic: false });
      setValidating(false);
      return;
    }

    try {
      const response = await fetch('/api/chat/validate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidation(result.validation);
        
        // Show success/failure feedback
        const validCount = Object.values(result.validation).filter(Boolean).length;
        const totalCount = Object.values(result.validation).length;
        
        if (validCount === totalCount) {
          toast.success('All API keys are valid!');
        } else if (validCount > 0) {
          toast.warning(`${validCount}/${totalCount} keys are valid`);
        } else {
          toast.error('All API keys failed validation');
        }
      } else {
        setValidation({ openai: false, anthropic: false });
        toast.error('Validation failed - please check your keys');
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({ openai: false, anthropic: false });
      toast.error('Validation failed - please check your connection');
    } finally {
      setValidating(false);
    }
  };

  const saveKeys = async () => {
    try {
      await SecureStorage.setItem('duolog-api-keys', JSON.stringify(keys));
      setSavedKeys(keys);
      onKeysUpdated?.(keys);
      onClose();
    } catch (error) {
      console.error('Error saving keys:', error);
    }
  };

  const clearKeys = () => {
    SecureStorage.removeItem('duolog-api-keys');
    setKeys({ openai: '', anthropic: '' });
    setSavedKeys({ openai: '', anthropic: '' });
    setValidation({ openai: null, anthropic: null });
    onKeysUpdated?.({ openai: '', anthropic: '' });
  };

  const hasKeys = keys.openai || keys.anthropic;
  const keysChanged = keys.openai !== savedKeys.openai || keys.anthropic !== savedKeys.anthropic;
  const allKeysValid = validation.openai === true && validation.anthropic === true;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center lg:p-4 p-0">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-background/50 backdrop-blur-xl border border-white/10 lg:rounded-2xl rounded-none shadow-2xl lg:max-w-md w-full lg:max-h-[90vh] h-full lg:h-auto overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-dark">API Settings</h2>
              <p className="text-sm text-on-dark-muted">Add your own API keys for unlimited conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors hidden lg:flex"
          >
            <X className="w-4 h-4 text-on-dark-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Benefits */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="font-medium text-on-dark mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Why add your own keys?
            </h3>
            <ul className="text-sm text-on-dark-muted space-y-1">
              <li>• Unlimited conversations (no 5-chat limit)</li>
              <li>• Faster response times</li>
              <li>• Your data stays private</li>
              <li>• Support development costs</li>
            </ul>
          </div>

          {/* Tone Preference */}
          {toneOptions.length > 0 && onToneChange && (
            <div className="bg-on-dark/5 border border-on-dark/10 rounded-lg p-4">
              <h3 className="font-medium text-on-dark mb-3 flex items-center gap-2">
                🎭 AI Response Tone
              </h3>
              <div className="space-y-3">
                <select
                  value={selectedTone}
                  onChange={(e) => onToneChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-lg text-on-dark focus:border-primary focus:outline-none"
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-on-dark-muted">
                  {toneOptions.find(opt => opt.value === selectedTone)?.description || 'Select how the AIs should respond to your prompts'}
                </p>
              </div>
            </div>
          )}

          {/* OpenAI Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-dark flex items-center gap-2">
              OpenAI API Key
              {validation.openai === true && <CheckCircle className="w-4 h-4 text-success" />}
              {validation.openai === false && <AlertCircle className="w-4 h-4 text-error" />}
            </label>
            <input
              type="password"
              value={keys.openai}
              onChange={(e) => {
                const keyValidation = validateApiKey(e.target.value, 'openai');
                setKeys(prev => ({ ...prev, openai: keyValidation.sanitized }));
                
                // Client-side validation feedback
                if (!keyValidation.isValid && e.target.value.trim().length > 0) {
                  setValidation(prev => ({ ...prev, openai: false }));
                } else {
                  setValidation(prev => ({ ...prev, openai: null }));
                }
              }}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-lg text-on-dark placeholder-on-dark-muted focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-on-dark-muted">
              Get your key at{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                platform.openai.com/api-keys
              </a>
            </p>
          </div>

          {/* Anthropic Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-dark flex items-center gap-2">
              Anthropic API Key
              {validation.anthropic === true && <CheckCircle className="w-4 h-4 text-success" />}
              {validation.anthropic === false && <AlertCircle className="w-4 h-4 text-error" />}
            </label>
            <input
              type="password"
              value={keys.anthropic}
              onChange={(e) => {
                const keyValidation = validateApiKey(e.target.value, 'anthropic');
                setKeys(prev => ({ ...prev, anthropic: keyValidation.sanitized }));
                
                // Client-side validation feedback
                if (!keyValidation.isValid && e.target.value.trim().length > 0) {
                  setValidation(prev => ({ ...prev, anthropic: false }));
                } else {
                  setValidation(prev => ({ ...prev, anthropic: null }));
                }
              }}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-lg text-on-dark placeholder-on-dark-muted focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-on-dark-muted">
              Get your key at{' '}
              <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                console.anthropic.com/account/keys
              </a>
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-success mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-on-dark mb-1">Enhanced Security</h4>
                <p className="text-xs text-on-dark-muted">
                  Keys are encrypted using AES-256 encryption and stored locally in your browser. 
                  Validation makes minimal test calls. Keys are only sent when you start conversations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 p-6 border-t border-white/10">
          {/* Top row: Clear Keys and Test Mock Keys (dev only) */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearKeys}
                disabled={!hasKeys}
                className="bg-transparent border-error/30 text-error hover:bg-error/10"
              >
                Clear Keys
              </Button>
              
              {/* Development test button */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setKeys({
                      openai: 'sk-test-mock-openai-key-1234567890abcdef',
                      anthropic: 'sk-ant-test-mock-anthropic-key-1234567890abcdef'
                    });
                  }}
                  className="bg-transparent border-warning/30 text-warning hover:bg-warning/10"
                >
                  Use Mock Keys
                </Button>
              )}
            </div>
            
            {/* Validate button - only show when keys are changed */}
            {hasKeys && keysChanged && (
              <Button
                variant="outline"
                onClick={validateKeys}
                disabled={validating}
                className="bg-transparent border-on-dark/20 text-on-dark hover:bg-primary/10"
              >
                {validating ? 'Validating...' : 'Validate Keys'}
              </Button>
            )}
          </div>
          
          {/* Bottom row: Save button full width */}
          <Button
            onClick={saveKeys}
            disabled={!hasKeys || (!allKeysValid && validation.openai !== null)}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            Save Keys
          </Button>

          {/* Mobile Close Button */}
          <div className="lg:hidden pt-3 border-t border-white/10">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full bg-transparent border-on-dark/20 text-on-dark hover:bg-on-dark/10"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}