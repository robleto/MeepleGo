# Auth Flows QA Test Results

**Test Date**: [YYYY-MM-DD]  
**Tester Name**: [Your Name]  
**Environment**: [Production / Staging / Local]  
**Base URL**: [https://meeplego.com or other]  
**Supabase Project**: [Project ID or Name]

---

## Test Account Information

### Test Accounts Created

| Account # | Email Address                 | Password Location  | Provider | Purpose                |
| --------- | ----------------------------- | ------------------ | -------- | ---------------------- |
| 1         | test1+[timestamp]@gmail.com   | [Password Manager] | Gmail    | Happy path testing     |
| 2         | test2+[timestamp]@outlook.com | [Password Manager] | Outlook  | Cross-provider testing |
| 3         | test3+[timestamp]@icloud.com  | [Password Manager] | iCloud   | Mobile testing         |

### Test Account Notes

- Account with known bad password for error testing: [Email]
- Account for expired link testing: [Email]
- Additional notes: [Any other relevant info]

---

## Test Results by Scenario

### 1. Sign Up with Email + Magic Link

#### Desktop - Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to sign up page
- [ ] Entered email and requested magic link
- [ ] Received email (within 30 seconds)
- [ ] Email landed in Inbox (not spam)
- [ ] Clicked magic link
- [ ] Redirected to `/auth/callback`
- [ ] Final redirect to `/` home page
- [ ] Navigation shows authenticated state
- [ ] Refreshed page - session persisted
- [ ] Verified user profile in nav

**Email Delivery**:

- Delivery Time: [X seconds]
- Folder: [Inbox / Spam / Promotions]
- SPF Status: [Pass / Fail / Not Checked]
- DKIM Status: [Pass / Fail / Not Checked]
- DMARC Status: [Pass / Fail / Not Checked]

**Screenshots**:

- [ ] Email received: [Link or filename]
- [ ] Authenticated state: [Link or filename]

**Notes**:
[Any observations, edge cases, or issues encountered]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to sign up page
- [ ] Entered email and requested magic link
- [ ] Received email (within 30 seconds)
- [ ] Email landed in Inbox (not spam)
- [ ] Clicked magic link
- [ ] Redirected to `/auth/callback`
- [ ] Final redirect to `/` home page
- [ ] Navigation shows authenticated state
- [ ] Refreshed page - session persisted
- [ ] Verified user profile in nav

**Email Delivery**:

- Delivery Time: [X seconds]
- Folder: [Inbox / Spam / Promotions]

**Notes**:
[Any observations, edge cases, or issues encountered]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Firefox

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to sign up page
- [ ] Entered email and requested magic link
- [ ] Received email (within 30 seconds)
- [ ] Email landed in Inbox (not spam)
- [ ] Clicked magic link
- [ ] Redirected to `/auth/callback`
- [ ] Final redirect to `/` home page
- [ ] Navigation shows authenticated state
- [ ] Refreshed page - session persisted
- [ ] Verified user profile in nav

**Email Delivery**:

- Delivery Time: [X seconds]
- Folder: [Inbox / Spam / Promotions]

**Notes**:
[Any observations, edge cases, or issues encountered]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - iOS Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Device Information**:

- Device Model: [iPhone 14, iPad Pro, etc.]
- iOS Version: [17.0, 16.5, etc.]
- Browser: Safari
- Private Mode: [Yes / No]

**Steps Completed**:

- [ ] Navigated to sign up page on mobile
- [ ] Entered email and requested magic link
- [ ] Opened email on mobile device
- [ ] Tapped magic link in email app
- [ ] Link opened in Safari
- [ ] Redirected to `/auth/callback`
- [ ] Final redirect to `/` home page
- [ ] Navigation shows authenticated state
- [ ] Navigated to other pages
- [ ] Returned to home - session persisted

**Mobile-Specific Checks**:

- [ ] Link opened in correct browser (Safari)
- [ ] No "Cannot open page" errors
- [ ] Touch interactions work correctly
- [ ] Responsive design looks good
- [ ] Session survives app switching

**Notes**:
[Any observations, mobile-specific issues, or browser behavior]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - Android Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Device Information**:

- Device Model: [Samsung Galaxy S23, Pixel 7, etc.]
- Android Version: [13, 12, etc.]
- Browser: Chrome
- Incognito Mode: [Yes / No]

**Steps Completed**:

- [ ] Navigated to sign up page on mobile
- [ ] Entered email and requested magic link
- [ ] Opened email on mobile device
- [ ] Tapped magic link in email app
- [ ] Link opened in Chrome
- [ ] Redirected to `/auth/callback`
- [ ] Final redirect to `/` home page
- [ ] Navigation shows authenticated state
- [ ] Navigated to other pages
- [ ] Returned to home - session persisted

**Mobile-Specific Checks**:

- [ ] Link opened in correct browser (Chrome)
- [ ] No "Cannot open page" errors
- [ ] Touch interactions work correctly
- [ ] Responsive design looks good
- [ ] Session survives app switching

**Notes**:
[Any observations, mobile-specific issues, or browser behavior]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

### 2. Login with Email/Password

#### A. Valid Credentials Test

##### Desktop - Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to login page
- [ ] Entered valid email and password
- [ ] Submitted form
- [ ] Successfully redirected to `/` or preserved `next` URL
- [ ] Navigation shows authenticated state
- [ ] Refreshed page - session persisted

**Notes**:
[Any observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

##### Desktop - Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to login page
- [ ] Entered valid email and password
- [ ] Submitted form
- [ ] Successfully redirected to `/` or preserved `next` URL
- [ ] Navigation shows authenticated state
- [ ] Refreshed page - session persisted

**Notes**:
[Any observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

##### Desktop - Firefox

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to login page
- [ ] Entered valid email and password
- [ ] Submitted form
- [ ] Successfully redirected to `/` or preserved `next` URL
- [ ] Navigation shows authenticated state
- [ ] Refreshed page - session persisted

**Notes**:
[Any observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

##### Mobile - iOS Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Device**: [Model/Version]

**Steps Completed**:

- [ ] Navigated to login page on mobile
- [ ] Entered valid email and password
- [ ] Submitted form
- [ ] Successfully redirected
- [ ] Navigation shows authenticated state
- [ ] Session persisted

**Notes**:
[Any observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

##### Mobile - Android Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Device**: [Model/Version]

**Steps Completed**:

- [ ] Navigated to login page on mobile
- [ ] Entered valid email and password
- [ ] Submitted form
- [ ] Successfully redirected
- [ ] Navigation shows authenticated state
- [ ] Session persisted

**Notes**:
[Any observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### B. Invalid Credentials Test

##### Desktop - Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Invalid Email Test**:

- [ ] Entered non-existent email
- [ ] Submitted form
- [ ] Received friendly error message
- [ ] Error message does not reveal user existence
- [ ] Can retry login

**Invalid Password Test**:

- [ ] Entered valid email with wrong password
- [ ] Submitted form
- [ ] Received friendly error message
- [ ] Error message matches email error (no enumeration)
- [ ] Can retry login

**Empty Fields Test**:

- [ ] Submitted with empty email
- [ ] Received validation message
- [ ] Submitted with empty password
- [ ] Received validation message

**Error Messages Observed**:

- Invalid email: "[Exact message]"
- Invalid password: "[Exact message]"
- Empty field: "[Exact message]"

**Notes**:
[Verify messages are user-friendly and non-specific]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

##### Desktop - Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome above]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

##### Desktop - Firefox

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome above]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

### 3. Password Recovery

#### Desktop - Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Navigated to password reset page
- [ ] Entered valid email address
- [ ] Submitted form
- [ ] Received confirmation message
- [ ] Received reset email (within 30 seconds)
- [ ] Email landed in Inbox (not spam)
- [ ] Clicked reset link in email
- [ ] Redirected to `/auth/callback`
- [ ] Final redirect to `/update-password`
- [ ] Entered new password
- [ ] Confirmed new password
- [ ] Submitted password update form
- [ ] Received success message
- [ ] Signed out
- [ ] Attempted login with old password - FAILED ✅
- [ ] Attempted login with new password - SUCCESS ✅

**Email Delivery**:

- Delivery Time: [X seconds]
- Folder: [Inbox / Spam / Promotions]

**Password Change**:

- Old password: [Obfuscated, e.g., "testpass123"]
- New password: [Obfuscated, e.g., "newpass456"]
- Old password still works: ❌ (Expected)
- New password works: ✅ (Expected)

**Screenshots**:

- [ ] Reset email: [Link or filename]
- [ ] Password update page: [Link or filename]
- [ ] Success message: [Link or filename]

**Notes**:
[Any observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Firefox

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - iOS Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device**: [Model/Version]

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - Android Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device**: [Model/Version]

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

### 4. Expired/Invalid Link

#### Desktop - Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Expired Magic Link Test**:

- [ ] Requested magic link
- [ ] Waited for link to expire (>1 hour) OR used old link
- [ ] Clicked expired link
- [ ] Received friendly error message
- [ ] Error explains link is expired
- [ ] Can request new link

**Expired Reset Link Test**:

- [ ] Requested password reset
- [ ] Waited for link to expire (>1 hour) OR used old link
- [ ] Clicked expired link
- [ ] Received friendly error message
- [ ] Error explains link is expired
- [ ] Can request new reset link

**Invalid/Malformed Link Test**:

- [ ] Manually modified valid link URL
- [ ] Visited malformed link
- [ ] No application crash
- [ ] Received error message or redirected safely

**Already-Used Link Test**:

- [ ] Used valid magic/reset link successfully
- [ ] Attempted to use same link again
- [ ] Received appropriate error message
- [ ] Link correctly rejected as already used

**Error Messages Observed**:

- Expired magic link: "[Exact message]"
- Expired reset link: "[Exact message]"
- Invalid link: "[Exact message]"
- Already-used link: "[Exact message]"

**Expected Redirect**:

- URL after error: [e.g., `/login?error=otp_expired`]

**Notes**:
[Any observations about error handling]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Firefox

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - iOS Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device**: [Model/Version]

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - Android Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device**: [Model/Version]

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

### 5. Sign Out / Sign In

#### Desktop - Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Test Account Used**: [Email address]

**Steps Completed**:

- [ ] Signed in with valid credentials
- [ ] Verified authenticated state
- [ ] Navigated to protected pages (profile, lists, rankings)
- [ ] Access granted to protected content
- [ ] Clicked sign out button in navigation
- [ ] User signed out successfully
- [ ] Navigation shows unauthenticated state
- [ ] Attempted to visit protected page (e.g., `/profile`)
- [ ] Appropriate redirect or message shown
- [ ] Navigated to login page
- [ ] `next` parameter preserved in URL (if applicable)
- [ ] Signed in with valid credentials
- [ ] Redirected to original protected page (if `next` was set)
- [ ] Session restored successfully

**Multi-Tab Test**:

- [ ] Opened app in two browser tabs while logged in
- [ ] Signed out in one tab
- [ ] Refreshed the other tab
- [ ] Sign out reflected in both tabs

**Protected Page Behavior**:

- Behavior observed: [Redirect to login / Show login modal / Show message]
- `next` parameter used: [Yes / No]
- Redirect URL: [Full URL if applicable]

**Notes**:
[Any observations about session management]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Desktop - Firefox

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - iOS Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device**: [Model/Version]

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Mobile - Android Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device**: [Model/Version]

[Same structure as Chrome]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

### 6. Mobile Deep Link Behavior

#### iOS Safari

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device Information**:

- Device Model: [iPhone 14 Pro, etc.]
- iOS Version: [17.0, etc.]
- Email App Used: [Mail, Gmail, Outlook, etc.]

**Magic Link Test**:

- [ ] Requested magic link (sent to mobile email or forwarded)
- [ ] Opened email in mobile email app
- [ ] Tapped magic link
- [ ] Link opened in Safari (or default browser)
- [ ] App loaded successfully (no "Cannot open page" error)
- [ ] Redirected through `/auth/callback`
- [ ] Final landing on `/` home page
- [ ] Navigation shows authenticated state
- [ ] Navigated to other pages
- [ ] Returned to home
- [ ] Session persisted

**Password Reset Link Test**:

- [ ] Requested password reset (sent to mobile email)
- [ ] Opened email in mobile email app
- [ ] Tapped reset link
- [ ] Link opened in Safari (or default browser)
- [ ] Redirected to `/update-password`
- [ ] Set new password on mobile
- [ ] Password updated successfully
- [ ] Can log in with new password

**Private Browsing Mode Test**:

- [ ] Repeated above in Safari Private mode
- [ ] Flow completed successfully
- [ ] Session worked correctly

**App Switching Test**:

- [ ] Tapped magic link
- [ ] Switched to another app during redirect
- [ ] Returned to Safari
- [ ] Redirect completed successfully

**Deep Link Issues**:

- [ ] Link opened in correct browser
- [ ] No "Cannot open page" errors
- [ ] HTTPS links worked correctly
- [ ] Redirects were smooth (no visible URL changes)
- [ ] Session survived app switching

**Browser Opened**: [Safari / Chrome / Other]
**In-App Browser Used**: [Yes / No] - [Which email app]

**Notes**:
[Any iOS-specific issues or observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

#### Android Chrome

**Test Status**: ⬜ Not Started / 🔄 In Progress / ✅ Pass / ❌ Fail / ⚠️ Issue

**Device Information**:

- Device Model: [Samsung Galaxy S23, Pixel 7, etc.]
- Android Version: [13, 12, etc.]
- Email App Used: [Gmail, Outlook, etc.]

**Magic Link Test**:

- [ ] Requested magic link (sent to mobile email or forwarded)
- [ ] Opened email in mobile email app
- [ ] Tapped magic link
- [ ] Link opened in Chrome (or default browser)
- [ ] App loaded successfully (no "Cannot open page" error)
- [ ] Redirected through `/auth/callback`
- [ ] Final landing on `/` home page
- [ ] Navigation shows authenticated state
- [ ] Navigated to other pages
- [ ] Returned to home
- [ ] Session persisted

**Password Reset Link Test**:

- [ ] Requested password reset (sent to mobile email)
- [ ] Opened email in mobile email app
- [ ] Tapped reset link
- [ ] Link opened in Chrome (or default browser)
- [ ] Redirected to `/update-password`
- [ ] Set new password on mobile
- [ ] Password updated successfully
- [ ] Can log in with new password

**Incognito Mode Test**:

- [ ] Repeated above in Chrome Incognito mode
- [ ] Flow completed successfully
- [ ] Session worked correctly

**App Switching Test**:

- [ ] Tapped magic link
- [ ] Switched to another app during redirect
- [ ] Returned to Chrome
- [ ] Redirect completed successfully

**Deep Link Issues**:

- [ ] Link opened in correct browser
- [ ] No "Cannot open page" errors
- [ ] HTTPS links worked correctly
- [ ] Redirects were smooth (no visible URL changes)
- [ ] Session survived app switching

**Browser Opened**: [Chrome / Samsung Internet / Other]
**In-App Browser Used**: [Yes / No] - [Which email app]

**Notes**:
[Any Android-specific issues or observations]

**Overall Result**: ✅ Pass / ❌ Fail / ⚠️ Issue

---

## Issues Found

### Issue #1

**Title**: [Brief description]

**Severity**: [Critical / High / Medium / Low]

**Status**: [Open / In Progress / Resolved / Won't Fix]

**Scenario**: [Which test scenario - e.g., "Sign Up with Magic Link"]

**Browser/Platform**: [e.g., "Safari on macOS" or "Chrome on Android 13"]

**Description**:
[Detailed description of the issue]

**Steps to Reproduce**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots/Logs**:

- [Link to screenshot 1]
- [Link to screenshot 2]
- [Console errors or logs]

**Workaround**:
[If any workaround exists]

**Resolution**:
[How it was fixed, if resolved]

**Assignee**: [Person responsible]

**Date Reported**: [YYYY-MM-DD]

**Date Resolved**: [YYYY-MM-DD]

---

### Issue #2

[Repeat structure above for each issue]

---

## Test Summary

### Completion Statistics

**Total Scenarios**: 6

- Sign Up with Email + Magic Link
- Login with Email/Password
- Password Recovery
- Expired/Invalid Link
- Sign Out / Sign In
- Mobile Deep Link Behavior

**Total Platform Tests**: [Number]

- Desktop Chrome: [X/6 passed]
- Desktop Safari: [X/6 passed]
- Desktop Firefox: [X/6 passed]
- Mobile iOS Safari: [X/6 passed]
- Mobile Android Chrome: [X/6 passed]

**Overall Statistics**:

- Total Tests Planned: [Number]
- Tests Completed: [Number]
- Tests Passed: [Number]
- Tests Failed: [Number]
- Tests Skipped: [Number]
- Pass Rate: [X%]

### Email Deliverability Summary

**Gmail**:

- Average Delivery Time: [X seconds]
- Inbox Placement: [X/X emails]
- SPF/DKIM/DMARC: [Pass / Fail]

**Outlook**:

- Average Delivery Time: [X seconds]
- Inbox Placement: [X/X emails]
- SPF/DKIM/DMARC: [Pass / Fail]

**iCloud**:

- Average Delivery Time: [X seconds]
- Inbox Placement: [X/X emails]
- SPF/DKIM/DMARC: [Pass / Fail]

### Issues Summary

**Critical Issues**: [Number]

- [List critical issues]

**High Priority Issues**: [Number]

- [List high priority issues]

**Medium/Low Priority Issues**: [Number]

- [List medium/low priority issues]

**Total Issues**: [Number]

### Acceptance Criteria Status

- [ ] ≥ 95% of tests passing
- [ ] 0 critical issues open
- [ ] Email delivery < 30 seconds
- [ ] Email authentication (SPF/DKIM/DMARC) passing
- [ ] Emails landing in inbox (not spam)
- [ ] Session persistence working across all browsers
- [ ] Mobile deep links working on iOS and Android
- [ ] Error handling is user-friendly and graceful
- [ ] All redirect URLs configured correctly

### Recommendations

[List any recommendations for improvements, follow-up testing, or configuration changes]

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## Sign-Off

### Test Completion

- [ ] All planned tests completed
- [ ] All critical issues resolved
- [ ] Documentation complete
- [ ] Screenshots captured and stored

### Launch Readiness

**Ready for Production Launch?** ⬜ Yes / ⬜ No

**If No, Reason**:
[Explain what needs to be addressed before launch]

**If Yes, Conditions**:
[Any conditions or caveats for launch approval]

### Approvals

**Tester**:

- Name: [Your Name]
- Date: [YYYY-MM-DD]
- Signature: [Digital signature or initials]

**Reviewer**:

- Name: [Reviewer Name]
- Date: [YYYY-MM-DD]
- Signature: [Digital signature or initials]

**Product Owner/Stakeholder**:

- Name: [Name]
- Date: [YYYY-MM-DD]
- Signature: [Digital signature or initials]

---

## Additional Notes

[Any additional context, observations, or information that doesn't fit in the sections above]

---

**Test Results Document Version**: 1.0  
**Last Updated**: [YYYY-MM-DD]
