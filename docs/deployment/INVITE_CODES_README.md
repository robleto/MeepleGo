# Invite Code Management Scripts

Quick reference for managing MeepleGo invite codes during private beta.

## Prerequisites

Make sure you have the following environment variables set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Scripts

### Generate New Invite Code

Creates a new invite code with custom settings.

```bash
npm run invite:generate
```

**Interactive prompts:**
1. Invite code (e.g., BETA2025)
2. Maximum uses (default: 10)
3. Expiration date (optional, format: YYYY-MM-DD)
4. Notes/description (optional)

**Example:**
```bash
$ npm run invite:generate

🎲 MeepleGo Invite Code Generator

Enter invite code (e.g., BETA2025): FRIEND-INVITE
Maximum uses (default: 10): 5
Expiration date (YYYY-MM-DD, or leave empty for no expiration): 2025-12-31
Notes (optional description): For friends and family

📝 Invite Code Summary:
Code: FRIEND-INVITE
Max Uses: 5
Expires: 12/31/2025
Notes: For friends and family

Create this invite code? (yes/no): yes

✅ Invite code created successfully!

Share this code with users: FRIEND-INVITE

Users can sign up at: https://meeplego.com/signup
```

### Check Invite Code Usage

Views all invite codes with usage statistics and user signups.

```bash
npm run invite:check
```

**Output includes:**
- All invite codes with status (active/inactive)
- Usage statistics (current/max uses, percentage used)
- Expiration dates
- Recent user signups per code
- Success criteria progress

**Example output:**
```bash
$ npm run invite:check

🎲 MeepleGo Invite Code Status

📊 Invite Codes:

────────────────────────────────────────────────────────────────────────────────────────────────────
Code: BETA2025
Status: ✅ Active
Usage: 5/20 (25.0% used, 15 remaining)
Expires: Never
Notes: Initial private beta access - 20 users
Created: 10/11/2025
────────────────────────────────────────────────────────────────────────────────────────────────────
Code: MEEPLEGO-PREVIEW
Status: ✅ Active
Usage: 3/10 (30.0% used, 7 remaining)
Expires: Never
Notes: Preview access for early testers
Created: 10/11/2025
────────────────────────────────────────────────────────────────────────────────────────────────────

👥 User Statistics:

BETA2025: 5 users
  Recent signups:
  - 10/11/2025, 2:45:00 PM
  - 10/11/2025, 1:30:00 PM
  - 10/11/2025, 10:15:00 AM

MEEPLEGO-PREVIEW: 3 users
  Recent signups:
  - 10/11/2025, 3:20:00 PM
  - 10/11/2025, 12:45:00 PM
  - 10/11/2025, 9:30:00 AM

📈 Total users with invite codes: 8

🎯 Success Criteria Check:

Target: 10-20 initial users
Current: 8 users
⚠️  Need 2 more users to reach minimum

✨ Done!
```

## Manual Database Queries

If you prefer SQL queries, here are some useful ones:

### View all invite codes
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

### Check which users used specific code
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

### Deactivate an invite code
```sql
UPDATE public.invite_codes
SET current_uses = max_uses
WHERE code = 'CODE-TO-DISABLE';
```

## Tips

### Creating Bulk Codes
To create multiple codes at once, you can modify the generate script or use SQL directly:

```sql
INSERT INTO public.invite_codes (code, max_uses, notes)
VALUES 
  ('INFLUENCER-01', 5, 'Influencer campaign batch 1'),
  ('INFLUENCER-02', 5, 'Influencer campaign batch 2'),
  ('INFLUENCER-03', 5, 'Influencer campaign batch 3');
```

### Tracking Acquisition Channels
Use different invite codes for different channels:
- `TWITTER-2025` - Twitter promotion
- `DISCORD-BETA` - Discord community
- `EMAIL-LAUNCH` - Email newsletter
- `REDDIT-GAMES` - Reddit post

Then use the check script to see which channels are most successful.

### Extending Code Limits
To give a code more uses:

```sql
UPDATE public.invite_codes
SET max_uses = max_uses + 10
WHERE code = 'BETA2025';
```

## Monitoring Success Criteria

Per the launch checklist, track:
- ✅ 10–20 initial users (use `npm run invite:check`)
- ⏳ ≥80% first-try auth callback success (check analytics)
- ⏳ ≥2 saved lists per user (check user activity)
- ⏳ <1% error rate on pages (check error tracking)

## Transitioning to Public

When ready to open signup:

**Option 1:** Remove code requirement
```bash
# Update signup page to make invite code optional
# Keep table for historical tracking
```

**Option 2:** Create unlimited code
```sql
INSERT INTO public.invite_codes (code, max_uses, notes)
VALUES ('PUBLIC', 999999, 'Public access after beta');
```

**Option 3:** Display code on signup page
```tsx
// In signup page:
<p>Use code: <strong>PUBLIC</strong></p>
```

## See Also

- [Invite Code System Documentation](./invite-code-system.md)
- [UI Changes Documentation](./ui-changes-private-beta.md)
- [Launch Checklist](../release/launch-checklist.md)
