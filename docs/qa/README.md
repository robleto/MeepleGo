# QA Documentation

This directory contains comprehensive quality assurance documentation for MeepleGo, with a focus on manual testing procedures and results tracking.

## Contents

### 📋 [Manual Auth Flows](./manual-auth-flows.md)
Complete guide for manually testing all authentication flows in MeepleGo. This is the primary reference document for QA testers.

**Use this for**:
- Detailed test scenarios and procedures
- Understanding expected results
- Troubleshooting common issues
- Browser compatibility requirements
- Email deliverability verification

**Scenarios covered**:
1. Sign up with email + magic link
2. Login with email/password
3. Password recovery
4. Expired/invalid link handling
5. Sign out / Sign in flows
6. Mobile deep link behavior

---

### ⚡ [Auth Flows Quick Start](./auth-flows-quick-start.md)
Condensed guide for quickly executing auth flow tests. Perfect for repeat testing or time-constrained QA sessions.

**Use this for**:
- Quick 30-minute test sessions
- Regression testing
- Emergency pre-deploy verification
- Quick reference during testing

**Time estimate**: 30 minutes per platform (desktop/mobile)

---

### 📝 [Test Results Template](./auth-flows-test-results-template.md)
Comprehensive template for documenting test results. Copy this file and fill it out during testing.

**Use this for**:
- Recording test results systematically
- Documenting issues found
- Tracking test completion
- Sign-off and approval process
- Historical test records

**How to use**:
1. Copy the template to a new file (e.g., `auth-test-results-2025-10-11.md`)
2. Fill in test session information
3. Complete each test scenario section
4. Document any issues found
5. Complete summary and sign-off sections

---

## Quick Links

### Related Documentation
- [MeepleGo Launch Checklist](../release/launch-checklist.md) - Overall launch preparation
- [Supabase Launch Checklist](../deployment/supabase-launch-checklist.md) - Supabase-specific configuration
- [Supabase Production Config](../deployment/supabase-production-config.md) - Production setup details

### Testing Tools
- **Auth Diagnostics Page**: Visit `/auth/providers` on the application for quick auth testing
- **Email Deliverability Script**: Run `npm run test:email` from repository root

---

## Getting Started with QA

### For First-Time Testers

1. **Read the Documentation** (30 minutes)
   - Start with [Manual Auth Flows](./manual-auth-flows.md)
   - Review the test scenarios
   - Understand the expected results

2. **Set Up Test Environment** (15 minutes)
   - Create 2-3 test email accounts
   - Set up devices (desktop + mobile)
   - Prepare screenshot tools
   - Copy the test results template

3. **Run Quick Start Test** (30 minutes)
   - Follow [Auth Flows Quick Start](./auth-flows-quick-start.md)
   - Test one platform completely
   - Document any issues

4. **Complete Full Testing** (2-3 hours)
   - Test all platforms and browsers
   - Fill out complete test results template
   - Capture screenshots
   - Log all issues found

### For Repeat Testing

1. **Quick Regression Test** (30 minutes)
   - Use [Auth Flows Quick Start](./auth-flows-quick-start.md)
   - Focus on critical paths
   - Verify recent fixes

2. **Full Re-Test** (2-3 hours)
   - Use complete [Manual Auth Flows](./manual-auth-flows.md)
   - Test all scenarios again
   - Update test results

---

## Test Prioritization

### Critical (Must Pass Before Launch)
- ✅ Sign up with magic link (desktop + mobile)
- ✅ Login with email/password (desktop + mobile)
- ✅ Password recovery (desktop + mobile)
- ✅ Email deliverability across Gmail, Outlook, iCloud
- ✅ Session persistence
- ✅ Mobile deep links on iOS and Android

### High Priority (Should Pass Before Launch)
- ⚠️ Expired/invalid link error handling
- ⚠️ Invalid credentials error messages
- ⚠️ Sign out/sign in flow
- ⚠️ Cross-browser compatibility (Chrome, Safari, Firefox)

### Medium Priority (Nice to Have)
- 📌 Edge browser compatibility
- 📌 Mobile Firefox/Opera testing
- 📌 Network interruption handling

---

## Common Issues and Solutions

### Email Not Arriving
- **Check**: Spam/junk folder
- **Verify**: SMTP configuration in Supabase
- **Test**: Run `npm run test:email`
- **Review**: DNS records (SPF, DKIM, DMARC)

### Magic Link Not Working
- **Check**: Supabase redirect URL configuration
- **Verify**: Link hasn't expired (1 hour timeout)
- **Test**: Copy link to browser manually
- **Review**: Browser console for errors

### Session Not Persisting
- **Check**: Browser allows cookies
- **Verify**: Not in private/incognito mode
- **Test**: Without ad blockers
- **Review**: CORS settings in Supabase

### Mobile Link Issues
- **Check**: Link uses HTTPS
- **Verify**: Opens in mobile browser (not in-app browser)
- **Test**: Different mobile browser
- **Review**: Redirect URLs include production domain

---

## Test Account Management

### Creating Test Accounts

**Gmail Plus Addressing** (Recommended):
- `yourname+qa1@gmail.com`
- `yourname+qa2@gmail.com`
- `yourname+qa3@gmail.com`
- All emails go to main inbox
- Easy to filter by "+qa"

**Multiple Providers**:
- Gmail: `test1@gmail.com`
- Outlook: `test2@outlook.com`
- iCloud: `test3@icloud.com`
- Tests cross-provider deliverability

### Security Best Practices

- ✅ Store credentials in password manager
- ✅ Use test-specific passwords (not your real passwords)
- ✅ Document which account is used for what
- ✅ Clean up test data after testing
- ❌ Don't commit credentials to repository
- ❌ Don't use real user emails for testing

---

## Reporting Issues

### Issue Template

When documenting issues in test results:

```markdown
### Issue #X: [Brief Title]

**Severity**: Critical / High / Medium / Low
**Status**: Open / In Progress / Resolved
**Scenario**: [Which test]
**Platform**: [Browser/Device]

**Description**: [What happened]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]

**Expected**: [What should happen]
**Actual**: [What did happen]

**Screenshots**: [Links]
```

### Issue Severity Guidelines

**Critical**:
- Blocks authentication completely
- Data loss or corruption
- Security vulnerability
- Affects all users

**High**:
- Major functionality broken
- Affects many users
- No workaround available
- Poor user experience

**Medium**:
- Minor functionality issue
- Affects some users
- Workaround available
- Usability concern

**Low**:
- Cosmetic issue
- Edge case
- Minimal user impact
- Enhancement request

---

## Test Environment Requirements

### Desktop Setup
- **Operating Systems**: macOS, Windows, or Linux
- **Browsers**: Latest versions of Chrome, Safari (macOS), Firefox
- **Tools**: 
  - Browser developer tools (F12)
  - Screenshot utility
  - Text editor for notes

### Mobile Setup
- **iOS Device**: iPhone or iPad running latest iOS
- **Android Device**: Phone or tablet running Android 12+
- **Tools**:
  - Email app (Mail, Gmail, Outlook)
  - Mobile browser (Safari, Chrome)
  - Remote debugging enabled (optional)

### Network Requirements
- Stable internet connection
- Access to email accounts
- Access to test environment URL
- No restrictive firewalls blocking auth

---

## Acceptance Criteria

### Before Marking QA Complete

- [ ] All 6 test scenarios completed on desktop (Chrome, Safari, Firefox)
- [ ] All 6 test scenarios completed on mobile (iOS Safari, Android Chrome)
- [ ] Email deliverability verified across Gmail, Outlook, iCloud
- [ ] Email headers verified (SPF, DKIM, DMARC pass)
- [ ] All critical issues resolved
- [ ] Test results documented using template
- [ ] Screenshots captured for key flows
- [ ] Sign-off obtained from stakeholders

### Launch Readiness Criteria

- [ ] ≥ 95% test pass rate
- [ ] 0 critical issues open
- [ ] Email delivery < 30 seconds
- [ ] All emails landing in inbox (not spam)
- [ ] Session persistence working
- [ ] Mobile deep links functional
- [ ] Error handling is user-friendly

---

## Contributing to QA Documentation

### Updating Documentation

If you find issues or have improvements to QA documentation:

1. **For Minor Updates**: Submit a pull request with changes
2. **For New Test Scenarios**: Discuss with team first
3. **For Process Changes**: Get approval from QA lead

### Documentation Standards

- Use clear, concise language
- Include examples where helpful
- Add screenshots for complex steps
- Keep templates consistent
- Update version dates

---

## Questions or Issues?

- **Documentation Issues**: Open an issue in the repository
- **Testing Questions**: Contact QA team lead
- **Auth Configuration**: See [Supabase documentation](../deployment/)
- **Launch Checklist**: See [release documentation](../release/)

---

**Last Updated**: 2025-10-11  
**Documentation Version**: 1.0  
**Maintained By**: MeepleGo QA Team
