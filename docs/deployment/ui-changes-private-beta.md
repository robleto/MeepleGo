# UI Changes for Private Beta Access Control

This document describes the user interface changes implemented for the invite code system and feedback mechanism.

## Signup Page Changes

### Before
- Standard email and password signup form
- No mention of private beta or invite codes
- Open to all users

### After
The signup page now includes:

1. **Beta Notice Banner**
   - Light blue background with border
   - Message: "🎲 MeepleGo is currently in private beta. You'll need an invite code to sign up."
   - Located at the top of the form

2. **Invite Code Input Field**
   - New required field above email input
   - Label: "INVITE CODE"
   - Placeholder: "BETA2025"
   - Automatically converts input to uppercase
   - Helper text: "Enter your invite code to access the private beta"

3. **Enhanced Submit Button**
   - Shows "Validating code…" while checking the invite code
   - Shows "Creating…" during account creation
   - Disabled during both validation and creation

4. **Error Handling**
   - Displays invite code validation errors before attempting signup
   - Examples:
     - "Invalid invite code"
     - "This invite code has expired"
     - "This invite code has reached its usage limit"

## Navigation Changes

### User Dropdown Menu

For logged-in users, the user dropdown menu (accessed by clicking profile avatar/name) now includes:

**New "Send Feedback" Link**
- Icon: Blue chat bubble (ChatBubbleLeftIcon)
- Text: "Send Feedback"
- Location: Below "Settings", above theme selector
- Action: Opens default email client to `feedback@meeplego.com` with subject "MeepleGo Feedback"

### Menu Order
1. Profile
2. Rankings
3. Library
4. Wishlist
5. Settings
6. **Send Feedback** ← NEW
7. Theme selector
8. Sign out

## Footer Changes

### Resources Section

The footer's "Resources" section now includes:

**New "Send Feedback" Link**
- Color: Blue text (text-blue-600 dark:text-blue-400) to stand out
- Location: Last item in Resources section
- Action: Opens default email client to `feedback@meeplego.com` with subject "MeepleGo Feedback"

### Resources Menu Order
1. Data & Privacy
2. Privacy Policy
3. Terms of Service
4. Import
5. **Send Feedback** ← NEW

## User Flow Example

### New User Signup Flow
1. User visits `/signup`
2. Sees beta notice banner
3. Must enter invite code (e.g., "BETA2025")
4. Enters email and password
5. Clicks "Sign up"
6. System validates invite code:
   - ✅ Valid: Proceeds with signup
   - ❌ Invalid: Shows error, allows correction
7. On successful signup:
   - Increments invite code usage counter
   - Stores invite code in user metadata
   - Sends confirmation email

### Sending Feedback Flow (Logged-in Users)
1. User clicks profile avatar in navigation
2. Clicks "Send Feedback" from dropdown menu
   - OR scrolls to footer
   - Clicks "Send Feedback" in Resources section
3. Default email client opens with:
   - To: feedback@meeplego.com
   - Subject: MeepleGo Feedback
4. User writes feedback and sends

## Design Decisions

### Why Uppercase Invite Codes?
- Codes automatically convert to uppercase for consistency
- Easier to share verbally ("BETA 2025" vs "beta2025")
- Reduces user errors from mixed case

### Why Mailto Link Instead of Form?
- Simpler implementation for private beta
- Allows users to include screenshots easily
- Creates email thread for follow-up discussion
- No additional backend/database needed
- Can be upgraded to a form later if needed

### Why Two Feedback Link Locations?
1. **Navigation**: Quick access for active users during session
2. **Footer**: Always visible, traditional location for feedback/contact

### Color Coding
- **Blue** for feedback links: Friendly, approachable, indicates communication
- **Blue banner** for beta notice: Informational, non-alarming
- Consistent with primary color scheme

## Accessibility

All changes maintain accessibility standards:
- Proper form labels and ARIA attributes
- Keyboard navigation support
- High contrast color combinations
- Screen reader friendly
- Semantic HTML structure

## Mobile Considerations

The changes are fully responsive:
- Invite code input field stacks naturally in mobile view
- Beta notice banner wraps text appropriately
- Navigation dropdown menu maintains touch-friendly hit targets
- Footer links remain easily tappable

## Future Enhancements

Potential improvements for public launch:
1. Replace mailto with in-app feedback form
2. Add feedback categorization (bug report, feature request, etc.)
3. Include automatic context (browser, OS, current page)
4. Add optional screenshot attachment
5. Provide feedback submission confirmation
6. Create feedback tracking dashboard for admins
