"use client";

// Browser fingerprinting for user identification without cookies
// This creates a semi-permanent identifier that persists across sessions

interface FingerprintData {
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
  colorDepth: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  doNotTrack: string;
  canvas: string;
  webgl: string;
}

// Generate a canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Draw text with various properties
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('DuoLog.ai 🤖', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser fingerprint', 4, 45);

    // Add some geometric shapes
    ctx.beginPath();
    ctx.arc(50, 50, 20, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

// Generate a WebGL fingerprint
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';

    return `${renderer}|${vendor}`;
  } catch (e) {
    return 'webgl-error';
  }
}

// Get device memory (if available)
function getDeviceMemory(): number {
  return (navigator as any).deviceMemory || 0;
}

// Get hardware concurrency
function getHardwareConcurrency(): number {
  return navigator.hardwareConcurrency || 0;
}

// Get max touch points
function getMaxTouchPoints(): number {
  return navigator.maxTouchPoints || 0;
}

// Generate comprehensive browser fingerprint
export function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  try {
    const data: FingerprintData = {
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      colorDepth: screen.colorDepth,
      deviceMemory: getDeviceMemory(),
      hardwareConcurrency: getHardwareConcurrency(),
      maxTouchPoints: getMaxTouchPoints(),
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
    };

    // Create a hash of all the data
    const fingerprintString = JSON.stringify(data);
    return hashString(fingerprintString);
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    return 'fingerprint-error';
  }
}

// Simple hash function for fingerprinting
function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Generate or retrieve persistent ID from localStorage
export function getPersistentId(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  try {
    const key = 'duolog-persistent-id';
    let persistentId = localStorage.getItem(key);
    
    if (!persistentId) {
      // Generate new persistent ID
      persistentId = generateRandomId();
      localStorage.setItem(key, persistentId);
    }
    
    return persistentId;
  } catch (error) {
    // localStorage might be disabled
    return 'localStorage-disabled';
  }
}

// Generate random ID
function generateRandomId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

// Create composite user identifier
export function createUserIdentifier(): {
  composite: string;
  fingerprint: string;
  persistentId: string;
} {
  const fingerprint = generateBrowserFingerprint();
  const persistentId = getPersistentId();
  
  // Create composite identifier that combines multiple factors
  const composite = hashString(`${fingerprint}|${persistentId}`);
  
  return {
    composite,
    fingerprint,
    persistentId,
  };
}

// Check if user is likely using incognito/private browsing
export function isLikelyIncognito(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Test for common incognito indicators
    const storage = window.localStorage;
    const sessionStorage = window.sessionStorage;
    
    // Check if localStorage behaves strangely
    const testKey = 'duolog-incognito-test';
    try {
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
    } catch (e) {
      return true; // localStorage likely disabled
    }

    // Check for low device memory (common in incognito)
    const deviceMemory = getDeviceMemory();
    if (deviceMemory > 0 && deviceMemory < 2) {
      return true;
    }

    // Check for other indicators
    if (navigator.webdriver) {
      return true; // Automated browser
    }

    return false;
  } catch (error) {
    return true; // Error suggests restricted environment
  }
}