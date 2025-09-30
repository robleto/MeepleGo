# MeepleGo Deployment Documentation

This directory contains comprehensive documentation for deploying MeepleGo to production, with a focus on Supabase configuration and email deliverability.

## 📋 Quick Start

1. **Validate Current Setup**: `npm run validate:launch`
2. **Follow Launch Checklist**: [supabase-launch-checklist.md](./supabase-launch-checklist.md)
3. **Test Email Delivery**: `npm run test:email`

## 📚 Documentation Index

### Core Guides

- **[Supabase Launch Checklist](./supabase-launch-checklist.md)** - Complete step-by-step launch checklist
- **[Supabase Production Config](./supabase-production-config.md)** - Detailed configuration guide
- **[DNS Setup](./dns-setup.md)** - Email deliverability DNS configuration
- **[Environment Variables](./environment-variables.md)** - Environment setup templates

### Testing Tools

- **[Email Deliverability Test](../../scripts/deployment/test-email-deliverability.js)** - Automated email testing
- **[Launch Config Validation](../../scripts/deployment/validate-launch-config.js)** - Pre-launch validation

## 🛠️ Available Commands

```bash
# Validate launch configuration
npm run validate:launch

# Test email deliverability across providers
npm run test:email

# Build for production
npm run build

# Start production server
npm run start
```

## 🚀 Launch Process Overview

### 1. Pre-Launch Setup

- [ ] Configure Supabase redirect URLs
- [ ] Set up email templates with `{{ .ConfirmationURL }}`
- [ ] Choose and configure SMTP provider
- [ ] Set up DNS records (SPF, DKIM, DMARC)
- [ ] Configure environment variables

### 2. Testing & Validation

- [ ] Run `npm run validate:launch`
- [ ] Run `npm run test:email`
- [ ] Test auth flows manually
- [ ] Verify email headers and deliverability

### 3. Production Deployment

- [ ] Deploy to hosting provider
- [ ] Configure production environment variables
- [ ] Test live authentication flows
- [ ] Monitor email delivery metrics

### 4. Post-Launch Monitoring

- [ ] Monitor DMARC reports
- [ ] Tighten DMARC policy progressively
- [ ] Track authentication success rates
- [ ] Review email deliverability metrics

## 🎯 Key Configuration Areas

### Supabase Dashboard

- Authentication → URL Configuration (Redirect URLs)
- Authentication → Email Templates
- Settings → Auth → SMTP Settings

### DNS Provider

- SPF Record: `v=spf1 include:[provider-spf] ~all`
- DKIM Record: From SMTP provider
- DMARC Record: Start with `p=none`, tighten after testing

### Hosting Provider

- Environment variables for production
- SSL/TLS configuration
- Build and deployment settings

## 🔍 Troubleshooting

### Common Issues

- **Email in spam**: Check SPF/DKIM/DMARC records
- **Auth redirect errors**: Verify exact URL matches in allowlist
- **Session not found**: Clear browser cookies and test again
- **DNS not propagating**: Allow 24-48 hours, check multiple DNS servers

### Debug Commands

```bash
# Check DNS records
dig TXT meeplego.com                    # SPF
dig TXT _dmarc.meeplego.com            # DMARC
dig TXT [selector]._domainkey.meeplego.com  # DKIM

# Test Supabase connection
npm run validate:launch

# Test email delivery
npm run test:email
```

## 📞 Support Resources

### Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Online Tools

- [MXToolbox](https://mxtoolbox.com/) - DNS and email testing
- [Mail Tester](https://www.mail-tester.com/) - Email deliverability testing
- [DNS Propagation Checker](https://dnschecker.org/)

### Testing Services

- Gmail, Outlook, iCloud for email testing
- Multiple browsers for auth flow testing
- Multiple devices for responsive testing

## ✅ Acceptance Criteria

Before marking the launch as complete, ensure:

- [ ] ✅ Auth emails work across all major providers (Gmail, Outlook, iCloud)
- [ ] ✅ All emails pass SPF, DKIM, and DMARC checks
- [ ] ✅ Emails delivered to inbox (not spam) within 30 seconds
- [ ] ✅ All auth flows (signup, magic link, password reset) functional
- [ ] ✅ DNS records properly configured and propagated
- [ ] ✅ DMARC policy successfully tightened after testing

---

**Need help?** Check the individual guide files or run the validation commands to identify specific issues.
