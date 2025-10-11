# Auth Flows QA - Quick Start Guide

This is a condensed guide for quickly running through auth flow testing. For comprehensive details, see [Manual Auth Flows Documentation](./manual-auth-flows.md).

## Before You Start (5 minutes)

### 1. Set Up Test Emails
Create 2-3 test email addresses using one of these methods:
- **Gmail Plus**: `yourname+test1@gmail.com`, `yourname+test2@gmail.com`
- **Multiple Providers**: Gmail, Outlook, iCloud accounts
- Keep credentials in a password manager

### 2. Verify Environment
- Confirm you're testing the right environment (production/staging)
- Check that `/auth/providers` diagnostic page works
- Have both desktop and mobile device ready

### 3. Prepare Documentation
- Create a copy of the [Test Results Template](#test-results-template)
- Have screenshot tool ready
- Open browser developer tools (F12)

---

## Quick Test Sequence (30 minutes per platform)

### Desktop Testing (Chrome → Safari → Firefox)

For each browser, run this sequence with one test account:

1. **Sign Up** (5 min)
   - Go to `/auth/providers` or signup page
   - Enter test email, request magic link
   - Check inbox → click link
   - ✅ Should land on `/` authenticated

2. **Sign Out & Login** (3 min)
   - Sign out from nav
   - Go to login page
   - Enter email + password → submit
   - ✅ Should redirect to `/` authenticated

3. **Password Reset** (5 min)
   - Sign out
   - Request password reset
   - Check inbox → click link
   - Set new password
   - ✅ Can log in with new password

4. **Error Handling** (2 min)
   - Try login with wrong password
   - ✅ Should show friendly error
   - Try using old reset link
   - ✅ Should show expired message

5. **Session Check** (2 min)
   - Log in, refresh page
   - ✅ Session should persist
   - Open new tab → visit site
   - ✅ Should still be logged in

### Mobile Testing (iOS Safari + Android Chrome)

For each platform, test these critical flows:

1. **Email Link on Mobile** (10 min)
   - Request magic link on desktop, check email on mobile
   - Tap link in mobile email app
   - ✅ Should open in browser and complete auth
   - ✅ Session should persist

2. **Password Reset on Mobile** (10 min)
   - Request reset on desktop, check email on mobile
   - Tap link in mobile email app
   - Set new password on mobile
   - ✅ Should complete successfully

3. **Mobile Login** (5 min)
   - Go to site on mobile browser
   - Log in with credentials
   - Navigate around app
   - ✅ Should work smoothly

---

## Critical Checks

### Email Deliverability ✉️
- [ ] Emails arrive in < 30 seconds
- [ ] Emails land in Inbox (not spam)
- [ ] Links in emails work correctly
- [ ] Can test with Gmail, Outlook, iCloud

### Session Management 🔐
- [ ] Session persists on page refresh
- [ ] Session persists in new tabs
- [ ] Sign out clears session everywhere
- [ ] Can sign back in successfully

### Error Handling ⚠️
- [ ] Invalid credentials → friendly error
- [ ] Expired links → clear message
- [ ] Missing fields → validation errors
- [ ] No application crashes

### Mobile Deep Links 📱
- [ ] Links open in mobile browser
- [ ] Redirects complete successfully
- [ ] Session persists on mobile
- [ ] Works on both iOS and Android

---

## Test Results Template

Copy this for quick results tracking:

```markdown
## Auth Flows QA Results - [Date]

**Tester**: [Your Name]
**Environment**: [URL]

### Desktop Testing

#### Chrome
- Sign Up: ✅ / ❌  [Notes]
- Login: ✅ / ❌  [Notes]
- Password Reset: ✅ / ❌  [Notes]
- Error Handling: ✅ / ❌  [Notes]
- Session: ✅ / ❌  [Notes]

#### Safari
- Sign Up: ✅ / ❌  [Notes]
- Login: ✅ / ❌  [Notes]
- Password Reset: ✅ / ❌  [Notes]
- Error Handling: ✅ / ❌  [Notes]
- Session: ✅ / ❌  [Notes]

#### Firefox
- Sign Up: ✅ / ❌  [Notes]
- Login: ✅ / ❌  [Notes]
- Password Reset: ✅ / ❌  [Notes]
- Error Handling: ✅ / ❌  [Notes]
- Session: ✅ / ❌  [Notes]

### Mobile Testing

#### iOS Safari [Device/Version]
- Email Links: ✅ / ❌  [Notes]
- Password Reset: ✅ / ❌  [Notes]
- Mobile Login: ✅ / ❌  [Notes]
- Deep Links: ✅ / ❌  [Notes]

#### Android Chrome [Device/Version]
- Email Links: ✅ / ❌  [Notes]
- Password Reset: ✅ / ❌  [Notes]
- Mobile Login: ✅ / ❌  [Notes]
- Deep Links: ✅ / ❌  [Notes]

### Issues Found
1. [Issue description] - Severity: [Critical/High/Medium/Low]
2. [Issue description] - Severity: [Critical/High/Medium/Low]

### Overall Status
- Total Tests: [X]
- Passed: [Y]
- Failed: [Z]
- Pass Rate: [Y/X * 100]%

**Ready for Launch?** ✅ Yes / ❌ No - [Reason if no]
```

---

## Quick Email Header Check

To verify email authentication (SPF/DKIM/DMARC):

**Gmail**:
1. Open email → three dots → "Show original"
2. Look for these lines:
   ```
   spf=PASS
   dkim=PASS
   dmarc=PASS
   ```

**Outlook**:
1. Open email → File → Properties
2. Check "Internet headers"
3. Look for `Authentication-Results` with pass status

---

## Issues? Try These First

### Email Not Arriving
- Check spam/junk folder
- Verify email provider configured in Supabase
- Run `npm run test:email` from repo

### Link Not Working
- Check Supabase redirect URLs match exactly
- Verify link hasn't expired (1 hour timeout)
- Try copying link to browser manually

### Session Not Persisting
- Check browser allows cookies
- Try without ad blockers
- Check CORS settings in Supabase

### Mobile Link Issues
- Ensure link uses HTTPS
- Try opening in different mobile browser
- Check redirect URLs include production domain

---

## Post-Testing

### Required Actions
1. Document all results using template above
2. Log any issues found with screenshots
3. Verify all critical issues are resolved
4. Get sign-off from stakeholders

### Before Marking Complete
- [ ] All platforms tested (Chrome, Safari, Firefox, iOS, Android)
- [ ] All scenarios tested (signup, login, reset, errors, mobile)
- [ ] Email deliverability verified (< 30 seconds, inbox placement)
- [ ] No critical issues remaining
- [ ] Results documented and shared

---

## Need Help?

- **Detailed Guide**: [Manual Auth Flows Documentation](./manual-auth-flows.md)
- **Supabase Config**: [Supabase Launch Checklist](../deployment/supabase-launch-checklist.md)
- **Launch Checklist**: [MeepleGo Launch Checklist](../release/launch-checklist.md)
- **Auth Diagnostics**: Visit `/auth/providers` on the site

---

**Pro Tip**: Use browser profiles or incognito mode for each test account to avoid session conflicts. Open developer tools (F12) to watch network requests and catch errors early.
