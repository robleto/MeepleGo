# Supabase Production Configuration Guide

This guide provides step-by-step instructions for configuring Supabase for production launch of MeepleGo, including redirect URLs, email templates, SMTP settings, and DNS configuration.

## 1. Redirect URL Configuration

### Required Redirect URLs

Configure these URLs in your Supabase project dashboard under Authentication → URL Configuration:

#### Production URLs
```
https://meeplego.com/auth/callback
```

#### Staging URLs (if applicable)
```
https://staging.meeplego.com/auth/callback
https://preview.meeplego.com/auth/callback
```

#### Development URLs
```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### Configuration Steps

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. In the **Redirect URLs** section, add each URL listed above
4. Ensure there are no trailing slashes or query parameters
5. Save the configuration

## 2. Email Template Configuration

### Required Templates

Configure these email templates in Authentication → Email Templates:

#### Confirm Signup Template
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>

<p>This link expires in 24 hours and will open in your default browser.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

#### Magic Link Template
```html
<h2>Your magic link</h2>

<p>Follow this link to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to MeepleGo</a></p>

<p>This link expires in 1 hour and will open in your default browser.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

#### Reset Password Template
```html
<h2>Reset your password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>

<p>This link expires in 1 hour and will open in your default browser.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

#### Email Change Template
```html
<h2>Confirm email change</h2>

<p>Follow this link to confirm your new email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email change</a></p>

<p>This link expires in 24 hours and will open in your default browser.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### Template Configuration Steps

1. Go to **Authentication** → **Email Templates**
2. For each template type, click **Edit**
3. Replace the default template with the corresponding template above
4. Ensure `{{ .ConfirmationURL }}` is used exactly as shown
5. Set appropriate subject lines:
   - Confirm signup: "Welcome to MeepleGo - Confirm your account"
   - Magic Link: "Your MeepleGo sign-in link"
   - Reset Password: "Reset your MeepleGo password"
   - Email Change: "Confirm your new email address"
6. Save each template

## 3. SMTP Configuration

### Recommended SMTP Providers
- **Resend** (recommended for developer experience)
- **SendGrid** (reliable, good deliverability)
- **Mailgun** (good for transactional emails)
- **AWS SES** (cost-effective for high volume)

### SMTP Settings in Supabase

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Enable **Enable custom SMTP**
3. Configure based on your provider:

#### Example: Resend Configuration
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: [Your Resend API Key]
SMTP Admin Email: noreply@meeplego.com
SMTP Sender Name: MeepleGo
```

#### Example: SendGrid Configuration
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
SMTP Admin Email: noreply@meeplego.com
SMTP Sender Name: MeepleGo
```

## 4. DNS Configuration for meeplego.com

### Required DNS Records

Add these DNS records to your domain registrar or DNS provider:

#### SPF Record (TXT Record)
```
Name: @
Type: TXT
Value: v=spf1 include:[provider-spf] ~all
TTL: 3600
```

Replace `[provider-spf]` with your SMTP provider's SPF include:
- Resend: `include:_spf.resend.com`
- SendGrid: `include:sendgrid.net`
- Mailgun: `include:mailgun.org`
- AWS SES: `include:amazonses.com`

#### DKIM Record (TXT Record)
Your SMTP provider will provide the exact DKIM record. Example format:
```
Name: [selector]._domainkey.meeplego.com
Type: TXT
Value: v=DKIM1; k=rsa; p=[public-key]
TTL: 3600
```

#### DMARC Record (TXT Record) - Start with Relaxed Policy
```
Name: _dmarc.meeplego.com
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
TTL: 3600
```

### DNS Verification Steps

1. **Check SPF Record**:
   ```bash
   dig TXT meeplego.com | grep spf1
   ```

2. **Check DKIM Record**:
   ```bash
   dig TXT [selector]._domainkey.meeplego.com
   ```

3. **Check DMARC Record**:
   ```bash
   dig TXT _dmarc.meeplego.com
   ```

4. **Online Tools**:
   - Use [MXToolbox](https://mxtoolbox.com/) for comprehensive DNS checking
   - Use [DMARC Analyzer](https://www.dmarcanalyzer.com/) for DMARC validation

## 5. Email Deliverability Testing

### Test Recipients
Create test accounts with major providers:
- Gmail: `test@gmail.com`
- Outlook: `test@outlook.com`
- iCloud: `test@icloud.com`
- Yahoo: `test@yahoo.com`

### Testing Procedures

1. **Test Signup Flow**:
   ```bash
   # Use your auth test page
   curl -X POST "https://meeplego.com/api/auth/test-signup" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@gmail.com"}'
   ```

2. **Test Magic Link Flow**:
   - Visit `/auth/providers` on your domain
   - Enter test email addresses
   - Request magic links
   - Check email delivery time and placement

3. **Test Password Reset Flow**:
   - Use existing test accounts
   - Request password reset
   - Verify email delivery and functionality

### Email Header Verification

Check that emails pass authentication:
1. View email source/headers
2. Verify these headers show "PASS":
   - `Authentication-Results: spf=pass`
   - `Authentication-Results: dkim=pass`
   - `Authentication-Results: dmarc=pass`

### Spam Testing Tools
- [Mail Tester](https://www.mail-tester.com/)
- [Litmus Spam Testing](https://www.litmus.com/)
- [GlockApps](https://glockapps.com/)

## 6. Environment Variables for Production

### Required Environment Variables

Set these in your hosting provider (Vercel, Netlify, etc.):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://meeplego.com
NODE_ENV=production

# Optional: Custom auth redirect base
NEXT_PUBLIC_AUTH_REDIRECT_BASE=https://meeplego.com
```

### Security Considerations

1. **Never expose service role key to client**
2. **Use environment-specific keys** (separate projects for staging/production)
3. **Rotate keys periodically**
4. **Monitor usage in Supabase dashboard**

## 7. Production Deployment Checklist

### Pre-Deployment
- [ ] All redirect URLs configured in Supabase
- [ ] Email templates updated with `{{ .ConfirmationURL }}`
- [ ] SMTP provider configured and tested
- [ ] DNS records added and propagated
- [ ] Environment variables set in hosting provider
- [ ] Test emails sent to all major providers

### Post-Deployment
- [ ] Test signup flow with real email addresses
- [ ] Test magic link flow end-to-end
- [ ] Test password reset flow
- [ ] Verify email headers show SPF/DKIM/DMARC pass
- [ ] Check spam folder placement across providers
- [ ] Monitor email delivery metrics

### DMARC Policy Tightening (After Successful Testing)

Once all tests pass and emails are delivering properly, tighten the DMARC policy:

```
# Week 1: Monitor mode
v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1

# Week 2: Quarantine failed emails
v=DMARC1; p=quarantine; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1

# Week 3+: Reject failed emails (strictest policy)
v=DMARC1; p=reject; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
```

## 8. Monitoring and Maintenance

### Regular Checks
- Monitor Supabase auth metrics
- Review DMARC reports weekly
- Check email delivery rates
- Monitor DNS record health

### Troubleshooting Common Issues
- **Emails in spam**: Check SPF/DKIM/DMARC records
- **Callback errors**: Verify redirect URLs are exact matches
- **Session issues**: Clear browser cookies and test again
- **DNS propagation**: Allow 24-48 hours for global propagation

## Acceptance Criteria

✅ **Auth emails work across all major providers (Gmail, Outlook, iCloud)**  
✅ **All emails pass SPF, DKIM, and DMARC checks**  
✅ **Emails delivered to inbox (not spam) within 30 seconds**  
✅ **All auth flows (signup, magic link, password reset) functional**  
✅ **DNS records properly configured and propagated**  
✅ **DMARC policy successfully tightened after testing**  