"use client";

// Client-side encryption for API keys
// Uses Web Crypto API for secure encryption/decryption

class ClientEncryption {
  private static async getKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('duolog-salt-2025'), // Static salt for consistency
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private static generateDeviceKey(): string {
    // Generate a device-specific key based on browser characteristics
    if (typeof window === 'undefined') return 'server-fallback';
    
    const deviceInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    
    // Simple hash of device info
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
      const char = deviceInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `device-${Math.abs(hash).toString(36)}`;
  }

  static async encrypt(text: string): Promise<string> {
    if (!text || typeof window === 'undefined') return text;
    
    try {
      const deviceKey = this.generateDeviceKey();
      const key = await this.getKey(deviceKey);
      
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Fallback to unencrypted
    }
  }

  static async decrypt(encryptedText: string): Promise<string> {
    if (!encryptedText || typeof window === 'undefined') return encryptedText;
    
    try {
      const deviceKey = this.generateDeviceKey();
      const key = await this.getKey(deviceKey);
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Return as-is if decryption fails
    }
  }

  // Check if a string appears to be encrypted
  static isEncrypted(text: string): boolean {
    if (!text) return false;
    
    // Check if it's valid base64 and reasonable length for encrypted data
    try {
      const decoded = atob(text);
      return decoded.length > 12 && text.length > 20; // IV is 12 bytes + some data
    } catch {
      return false;
    }
  }
}

// Secure storage wrapper
export class SecureStorage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await ClientEncryption.encrypt(value);
      localStorage.setItem(`encrypted_${key}`, encrypted);
    } catch (error) {
      console.error('Secure storage set failed:', error);
      // Fallback to regular storage
      localStorage.setItem(key, value);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      // First try encrypted storage
      const encrypted = localStorage.getItem(`encrypted_${key}`);
      if (encrypted) {
        const decrypted = await ClientEncryption.decrypt(encrypted);
        return decrypted;
      }
      
      // Fallback to regular storage (for migration)
      const regular = localStorage.getItem(key);
      if (regular) {
        // Migrate to encrypted storage
        await this.setItem(key, regular);
        localStorage.removeItem(key); // Remove unencrypted version
        return regular;
      }
      
      return null;
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return localStorage.getItem(key);
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(`encrypted_${key}`);
    localStorage.removeItem(key); // Also remove unencrypted version
  }

  static async clear(): Promise<void> {
    // Clear all encrypted items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('encrypted_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export default ClientEncryption;