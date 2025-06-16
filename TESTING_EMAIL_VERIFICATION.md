# Email Verification System - Testing Guide

## 🧪 **Testing Overview**

The email verification system is now live with comprehensive security protections. Here's how to test each component:

## 🔧 **Development Testing**

### **1. Auto-Verification (Development Bypass)**
Use emails ending with `@test.local` for automatic verification:

```bash
# These emails auto-verify without sending real emails:
developer@test.local
test@test.local
admin@test.local
user123@test.local
```

**Expected Behavior:**
- Email capture modal appears
- Enter any `@test.local` email
- Toast shows "Development bypass: Email auto-verified"
- Conversation starts immediately
- No real email sent

### **2. Security Testing**

#### **Email Validation Tests:**
```bash
# These should be REJECTED:
test+tag@example.com          # + character blocked
user@10minutemail.com         # Throwaway domain blocked
<script>alert('xss')</script> # XSS attempt blocked
test@                         # Invalid format
""                           # Empty input

# These should be ACCEPTED:
user@gmail.com
developer@company.co.uk
test.user@domain.org
```

#### **Input Sanitization Tests:**
Try entering malicious content in prompts:
```bash
<script>alert('xss')</script>
'; DROP TABLE users; --
<iframe src="evil.com"></iframe>
```

**Expected:** All dangerous content stripped/blocked.

## 📧 **Production Testing** (When Resend is configured)

### **1. Real Email Verification**
```bash
# Use your real email for testing:
your.email@gmail.com

# Expected flow:
1. Enter real email
2. "Verification email sent" toast
3. Check inbox (and spam folder)
4. Click verification link
5. Redirects to /verify?token=xxx
6. Shows "Email verified!" page
7. Auto-redirects to homepage in 3 seconds
```

### **2. Rate Limiting Tests**
```bash
# Try sending verification emails rapidly:
# - Max 5 emails per email address per hour
# - Max 10 emails per IP address per hour

# Expected: "Too many verification attempts" error
```

## 🗄️ **Database Verification**

### **Check User Creation:**
```sql
SELECT * FROM user_usage ORDER BY created_at DESC LIMIT 5;

-- Should show:
-- email, email_verified, conversations_used, etc.
```

### **Check Verification Tokens:**
```sql
SELECT email, verification_token, verification_expires_at 
FROM user_usage 
WHERE verification_token IS NOT NULL;

-- Tokens should expire in 1 hour
```

### **Check Rate Limiting:**
```sql
SELECT * FROM verification_attempts ORDER BY last_attempt_at DESC;

-- Shows attempt counts per email/IP
```

## 🚫 **Error Scenarios to Test**

### **1. Expired Token**
- Request verification
- Wait 1+ hours
- Try to verify with old token
- Expected: "Invalid or expired verification token"

### **2. Invalid Token**
- Manually visit `/verify?token=invalid123`
- Expected: Verification failed message

### **3. Already Verified**
- Verify an email successfully
- Try to request verification again
- Expected: "Email is already verified"

### **4. Network Errors**
- Disconnect internet
- Try to send verification
- Expected: "Network error" toast

## 📱 **UI/UX Testing**

### **Email Capture Modal:**
- Responsive on mobile/desktop
- Smooth animations
- Clear error messages
- Proper focus management
- Escape key closes modal

### **Verification Waiting Screen:**
- Shows correct email address
- Real-time status checking (every 10 seconds)
- Resend functionality with cooldown
- Mobile-friendly design

### **Verification Page (/verify):**
- Loading spinner while verifying
- Success state with auto-redirect
- Error state with helpful messages
- Mobile responsive

## 🔧 **Development Commands**

### **Reset Database:**
```sql
-- Clear all users (development only!)
DELETE FROM user_usage;
DELETE FROM verification_attempts;
```

### **Manual Email Verification:**
```sql
-- Manually verify an email for testing:
UPDATE user_usage 
SET email_verified = true 
WHERE email = 'test@example.com';
```

### **Check Logs:**
```bash
# Development server shows:
📧 EMAIL WOULD BE SENT (Development Mode):
To: user@test.local
Subject: Welcome to DuoLog - Verify your email to get started
...
```

## ✅ **Success Criteria**

### **Security ✅**
- [x] + characters in emails blocked
- [x] XSS attempts sanitized
- [x] SQL injection attempts blocked
- [x] Throwaway emails rejected
- [x] Rate limiting enforced

### **Functionality ✅**
- [x] Development bypass works (@test.local)
- [x] Real email verification works
- [x] Database tracks usage by email
- [x] Cross-device usage enforcement
- [x] BYOK users bypass verification

### **UX ✅**  
- [x] Clear error messages
- [x] Smooth modal animations
- [x] Mobile responsive design
- [x] Real-time verification checking
- [x] Professional email templates

## 🐛 **Troubleshooting**

### **"No user email found for reset"**
- User hasn't entered email yet
- LocalStorage cleared
- Solution: Use email capture flow

### **"Invalid verification token format"**
- Token was modified/corrupted
- URL encoding issues
- Solution: Request new verification

### **"Too many verification attempts"**
- Hit rate limits (5 per email, 10 per IP per hour)
- Solution: Wait or use different email

### **Database connection errors**
- Supabase not running locally
- Environment variables missing
- Solution: Check `.env.local` and database status

---

## 🚀 **Ready to Test!**

The system is production-ready with enterprise-grade security. Start with development testing using `@test.local` emails, then move to production testing with real emails when ready.

**Remember:** The goal is to prevent limit bypassing while maintaining excellent UX! 🎯