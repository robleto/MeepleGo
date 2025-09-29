# Supabase Launch Checklist for MeepleGo

This comprehensive checklist ensures all Supabase configurations are ready for production launch, covering redirect URLs, email templates, SMTP setup, DNS configuration, and deliverability testing.

## Pre-Launch Configuration

### ✅ 1. Supabase Project Setup

#### Redirect URL Configuration

- [ ] **Production URLs added to allowlist**:
  - [ ] `https://meeplego.com/auth/callback`
- [ ] **Staging URLs added to allowlist** (if applicable):
  - [ ] `https://staging.meeplego.com/auth/callback`
  - [ ] `https://preview.meeplego.com/auth/callback`
- [ ] **Development URLs added to allowlist**:
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `http://localhost:3001/auth/callback`

**Location**: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

#### Email Template Configuration

- [ ] **Confirm Signup Template** updated with:
  - [ ] `{{ .ConfirmationURL }}` placeholder used
  - [ ] User expectations set (link expires, opens in browser)
  - [ ] Subject: "Welcome to MeepleGo - Confirm your account"
- [ ] **Magic Link Template** updated with:
  - [ ] `{{ .ConfirmationURL }}` placeholder used
  - [ ] User expectations set (link expires in 1 hour)
  - [ ] Subject: "Your MeepleGo sign-in link"
- [ ] **Reset Password Template** updated with:
  - [ ] `{{ .ConfirmationURL }}` placeholder used
  - [ ] User expectations set (link expires in 1 hour)
  - [ ] Subject: "Reset your MeepleGo password"
- [ ] **Email Change Template** updated with:
  - [ ] `{{ .ConfirmationURL }}` placeholder used
  - [ ] User expectations set (link expires in 24 hours)
  - [ ] Subject: "Confirm your new email address"

**Location**: Supabase Dashboard → Authentication → Email Templates

### ✅ 2. SMTP Provider Setup

#### Provider Selection & Configuration

- [ ] **SMTP provider chosen** (Resend, SendGrid, Mailgun, AWS SES)
- [ ] **SMTP settings configured in Supabase**:
  - [ ] SMTP Host set correctly
  - [ ] SMTP Port set (usually 587)
  - [ ] SMTP User configured
  - [ ] SMTP Password/API Key added
  - [ ] Admin Email set to `noreply@meeplego.com`
  - [ ] Sender Name set to "MeepleGo"

**Location**: Supabase Dashboard → Settings → Auth → SMTP Settings

#### Domain Verification (with chosen provider)

- [ ] **Domain added to SMTP provider**
- [ ] **Domain verification completed**
- [ ] **DKIM keys obtained from provider**
- [ ] **SPF include value obtained from provider**

### ✅ 3. DNS Configuration

#### SPF Record

- [ ] **SPF record added** to meeplego.com DNS:
  ```
  Type: TXT
  Name: @
  Value: v=spf1 include:[provider-spf] ~all
  TTL: 3600
  ```
- [ ] **SPF record verified** with `dig TXT meeplego.com`

#### DKIM Record

- [ ] **DKIM record(s) added** from SMTP provider:
  ```
  Type: TXT
  Name: [selector]._domainkey.meeplego.com
  Value: v=DKIM1; k=rsa; p=[public-key]
  TTL: 3600
  ```
- [ ] **DKIM record verified** with `dig TXT [selector]._domainkey.meeplego.com`

#### DMARC Record (Start with Monitoring)

- [ ] **DMARC record added**:
  ```
  Type: TXT
  Name: _dmarc.meeplego.com
  Value: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
  TTL: 3600
  ```
- [ ] **DMARC record verified** with `dig TXT _dmarc.meeplego.com`

#### DNS Propagation

- [ ] **DNS propagation verified** (allow 24-48 hours)
- [ ] **Multiple DNS servers checked** (8.8.8.8, 1.1.1.1, 208.67.222.222)
- [ ] **Online propagation tools used** (dnschecker.org, whatsmydns.net)

### ✅ 4. Environment Variables

#### Production Environment

- [ ] **Environment variables set in hosting provider**:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - [ ] `NEXT_PUBLIC_SITE_URL=https://meeplego.com`
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_AUTH_REDIRECT_BASE=https://meeplego.com`

#### Staging Environment (if applicable)

- [ ] **Staging environment variables set**
- [ ] **Separate Supabase project used for staging**

#### Security Verification

- [ ] **Service role key not exposed to client**
- [ ] **Environment-specific keys used**
- [ ] **No production keys in version control**

## Launch Testing

### ✅ 5. Email Deliverability Testing

#### Test Setup

- [ ] **Test email addresses created** for major providers:
  - [ ] Gmail test account
  - [ ] Outlook test account
  - [ ] iCloud test account
  - [ ] Yahoo test account (optional)

#### Automated Testing

- [ ] **Email deliverability script run**: `npm run test:email`
- [ ] **All test emails sent successfully**
- [ ] **Timing recorded** (should be < 30 seconds)

#### Manual Verification

- [ ] **Signup confirmation emails received**:
  - [ ] Gmail: ✅ Inbox placement ✅ Correct template ✅ Link works
  - [ ] Outlook: ✅ Inbox placement ✅ Correct template ✅ Link works
  - [ ] iCloud: ✅ Inbox placement ✅ Correct template ✅ Link works
- [ ] **Magic link emails received**:
  - [ ] Gmail: ✅ Inbox placement ✅ Correct template ✅ Link works
  - [ ] Outlook: ✅ Inbox placement ✅ Correct template ✅ Link works
  - [ ] iCloud: ✅ Inbox placement ✅ Correct template ✅ Link works
- [ ] **Password reset emails received**:
  - [ ] Gmail: ✅ Inbox placement ✅ Correct template ✅ Link works
  - [ ] Outlook: ✅ Inbox placement ✅ Correct template ✅ Link works
  - [ ] iCloud: ✅ Inbox placement ✅ Correct template ✅ Link works

#### Email Authentication Verification

- [ ] **Email headers checked** for authentication:
  - [ ] `Authentication-Results: spf=pass`
  - [ ] `Authentication-Results: dkim=pass`
  - [ ] `Authentication-Results: dmarc=pass`
- [ ] **Spam score checked** (use mail-tester.com)
- [ ] **No emails in spam folder**

### ✅ 6. Authentication Flow Testing

#### End-to-End Testing

- [ ] **Signup flow tested**:
  - [ ] User can signup with email
  - [ ] Confirmation email received and functional
  - [ ] User can confirm email and access app
- [ ] **Magic link flow tested**:
  - [ ] User can request magic link
  - [ ] Magic link email received and functional
  - [ ] User can sign in via magic link
- [ ] **Password reset flow tested**:
  - [ ] User can request password reset
  - [ ] Reset email received and functional
  - [ ] User can reset password successfully
- [ ] **Session handling tested**:
  - [ ] Sessions persist across browser refresh
  - [ ] User stays logged in as expected
  - [ ] Logout works correctly

#### Cross-Browser Testing

- [ ] **Chrome**: ✅ All flows work
- [ ] **Safari**: ✅ All flows work
- [ ] **Firefox**: ✅ All flows work
- [ ] **Mobile Safari**: ✅ All flows work
- [ ] **Mobile Chrome**: ✅ All flows work

#### Error Handling

- [ ] **Invalid/expired links handled gracefully**
- [ ] **Network errors handled appropriately**
- [ ] **Clear error messages displayed**

## Post-Launch Monitoring

### ✅ 7. DMARC Policy Tightening

#### Week 1: Monitoring Phase

- [ ] **DMARC reports monitored**
- [ ] **Authentication failures analyzed**
- [ ] **No legitimate email failures detected**

#### Week 2-3: Quarantine Phase

- [ ] **DMARC policy updated to quarantine**:
  ```
  v=DMARC1; p=quarantine; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
  ```
- [ ] **Email delivery monitored**
- [ ] **No user complaints about missing emails**

#### Week 4+: Reject Phase

- [ ] **DMARC policy updated to reject**:
  ```
  v=DMARC1; p=reject; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
  ```
- [ ] **Full protection active**

### ✅ 8. Ongoing Monitoring

#### Daily Monitoring (First Week)

- [ ] **Email delivery metrics checked**
- [ ] **Authentication failure alerts monitored**
- [ ] **User signup success rate tracked**

#### Weekly Monitoring

- [ ] **DMARC reports reviewed**
- [ ] **Email deliverability rates checked**
- [ ] **DNS record health verified**

#### Monthly Monitoring

- [ ] **SMTP provider metrics reviewed**
- [ ] **Authentication settings audited**
- [ ] **Security best practices verified**

## Emergency Procedures

### ✅ 9. Incident Response

#### Email Delivery Issues

- [ ] **Incident response plan documented**:
  1. Check Supabase auth status
  2. Verify SMTP provider status
  3. Check DNS record integrity
  4. Temporarily relax DMARC policy if needed
  5. Contact SMTP provider support

#### DNS Issues

- [ ] **DNS troubleshooting steps documented**:
  1. Verify record syntax
  2. Check for conflicting records
  3. Flush DNS cache
  4. Use alternative DNS servers
  5. Contact DNS provider support

## Acceptance Criteria Verification

### ✅ Final Verification

- [ ] **✅ Auth emails work across all major providers (Gmail, Outlook, iCloud)**
- [ ] **✅ All emails pass SPF, DKIM, and DMARC checks**
- [ ] **✅ Emails delivered to inbox (not spam) within 30 seconds**
- [ ] **✅ All auth flows (signup, magic link, password reset) functional**
- [ ] **✅ DNS records properly configured and propagated**
- [ ] **✅ DMARC policy successfully tightened after testing**

## Documentation & Handoff

### ✅ 10. Documentation Complete

- [ ] **Configuration documented** for future reference
- [ ] **Monitoring procedures documented**
- [ ] **Emergency contacts and procedures documented**
- [ ] **Team trained on authentication monitoring**

---

## Quick Reference Commands

### Test Email Deliverability

```bash
npm run test:email
```

### Check DNS Records

```bash
dig TXT meeplego.com                    # SPF
dig TXT _dmarc.meeplego.com            # DMARC
dig TXT [selector]._domainkey.meeplego.com  # DKIM
```

### Verify Supabase Configuration

```bash
# Check environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SITE_URL

# Test auth endpoints
curl -I https://meeplego.com/auth/callback
```

---

**🎉 Launch Ready**: When all items are checked, MeepleGo is ready for production launch with fully configured and tested email authentication!
