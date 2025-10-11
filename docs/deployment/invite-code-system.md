# Private Beta Access Control

MeepleGo uses an invite code system to control access during the private beta phase. This document explains how the system works and how to manage invite codes.

## Overview

The invite code system ensures that only invited users can sign up for MeepleGo during the private beta. Users must provide a valid invite code during signup.

## How It Works

### User Signup Flow

1. User visits `/signup`
2. User sees a notice that MeepleGo is in private beta
3. User must enter an invite code along with email and password
4. System validates the invite code before creating the account:
   - Checks if code exists
   - Checks if code has expired
   - Checks if code has reached its usage limit
5. On successful signup, the system:
   - Increments the usage counter for that invite code
   - Stores the used invite code in the user's profile metadata
6. User receives email confirmation

### Database Schema

**invite_codes table:**
```sql
- id: uuid (primary key)
- code: text (unique, the actual invite code)
- max_uses: integer (maximum number of times this code can be used)
- current_uses: integer (current usage count)
- created_by: uuid (optional, references auth.users)
- created_at: timestamp
- expires_at: timestamp (optional expiration date)
- notes: text (optional description/notes)
```

**profiles table:**
- Added `invite_code_used` column to track which code each user used

### API Endpoints

**POST /api/auth/validate-invite**
- Validates an invite code
- Returns: `{ valid: boolean, code?: string, error?: string }`

**PUT /api/auth/validate-invite**
- Increments the usage counter for an invite code
- Called after successful signup
- Returns: `{ success: boolean, error?: string }`

## Initial Invite Codes

Two invite codes are pre-populated in the database migration:

1. **BETA2025**
   - 20 maximum uses
   - For initial private beta testers

2. **MEEPLEGO-PREVIEW**
   - 10 maximum uses
   - For preview access

## Managing Invite Codes

### Creating New Invite Codes

To create new invite codes, insert directly into the database:

```sql
INSERT INTO public.invite_codes (code, max_uses, notes, expires_at)
VALUES (
  'YOUR-CODE-HERE',
  10,
  'Description of this code',
  '2025-12-31 23:59:59+00'  -- Optional expiration date
);
```

### Viewing Invite Code Usage

```sql
SELECT 
  code, 
  current_uses, 
  max_uses,
  (max_uses - current_uses) as remaining_uses,
  created_at,
  expires_at,
  notes
FROM public.invite_codes
ORDER BY created_at DESC;
```

### Checking Which Users Used Specific Codes

```sql
SELECT 
  p.email,
  p.username,
  p.invite_code_used,
  p.created_at
FROM public.profiles p
WHERE p.invite_code_used = 'BETA2025'
ORDER BY p.created_at DESC;
```

### Deactivating an Invite Code

Set current_uses to max_uses:

```sql
UPDATE public.invite_codes
SET current_uses = max_uses
WHERE code = 'CODE-TO-DISABLE';
```

Or set an expiration date in the past:

```sql
UPDATE public.invite_codes
SET expires_at = NOW() - INTERVAL '1 day'
WHERE code = 'CODE-TO-DISABLE';
```

## Security

- Row Level Security (RLS) is enabled on the invite_codes table
- Anonymous users can only validate active codes (needed for signup validation)
- Authenticated users can view all invite codes
- Only service role can create/update/delete invite codes

## Monitoring

Track beta signup success with these metrics:

1. **Total signups by invite code:**
```sql
SELECT 
  invite_code_used,
  COUNT(*) as signup_count
FROM public.profiles
WHERE invite_code_used IS NOT NULL
GROUP BY invite_code_used
ORDER BY signup_count DESC;
```

2. **Signup rate over time:**
```sql
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signups
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date;
```

## Success Criteria

Per the launch checklist, the private beta aims for:
- 10–20 initial users
- ≥80% first-try auth callback success
- ≥2 saved lists per user
- <1% error rate on pages; 0 auth-related 500s

Monitor these metrics in your analytics and error tracking tools.

## Transitioning to Public Access

When ready to open public signups:

1. **Option 1: Remove invite code requirement**
   - Update signup page to make invite code optional or remove it entirely
   - Keep the table for analytics/tracking

2. **Option 2: Create a public invite code**
   - Create a code like 'PUBLIC' with unlimited uses (set max_uses to a very high number)
   - Display this code on the signup page for all users

3. **Option 3: Keep for analytics**
   - Continue requiring invite codes but make them widely available
   - Track different acquisition channels with different codes
