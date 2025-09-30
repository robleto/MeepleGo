# Environment Variables for MeepleGo Deployment

This document provides environment variable configurations for different deployment environments.

## Production Environment (.env.production)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://meeplego.com
NODE_ENV=production

# Authentication Configuration
NEXT_PUBLIC_AUTH_REDIRECT_BASE=https://meeplego.com

# Optional: Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
```

## Staging Environment (.env.staging)

```bash
# Supabase Configuration (separate project recommended)
NEXT_PUBLIC_SUPABASE_URL=https://staging-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=staging-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://staging.meeplego.com
NODE_ENV=production

# Authentication Configuration
NEXT_PUBLIC_AUTH_REDIRECT_BASE=https://staging.meeplego.com

# Optional: Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=staging-analytics-id
SENTRY_DSN=staging-sentry-dsn
```

## Development Environment (.env.local)

```bash
# Supabase Configuration (local or dedicated dev project)
NEXT_PUBLIC_SUPABASE_URL=https://dev-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=dev-service-role-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Authentication Configuration
NEXT_PUBLIC_AUTH_REDIRECT_BASE=http://localhost:3000

# Development Only
NEXT_PUBLIC_E2E_MODE=0

# Optional: Local Supabase (if using supabase start)
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
# SUPABASE_SERVICE_ROLE_KEY=local-service-role-key
```

## Hosting Provider Configuration

### Vercel

Add these environment variables in your Vercel project settings:

1. Go to Project Settings → Environment Variables
2. Add each variable with the appropriate environment (Production, Preview, Development)
3. For sensitive values like `SUPABASE_SERVICE_ROLE_KEY`, ensure they're only available to server functions

### Netlify

Add these in your Netlify site settings:

1. Go to Site Settings → Environment Variables
2. Add each variable
3. For branch-specific variables, use the branch deploy settings

### Other Hosting Providers

Follow your hosting provider's documentation for setting environment variables. Common locations:
- **Railway**: Project Settings → Variables
- **Render**: Environment Variables tab
- **Heroku**: Settings → Config Vars
- **Digital Ocean App Platform**: App Settings → Environment

## Security Best Practices

### Environment Separation
- **Use separate Supabase projects** for production, staging, and development
- **Never share service role keys** between environments
- **Rotate keys regularly** (quarterly recommended)

### Key Management
- **Service role keys** should only be accessible to server-side code
- **Never commit** `.env.local` or production keys to version control
- **Use your hosting provider's secrets management** when available

### Access Control
- **Limit service role key permissions** in Supabase (if possible)
- **Monitor usage** in Supabase dashboard
- **Set up alerts** for unusual activity

## Validation Checklist

### Before Deployment
- [ ] All required environment variables are set
- [ ] Supabase URLs are correct for the environment
- [ ] Site URLs match the actual deployment URLs
- [ ] Service role keys are server-only
- [ ] Auth redirect base matches site URL

### After Deployment
- [ ] Test authentication flows
- [ ] Verify email deliverability
- [ ] Check error logging (Sentry)
- [ ] Validate analytics tracking
- [ ] Test API endpoints

## Troubleshooting

### Common Issues

**"Invalid API key" errors:**
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check that the key matches the Supabase project

**"Not authorized" errors:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure the key is not exposed to client-side code

**Redirect URL mismatches:**
- Verify `NEXT_PUBLIC_AUTH_REDIRECT_BASE` matches your domain
- Check that all redirect URLs are allowlisted in Supabase

**Environment variable not found:**
- Ensure variables are set in your hosting provider
- Check that you're using the correct variable names
- Verify variables are available in the correct environment (server vs client)

### Debugging Tools

**Check environment variables in your app:**
```javascript
// Client-side (browser console)
console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

// Server-side (API routes or server components)
console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
```

**Test Supabase connection:**
```bash
# Run the email deliverability test
npm run test:email
```

## Environment Variable Reference

| Variable | Environment | Required | Description |
|----------|-------------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | All | Yes | Full URL of your deployed app |
| `NODE_ENV` | All | Yes | Environment type (`development`, `production`) |
| `NEXT_PUBLIC_AUTH_REDIRECT_BASE` | All | No | Base URL for auth redirects (defaults to SITE_URL) |
| `NEXT_PUBLIC_E2E_MODE` | Dev/Test | No | Enable E2E testing mode |
| `NEXT_PUBLIC_ANALYTICS_ID` | Prod/Staging | No | Analytics tracking ID |
| `SENTRY_DSN` | Prod/Staging | No | Error tracking DSN |