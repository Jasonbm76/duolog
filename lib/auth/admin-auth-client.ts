/**
 * Client-side admin authentication utilities
 * Browser-only methods that don't require server imports
 */
export class AdminAuthClient {
  /**
   * Check if admin email is verified in localStorage (browser-based bypass)
   */
  static isAdminVerifiedLocally(email: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const verifiedAdmins = localStorage.getItem('duolog_verified_admins');
      if (!verifiedAdmins) return false;
      
      const verifiedList: string[] = JSON.parse(verifiedAdmins);
      return verifiedList.includes(email.toLowerCase());
    } catch (error) {
      console.error('Error checking local admin verification:', error);
      return false;
    }
  }

  /**
   * Mark admin email as verified in localStorage
   */
  static markAdminVerifiedLocally(email: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const verifiedAdmins = localStorage.getItem('duolog_verified_admins');
      let verifiedList: string[] = verifiedAdmins ? JSON.parse(verifiedAdmins) : [];
      
      const emailLower = email.toLowerCase();
      if (!verifiedList.includes(emailLower)) {
        verifiedList.push(emailLower);
        localStorage.setItem('duolog_verified_admins', JSON.stringify(verifiedList));
      }
    } catch (error) {
      console.error('Error saving local admin verification:', error);
    }
  }

  /**
   * Clear all locally verified admins (useful for testing or security)
   */
  static clearLocallyVerifiedAdmins(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('duolog_verified_admins');
    } catch (error) {
      console.error('Error clearing local admin verification:', error);
    }
  }
}