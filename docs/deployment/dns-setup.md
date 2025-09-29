# DNS Setup for MeepleGo Email Deliverability

This guide provides specific DNS record configurations to ensure email deliverability for the meeplego.com domain.

## Overview

Proper email authentication requires three types of DNS records:
- **SPF** (Sender Policy Framework): Authorizes sending servers
- **DKIM** (DomainKeys Identified Mail): Cryptographic signature validation
- **DMARC** (Domain-based Message Authentication): Policy enforcement

## DNS Records by SMTP Provider

### Resend (Recommended)

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### DKIM Record
After adding your domain in Resend, you'll get a DKIM record like:
```
Type: TXT
Name: [selector]._domainkey.meeplego.com
Value: v=DKIM1; k=rsa; p=[public-key-from-resend]
TTL: 3600
```

### SendGrid

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600
```

#### DKIM Records
SendGrid provides multiple DKIM records:
```
Type: CNAME
Name: s1._domainkey.meeplego.com
Value: s1.domainkey.u[USER_ID].wl[WHITELABEL_ID].sendgrid.net
TTL: 3600

Type: CNAME
Name: s2._domainkey.meeplego.com
Value: s2.domainkey.u[USER_ID].wl[WHITELABEL_ID].sendgrid.net
TTL: 3600
```

### Mailgun

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all
TTL: 3600
```

#### DKIM Record
```
Type: TXT
Name: smtp._domainkey.meeplego.com
Value: k=rsa; p=[public-key-from-mailgun]
TTL: 3600
```

### AWS SES

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### DKIM Records
AWS SES provides three CNAME records:
```
Type: CNAME
Name: [token1]._domainkey.meeplego.com
Value: [token1].dkim.amazonses.com
TTL: 3600

Type: CNAME
Name: [token2]._domainkey.meeplego.com
Value: [token2].dkim.amazonses.com
TTL: 3600

Type: CNAME
Name: [token3]._domainkey.meeplego.com
Value: [token3].dkim.amazonses.com
TTL: 3600
```

## DMARC Configuration

### Phase 1: Monitoring (Week 1)
```
Type: TXT
Name: _dmarc.meeplego.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
TTL: 3600
```

### Phase 2: Quarantine (Week 2-3)
```
Type: TXT
Name: _dmarc.meeplego.com
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
TTL: 3600
```

### Phase 3: Reject (Week 4+)
```
Type: TXT
Name: _dmarc.meeplego.com
Value: v=DMARC1; p=reject; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1
TTL: 3600
```

## DNS Record Templates

### Cloudflare DNS

1. Go to your Cloudflare dashboard
2. Select the meeplego.com domain
3. Go to DNS → Records
4. Add the following records:

```bash
# SPF Record
Type: TXT, Name: @, Content: v=spf1 include:[provider-spf] ~all, TTL: Auto

# DKIM Record (example for Resend)
Type: TXT, Name: [selector]._domainkey, Content: v=DKIM1; k=rsa; p=[public-key], TTL: Auto

# DMARC Record (start with monitoring)
Type: TXT, Name: _dmarc, Content: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1, TTL: Auto
```

### Namecheap DNS

1. Login to Namecheap account
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add the following records:

```bash
# SPF Record
Type: TXT Record, Host: @, Value: v=spf1 include:[provider-spf] ~all, TTL: Automatic

# DKIM Record
Type: TXT Record, Host: [selector]._domainkey, Value: v=DKIM1; k=rsa; p=[public-key], TTL: Automatic

# DMARC Record
Type: TXT Record, Host: _dmarc, Value: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1, TTL: Automatic
```

### GoDaddy DNS

1. Go to GoDaddy DNS Management
2. Add the following records:

```bash
# SPF Record
Type: TXT, Name: @, Value: v=spf1 include:[provider-spf] ~all, TTL: 600

# DKIM Record
Type: TXT, Name: [selector]._domainkey, Value: v=DKIM1; k=rsa; p=[public-key], TTL: 600

# DMARC Record
Type: TXT, Name: _dmarc, Value: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com; ruf=mailto:dmarc@meeplego.com; fo=1, TTL: 600
```

## DNS Verification Commands

### Check SPF Record
```bash
dig TXT meeplego.com | grep spf1
# Should return: v=spf1 include:[provider-spf] ~all

# Alternative tools
nslookup -type=TXT meeplego.com
host -t TXT meeplego.com
```

### Check DKIM Record
```bash
dig TXT [selector]._domainkey.meeplego.com
# Should return: v=DKIM1; k=rsa; p=[public-key]

# Example for Resend
dig TXT resend._domainkey.meeplego.com
```

### Check DMARC Record
```bash
dig TXT _dmarc.meeplego.com
# Should return: v=DMARC1; p=none; rua=mailto:dmarc@meeplego.com...
```

### Comprehensive DNS Check
```bash
# Check all records at once
dig TXT meeplego.com
dig TXT _dmarc.meeplego.com
dig TXT [selector]._domainkey.meeplego.com
```

## DNS Propagation

### Propagation Timeline
- **Local DNS**: 0-30 minutes
- **ISP DNS**: 30 minutes - 4 hours
- **Global DNS**: 4-48 hours

### Check Propagation Status
```bash
# Check from multiple locations
dig @8.8.8.8 TXT meeplego.com           # Google DNS
dig @1.1.1.1 TXT meeplego.com           # Cloudflare DNS
dig @208.67.222.222 TXT meeplego.com    # OpenDNS
```

### Online Propagation Tools
- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://whatsmydns.net/)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

## Email Authentication Testing

### Online Testing Tools
- [MXToolbox](https://mxtoolbox.com/spf.aspx)
- [DMARC Analyzer](https://www.dmarcanalyzer.com/)
- [Mail Tester](https://www.mail-tester.com/)
- [DKIMValidator](https://dkimvalidator.com/)

### Test Email Headers
After sending test emails, check headers for:
```
Authentication-Results: mx.google.com;
  spf=pass (google.com: domain of noreply@meeplego.com designates [IP] as permitted sender);
  dkim=pass header.i=@meeplego.com header.s=[selector] header.b=[signature];
  dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=meeplego.com
```

## Troubleshooting Common Issues

### SPF Record Issues
**Problem**: SPF failures
**Solutions**:
- Ensure only one SPF record exists
- Check include syntax: `include:_spf.provider.com`
- Verify provider-specific SPF requirements

### DKIM Record Issues
**Problem**: DKIM validation failures
**Solutions**:
- Verify DKIM record format matches provider requirements
- Check selector name matches provider configuration
- Ensure no extra spaces or line breaks in TXT record

### DMARC Issues
**Problem**: DMARC failures
**Solutions**:
- Start with `p=none` for monitoring
- Verify SPF and DKIM pass first
- Check email address format in `rua` and `ruf`

### DNS Propagation Issues
**Problem**: Records not resolving
**Solutions**:
- Wait 24-48 hours for full propagation
- Check TTL values (lower = faster propagation)
- Verify record syntax with DNS provider

## Security Considerations

### SPF Record Security
- Use `~all` (soft fail) initially, then `−all` (hard fail) after testing
- Don't include unnecessary servers
- Monitor SPF record length (255 character limit)

### DKIM Security
- Use 2048-bit keys minimum
- Rotate DKIM keys annually
- Monitor for key compromise

### DMARC Security
- Start with monitoring (`p=none`)
- Gradually increase policy strictness
- Set up DMARC report monitoring

## Maintenance Schedule

### Weekly Tasks
- Review DMARC reports
- Check email delivery metrics
- Monitor authentication failures

### Monthly Tasks
- Verify DNS record integrity
- Check for DNS propagation issues
- Review and update DMARC policy if needed

### Quarterly Tasks
- Rotate DKIM keys
- Review SPF record includes
- Audit email authentication setup

## Emergency Procedures

### Email Delivery Issues
1. Check DNS records immediately
2. Verify SMTP provider status
3. Temporarily relax DMARC policy if needed
4. Contact SMTP provider support

### DNS Propagation Problems
1. Verify record syntax with DNS provider
2. Check for conflicting records
3. Flush local DNS cache
4. Use alternative DNS servers for testing