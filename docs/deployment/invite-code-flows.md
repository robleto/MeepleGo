# Private Beta User Flows

Visual representation of the invite code system and feedback flows.

## Signup Flow with Invite Code

```
┌─────────────────────────────────────────────────────────────┐
│                     User visits /signup                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Signup Page (with Beta Notice)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🎲 Private Beta - Invite Code Required               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Invite Code: [BETA2025________]  ← Required, uppercase    │
│  Email:       [user@email.com__]                            │
│  Password:    [••••••••••••••••]                            │
│                                                              │
│                [ Sign Up ]                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Client validates code via API POST                   │
│         /api/auth/validate-invite                            │
└────────────────┬─────────────────────┬──────────────────────┘
                 │                     │
         Valid ✅│                     │❌ Invalid
                 │                     │
                 ▼                     ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  Proceed with Signup     │  │  Show Error Message          │
│  - Create user account   │  │  - "Invalid invite code"     │
│  - Store invite code     │  │  - "Code expired"            │
│  - Increment usage       │  │  - "Usage limit reached"     │
│  - Send confirm email    │  │                              │
└────────────┬─────────────┘  └──────────────┬───────────────┘
             │                               │
             │                               └─► User can retry
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Success: "Check your email to confirm your account"        │
└─────────────────────────────────────────────────────────────┘
```

## Invite Code Validation Logic

```
┌─────────────────────────────────────────────────────────────┐
│         POST /api/auth/validate-invite                       │
│         Body: { code: "BETA2025" }                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Query invite_codes table     │
         │  WHERE code = 'BETA2025'      │
         └───────────┬───────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    Found ✅                   Not Found ❌
        │                         │
        ▼                         ▼
┌───────────────────┐    ┌────────────────────────┐
│ Check Expiration  │    │ Return 404             │
│ expires_at < now? │    │ "Invalid invite code"  │
└────┬────────┬─────┘    └────────────────────────┘
     │        │
  Yes│❌    No│✅
     │        │
     ▼        ▼
┌─────────┐  ┌────────────────────┐
│ Expired │  │ Check Usage Limit  │
│ Error   │  │ current < max?     │
└─────────┘  └──────┬────────┬────┘
                    │        │
                 Yes│✅    No│❌
                    │        │
                    ▼        ▼
            ┌────────────┐  ┌────────────┐
            │ Return     │  │ Return     │
            │ valid:true │  │ Limit      │
            └────────────┘  │ Reached    │
                            └────────────┘
```

## Feedback Flow (Logged-in Users)

```
┌─────────────────────────────────────────────────────────────┐
│                    Logged-in User                            │
└────────────┬──────────────────────────┬──────────────────────┘
             │                          │
  Click Profile Avatar          Scroll to Footer
             │                          │
             ▼                          ▼
┌─────────────────────────┐  ┌─────────────────────────────┐
│   User Dropdown Menu    │  │    Footer Resources         │
│   ┌─────────────────┐   │  │    ┌─────────────────────┐  │
│   │ Profile         │   │  │    │ Data & Privacy      │  │
│   │ Rankings        │   │  │    │ Privacy Policy      │  │
│   │ Library         │   │  │    │ Terms of Service    │  │
│   │ Wishlist        │   │  │    │ Import              │  │
│   │ Settings        │   │  │    │ 🗨 Send Feedback   │◄─┼─┐
│   │ 🗨 Send Feedback│◄──┼─┐│    └─────────────────────┘  │ │
│   └─────────────────┘   │ │└─────────────────────────────┘ │
└─────────────────────────┘ │                                │
                            │                                │
                            └────────────┬───────────────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────┐
                    │  Opens Default Email Client        │
                    │  ┌──────────────────────────────┐  │
                    │  │ To: feedback@meeplego.com    │  │
                    │  │ Subject: MeepleGo Feedback   │  │
                    │  │ Body: [User writes feedback] │  │
                    │  └──────────────────────────────┘  │
                    └────────────────────────────────────┘
```

## Admin Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Administrator                         │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
   Generate New Code                Check Usage
           │                              │
           ▼                              ▼
┌────────────────────────┐    ┌─────────────────────────────┐
│ npm run invite:generate│    │ npm run invite:check        │
└──────────┬─────────────┘    └──────────┬──────────────────┘
           │                              │
           ▼                              ▼
┌────────────────────────┐    ┌─────────────────────────────┐
│ Interactive Prompts:   │    │ Display Statistics:         │
│ - Code name            │    │ - All codes with status     │
│ - Max uses             │    │ - Usage percentages         │
│ - Expiration date      │    │ - Recent signups            │
│ - Notes                │    │ - Success criteria check    │
└──────────┬─────────────┘    └─────────────────────────────┘
           │
           ▼
┌────────────────────────┐
│ Confirm and Create     │
│ INSERT into DB         │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│ ✅ Code Created: "Share this code with users: FRIEND-2025" │
└────────────────────────────────────────────────────────────┘
```

## Database Schema Flow

```
┌─────────────────────────┐
│     invite_codes        │
├─────────────────────────┤
│ id (uuid, PK)           │
│ code (text, unique)     │
│ max_uses (integer)      │
│ current_uses (integer)  │◄───── Incremented on signup
│ created_by (uuid, FK)   │
│ created_at (timestamp)  │
│ expires_at (timestamp)  │◄───── Checked during validation
│ notes (text)            │
└────────┬────────────────┘
         │
         │ Referenced by
         │
         ▼
┌─────────────────────────┐
│       profiles          │
├─────────────────────────┤
│ id (uuid, PK)           │
│ username (text)         │
│ email (text)            │
│ invite_code_used (text) │◄───── Stored on signup
│ created_at (timestamp)  │
│ ...                     │
└─────────────────────────┘
```

## Success Criteria Monitoring

```
┌────────────────────────────────────────────────────────────┐
│                   Launch Checklist                          │
└──────────┬─────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  Target: 10-20 Initial Users                             │
│  ├─ Monitor: npm run invite:check                        │
│  └─ Query: SELECT COUNT(*) FROM profiles                 │
│           WHERE invite_code_used IS NOT NULL             │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  Target: ≥80% Auth Callback Success                      │
│  └─ Monitor: Analytics event tracking                    │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  Target: ≥2 Saved Lists per User                         │
│  └─ Query: SELECT user_id, COUNT(*) FROM game_lists     │
│            GROUP BY user_id                              │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  Target: <1% Error Rate                                  │
│  └─ Monitor: Sentry error tracking dashboard            │
└──────────────────────────────────────────────────────────┘
```

## State Machine: Invite Code Lifecycle

```
        ┌─────────────┐
        │   CREATED   │
        └──────┬──────┘
               │
               │ npm run invite:generate
               ▼
        ┌─────────────┐
   ┌───►│   ACTIVE    │◄───┐
   │    └──────┬──────┘    │
   │           │            │
   │  User signup uses code │
   │           │            │
   │           ▼            │
   │    current_uses++      │
   │           │            │
   │    ┌──────┴──────┐    │
   │    │ Still have  │    │
   │    │ remaining?  │    │
   │    └──────┬──────┘    │
   │           │            │
   │      Yes  │      No    │
   └───────────┘            │
                            ▼
                     ┌─────────────┐
                     │  EXHAUSTED  │
                     └──────┬──────┘
                            │
                            │
                     ┌──────┴──────┐
                     │             │
              Expires?          Manual
                     │          Deactivate
                     │             │
                     ▼             ▼
              ┌─────────────┐ ┌──────────┐
              │   EXPIRED   │ │ DISABLED │
              └─────────────┘ └──────────┘
```

---

These diagrams illustrate the complete flow of the invite code system from user signup to administrative management and monitoring.
