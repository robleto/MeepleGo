# Manual QA: Authentication Flows

This document provides comprehensive test scenarios, procedures, and a results template for manually testing all authentication flows in MeepleGo. Use this guide to verify auth functionality on both desktop and mobile platforms before launch.

## Overview

**Purpose**: Validate all authentication flows work correctly across platforms and browsers.

**Test Environment Requirements**:

- 2-3 test email addresses (see [Test Email Setup](#test-email-setup))
- Desktop browsers: Chrome, Safari, Firefox
- Mobile devices: iOS (Safari), Android (Chrome)
- Access to test email inboxes

**Testing Time**: Approximately 2-3 hours for complete coverage

---

## Test Email Setup

### Creating Test Accounts

Use real email addresses you control for testing. Recommended approaches:

1. **Gmail Plus Addressing**: Use `yourname+test1@gmail.com`, `yourname+test2@gmail.com`
   - All emails go to your main inbox but appear as separate accounts
   - Easy to filter and organize test emails

2. **Multiple Provider Accounts**: Create accounts across different providers
   - Gmail: `test1@gmail.com`
   - Outlook: `test2@outlook.com`
   - iCloud: `test3@icloud.com`
   - Tests deliverability across major email providers

3. **Dedicated Test Domain**: Use `qa1@yourdomain.com` if you control a domain
   - Most professional approach
   - Requires mailbox setup

### Test Account Recommendations

For comprehensive testing, create at least:

- **Test User 1**: Clean account for happy path testing
- **Test User 2**: Account with known password for invalid credential testing
- **Test User 3**: Account for cross-browser and mobile testing

**Tips**:

- Keep one account with a known bad password to test error messages
- Document test credentials in a secure location (password manager)
- Save screenshots of emails and flows for documentation

---

## Test Scenarios

### 1. Sign Up with Email + Magic Link

**Objective**: Verify new users can sign up and confirm their email via magic link.

#### Test Steps

1. **Navigate to Sign Up Page**
   - Open browser and go to `/signup` or `/auth/providers`
   - Verify page loads correctly

2. **Enter Email and Request Magic Link**
   - Enter test email address
   - Submit the form
   - Note: Some implementations may require password, adjust accordingly

3. **Check Email Receipt**
   - Open email inbox for test account
   - Verify confirmation email arrives (within 30 seconds)
   - Check email is in Inbox (not Spam/Promotions)
   - Verify email headers if possible:
     - SPF: pass
     - DKIM: pass
     - DMARC: pass

4. **Click Magic Link**
   - Click the link in the email
   - Verify redirect to `/auth/callback`
   - Verify final redirect to `/` (home page)

5. **Verify Session Persistence**
   - Check that navigation shows authenticated state
   - Refresh the page
   - Verify user remains logged in
   - Check user profile/avatar appears in nav

#### Expected Results

- ✅ Email arrives within 30 seconds
- ✅ Email lands in Inbox (not spam)
- ✅ Magic link redirects correctly through `/auth/callback` to `/`
- ✅ Session persists after page refresh
- ✅ Navigation shows authenticated state (user profile, logout option)

#### Common Issues

- Email delayed or in spam → Check DNS/SMTP configuration
- Link doesn't work → Verify redirect URLs in Supabase settings
- Session doesn't persist → Check cookie settings and CORS configuration

---

### 2. Login with Email/Password

**Objective**: Verify existing users can log in with email and password.

#### Test Steps

**A. Valid Credentials Test**

1. **Navigate to Login Page**
   - Go to `/login` or equivalent
   - Verify page loads correctly

2. **Enter Valid Credentials**
   - Enter email and password for existing test account
   - Submit the form

3. **Verify Successful Login**
   - Verify redirect to `/` or previous page (`next` parameter)
   - Check navigation shows authenticated state
   - Verify session persists on refresh

**B. Invalid Credentials Test**

1. **Enter Invalid Email**
   - Use non-existent email address
   - Submit the form
   - Verify friendly error message appears
   - Example: "Invalid email or password" (not "User not found")

2. **Enter Invalid Password**
   - Use valid email with wrong password
   - Submit the form
   - Verify friendly error message appears
   - Should match email error for security (no user enumeration)

3. **Empty Fields**
   - Submit with empty email and/or password
   - Verify validation messages appear

#### Expected Results

**Valid Credentials**:

- ✅ User logs in successfully
- ✅ Redirects to `/` or preserved `next` parameter URL
- ✅ Navigation shows authenticated state
- ✅ Session persists on refresh

**Invalid Credentials**:

- ✅ Friendly, non-specific error message displayed
- ✅ No user enumeration (same error for invalid email/password)
- ✅ User remains on login page
- ✅ Can retry login

#### Common Issues

- Specific errors reveal user existence → Update error messages to be generic
- No error feedback → Add error state handling to login form
- Redirect loop → Check authentication middleware and route guards

---

### 3. Password Recovery

**Objective**: Verify users can reset their password via email link.

#### Test Steps

1. **Navigate to Password Reset Page**
   - Go to `/forgot-password` or equivalent
   - Or click "Forgot password?" link from login page

2. **Request Password Reset**
   - Enter valid email address
   - Submit the form
   - Verify confirmation message ("Check your email...")

3. **Check Email Receipt**
   - Open email inbox for test account
   - Verify reset email arrives (within 30 seconds)
   - Check email is in Inbox (not Spam)

4. **Click Reset Link**
   - Click the reset link in the email
   - Verify redirect to `/auth/callback`
   - Verify final redirect to `/update-password`

5. **Set New Password**
   - Enter new password
   - Confirm new password
   - Submit the form
   - Verify success message

6. **Verify Password Changed**
   - Sign out (if not already signed out)
   - Attempt login with old password → should fail
   - Attempt login with new password → should succeed

#### Expected Results

- ✅ Reset email arrives within 30 seconds
- ✅ Email lands in Inbox (not spam)
- ✅ Reset link redirects correctly to `/update-password`
- ✅ New password is accepted and saved
- ✅ Can log in with new password
- ✅ Cannot log in with old password

#### Common Issues

- Link redirects to error page → Check Supabase redirect URL configuration
- Password doesn't change → Verify update-password page handler
- Can still use old password → Check password hash update logic

---

### 4. Expired/Invalid Link

**Objective**: Verify expired or invalid auth links are handled gracefully.

#### Test Steps

1. **Test Expired Magic Link**
   - Request a magic link for sign up or login
   - Wait for link to expire (typically 1 hour)
   - Click the expired link
   - Verify friendly error message
   - Expected redirect: `/login?error=otp_expired` or similar

2. **Test Expired Reset Link**
   - Request password reset
   - Wait for link to expire (typically 1 hour)
   - Click the expired link
   - Verify friendly error message

3. **Test Invalid/Malformed Link**
   - Manually modify a valid link URL (change token parameter)
   - Visit the malformed link
   - Verify error handling (not application crash)

4. **Test Already-Used Link**
   - Use a valid magic/reset link successfully
   - Try using the same link again
   - Verify appropriate error message

#### Expected Results

- ✅ Expired links show friendly error message
- ✅ User is redirected to login or relevant page with error parameter
- ✅ Error message explains the issue clearly
- ✅ User can request new link easily
- ✅ Invalid links don't cause application errors
- ✅ Already-used links are rejected appropriately

#### Common Issues

- Generic 404 error → Add error handling to callback route
- Application crash → Add try-catch to token validation
- Confusing error message → Update UI to explain action needed

---

### 5. Sign Out / Sign In

**Objective**: Verify users can sign out and sign back in correctly.

#### Test Steps

1. **Sign In**
   - Log in with valid credentials
   - Verify authenticated state

2. **Navigate Around App**
   - Visit protected pages (profile, lists, rankings)
   - Verify access is granted

3. **Sign Out**
   - Click sign out button in navigation
   - Verify user is signed out
   - Check navigation no longer shows authenticated state

4. **Verify Protected Page Behavior**
   - Attempt to visit protected page (e.g., `/profile`)
   - Verify appropriate behavior:
     - Option A: Redirect to `/login` with `next` parameter
     - Option B: Show login modal
     - Option C: Show "Sign in required" message

5. **Sign In Again**
   - Go to login page
   - Enter valid credentials
   - Submit form
   - Verify successful login
   - If `next` parameter was set, verify redirect to original page

6. **Test Session Across Tabs**
   - Open app in two browser tabs while logged in
   - Sign out in one tab
   - Refresh the other tab
   - Verify sign out is reflected (session cleared globally)

#### Expected Results

- ✅ Sign out button works correctly
- ✅ User is fully signed out (session cleared)
- ✅ Navigation updates to show unauthenticated state
- ✅ Protected pages redirect to login or show appropriate message
- ✅ `next` parameter preserves intended destination
- ✅ Sign out is reflected across all tabs/windows
- ✅ Can successfully sign back in

#### Common Issues

- Session not fully cleared → Check auth state management
- Sign out not reflected in other tabs → Implement auth state listener
- No redirect after sign in → Add redirect logic with `next` parameter

---

### 6. Mobile Deep Link Behavior

**Objective**: Verify auth links work correctly on mobile devices (iOS and Android).

#### Test Steps

**iOS Testing (Safari)**

1. **Send Magic Link to Mobile Email**
   - Use mobile device to check email
   - Or forward email from desktop to mobile

2. **Tap Magic Link in iOS Mail App**
   - Tap the link in the email
   - Observe which browser opens (should be Safari by default)

3. **Verify Redirect Flow**
   - Verify app loads (not "Can't open page" error)
   - Check redirect through `/auth/callback` works
   - Verify final landing on `/` home page

4. **Verify Session in Mobile Browser**
   - Navigate to another page
   - Return to home
   - Verify session persists

5. **Test iOS Safari Private Mode**
   - Repeat above steps in private browsing mode
   - Verify flow still works

**Android Testing (Chrome)**

1. **Send Magic Link to Mobile Email**
   - Use mobile device to check email
   - Or forward email from desktop to mobile

2. **Tap Magic Link in Gmail/Email App**
   - Tap the link in the email
   - Observe which browser opens (typically Chrome)

3. **Verify Redirect Flow**
   - Verify app loads correctly
   - Check redirect through `/auth/callback` works
   - Verify final landing on `/` home page

4. **Verify Session in Mobile Browser**
   - Navigate to another page
   - Return to home
   - Verify session persists

5. **Test Chrome Incognito Mode**
   - Repeat above steps in incognito mode
   - Verify flow still works

**Cross-Platform Deep Link Issues**

Test these scenarios on both iOS and Android:

1. **Link Opens in External Browser**
   - If link opens outside default browser (e.g., in-app browser)
   - Verify redirect still completes successfully

2. **App Switching**
   - Tap link
   - Switch to another app mid-redirect
   - Return to browser
   - Verify redirect completes

3. **Network Interruption**
   - Enable airplane mode
   - Tap link (will fail)
   - Disable airplane mode
   - Refresh or retry
   - Verify graceful error handling

#### Expected Results

**iOS**:

- ✅ Link opens in Safari (or default browser)
- ✅ Redirect flow completes successfully
- ✅ User lands on home page authenticated
- ✅ Session persists in mobile browser
- ✅ Works in private browsing mode

**Android**:

- ✅ Link opens in Chrome (or default browser)
- ✅ Redirect flow completes successfully
- ✅ User lands on home page authenticated
- ✅ Session persists in mobile browser
- ✅ Works in incognito mode

**Both Platforms**:

- ✅ No "Cannot open page" errors
- ✅ HTTPS links work correctly
- ✅ Deep link redirects are smooth (no visible URL changes)
- ✅ Session survives app switching

#### Common Issues

- Link opens in in-app browser → Ensure links use universal format
- Redirect fails on mobile → Check mobile browser compatibility
- Session doesn't persist → Verify cookie settings for mobile
- "Cannot open page" error → Check URL redirect configuration

---

## Browser Compatibility Matrix

Test all scenarios across these platforms:

### Desktop Browsers

| Browser | Version | Test Priority |
| ------- | ------- | ------------- |
| Chrome  | Latest  | High          |
| Safari  | Latest  | High          |
| Firefox | Latest  | Medium        |
| Edge    | Latest  | Low           |

### Mobile Browsers

| Platform | Browser | Version | Test Priority |
| -------- | ------- | ------- | ------------- |
| iOS      | Safari  | Latest  | High          |
| iOS      | Chrome  | Latest  | Medium        |
| Android  | Chrome  | Latest  | High          |
| Android  | Firefox | Latest  | Low           |

---

## Test Results Template

Use this template to document your test results. Create a new document for each test session.

### Test Session Information

```markdown
## Test Session: [Date]

**Tester**: [Name]
**Environment**: [Production/Staging/Local]
**Base URL**: [https://meeplego.com or staging URL]

### Test Accounts Used

1. Email: test1+[timestamp]@gmail.com | Password: [Stored in password manager]
2. Email: test2+[timestamp]@outlook.com | Password: [Stored in password manager]
3. Email: test3+[timestamp]@icloud.com | Password: [Stored in password manager]
```

### Test Results by Scenario

Copy this section for each test scenario:

```markdown
### 1. Sign Up with Email + Magic Link

#### Desktop - Chrome

- [ ] Test completed
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Issue
- **Notes**: [Any observations, issues, or screenshots]
- **Email delivery time**: [X seconds]
- **Email placement**: [Inbox/Spam/Promotions]

#### Desktop - Safari

- [ ] Test completed
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Issue
- **Notes**: [Any observations, issues, or screenshots]

#### Desktop - Firefox

- [ ] Test completed
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Issue
- **Notes**: [Any observations, issues, or screenshots]

#### Mobile - iOS Safari

- [ ] Test completed
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Issue
- **Notes**: [Any observations, issues, or screenshots]
- **Device**: [iPhone model, iOS version]

#### Mobile - Android Chrome

- [ ] Test completed
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Issue
- **Notes**: [Any observations, issues, or screenshots]
- **Device**: [Phone model, Android version]

---

### 2. Login with Email/Password

[Repeat above structure for each browser/platform]

---

### 3. Password Recovery

[Repeat above structure for each browser/platform]

---

### 4. Expired/Invalid Link

[Repeat above structure for each browser/platform]

---

### 5. Sign Out / Sign In

[Repeat above structure for each browser/platform]

---

### 6. Mobile Deep Link Behavior

[Repeat above structure for each browser/platform]
```

### Issues Found

```markdown
## Issues Found

### Issue 1: [Title]

- **Severity**: Critical / High / Medium / Low
- **Scenario**: [Which test scenario]
- **Browser/Platform**: [Where issue occurred]
- **Description**: [Detailed description]
- **Steps to Reproduce**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected**: [What should happen]
- **Actual**: [What actually happened]
- **Screenshots**: [Link or attach]
- **Status**: Open / In Progress / Resolved

### Issue 2: [Title]

[Repeat structure]
```

### Overall Summary

```markdown
## Test Summary

### Pass Rate

- Desktop: [X/Y scenarios passed]
- Mobile: [X/Y scenarios passed]
- Overall: [X/Y total tests passed]

### Critical Issues

- [List any blocking issues]

### Non-Critical Issues

- [List any minor issues]

### Recommendations

- [Any recommendations for improvements]

### Sign-Off

- [ ] All critical issues resolved
- [ ] Ready for production
- [ ] Requires additional testing

**Tester Signature**: [Name]
**Date**: [Date]
```

---

## Quick Reference: Test Tools

### Browser Developer Tools

**Check Network Requests**:

1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR" or "Doc" for redirects
4. Look for auth-related requests

**Check Console for Errors**:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages during auth flows

**Check Cookies/Storage**:

1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Check Cookies and Local Storage for session data

### Email Header Analysis

**Gmail**:

1. Open email
2. Click three dots menu → "Show original"
3. Look for "SPF", "DKIM", "DMARC" in headers

**Outlook**:

1. Open email
2. File → Properties → Internet headers
3. Or use Microsoft Message Header Analyzer tool

**General**:

- Look for `Authentication-Results` header
- Verify `spf=pass`, `dkim=pass`, `dmarc=pass`

### Mobile Device Testing

**iOS Safari Remote Debugging**:

1. Enable Web Inspector on iOS: Settings → Safari → Advanced → Web Inspector
2. Connect device to Mac via USB
3. Open Safari on Mac → Develop → [Your Device]
4. Select the tab to debug

**Android Chrome Remote Debugging**:

1. Enable Developer Options on Android
2. Enable USB Debugging
3. Connect device to computer via USB
4. Open Chrome on computer → More tools → Remote devices
5. Select device and inspect

---

## Pre-Launch Checklist

Before considering auth flows "launch-ready", ensure:

### Configuration

- [ ] All redirect URLs configured in Supabase
- [ ] Email templates customized and tested
- [ ] SMTP/Email provider configured
- [ ] DNS records (SPF, DKIM, DMARC) set and verified
- [ ] Environment variables set correctly

### Testing Complete

- [ ] All 6 test scenarios completed on desktop (Chrome, Safari, Firefox)
- [ ] All 6 test scenarios completed on mobile (iOS Safari, Android Chrome)
- [ ] Email deliverability verified across Gmail, Outlook, iCloud
- [ ] Email headers verified (SPF, DKIM, DMARC pass)
- [ ] All critical issues resolved

### Documentation

- [ ] Test results documented
- [ ] Issues logged and tracked
- [ ] Screenshots captured for reference
- [ ] Test accounts documented securely

### Acceptance Criteria

- [ ] ≥ 95% of tests passing
- [ ] 0 critical issues open
- [ ] Email delivery < 30 seconds
- [ ] Session persistence working across all browsers
- [ ] Mobile deep links working on iOS and Android

---

## Additional Resources

- [MeepleGo Launch Checklist](../release/launch-checklist.md) - Complete launch preparation guide
- [Supabase Launch Checklist](../deployment/supabase-launch-checklist.md) - Supabase configuration details
- [Supabase Production Config](../deployment/supabase-production-config.md) - Production setup instructions
- [Auth Diagnostics Tool](/auth/providers) - Built-in testing page for quick auth verification

---

## Appendix: Common Error Messages

### Expected Error Messages

These should appear in the UI for users:

- "Invalid email or password" - Generic login error (no user enumeration)
- "This link has expired. Please request a new one." - Expired magic/reset link
- "Unable to send email. Please try again." - Email sending failure
- "Passwords do not match" - Password confirmation mismatch
- "Password must be at least 8 characters" - Password strength requirement

### Technical Errors (Should Not Appear to Users)

If you see these, there's a configuration or code issue:

- "Invalid Redirect URL" - Check Supabase redirect URL allowlist
- "SMTP configuration error" - Check email provider settings
- "Invalid token" - May indicate expired session or incorrect token handling
- "CORS error" - Check CORS settings in Supabase
- 500 Internal Server Error - Check application logs for details

---

**Last Updated**: [Date]
**Document Version**: 1.0
