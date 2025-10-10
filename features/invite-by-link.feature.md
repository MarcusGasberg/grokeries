# Feature: Invite Contributors by Link and Password

## Prerequisites
1. User has at least one grocery list they own or have admin permissions for
2. User is authenticated
3. List exists and is accessible to the user

## Purpose
As a list owner, I want to share my grocery list via a shareable link protected by a password, so that I can quickly onboard contributors without needing their email addresses upfront. This complements the existing email-based invitation system.

## Technical Approach
- **Link generation**: Create unique shareable links with format `/invite/link/{inviteCode}`
- **Password security**: Hash passwords using bcrypt (NEVER store plaintext)
- **Database schema**: Extend existing `groceryListInvitations` table with new fields:
  - `inviteCode` (text, unique, nullable) - Only for link invites
  - `passwordHash` (text, nullable) - bcrypt hash for link invites
  - `inviteType` (pgEnum: 'email' | 'link') - Differentiate invite types
  - `maxUses` (integer, nullable) - null = unlimited, number = limited uses
  - `usedCount` (integer, default 0) - Track redemption count
  - `revokedAt` (timestamp, nullable) - Soft delete timestamp
  - `revokedBy` (text, nullable, FK to user.id) - Who revoked it
- **Zero sync**: Real-time updates when invitations are created/used/revoked
- **Validation**: Server-side password verification in `/api/invitations/link/redeem` endpoint
- **Existing integration**: Works alongside current email invitation system (`invite-dialog.tsx`)
- **Brutalist styling**: Match existing app vibes with uppercase text, bold borders, and shadow effects

## Use Cases

### 1. Create Invite Link
**As a list owner**, when I want to share my list with others, I should be able to generate a shareable link with a password.

**Behavior:**
- Click "INVITE COLLABORATOR" in UserMenu (existing trigger) opens InviteDialog
- InviteDialog updated with tab interface: "EMAIL INVITE" | "LINK INVITE"
- Link invite tab shows form with brutalist styling:
  - "PASSWORD" field (required, min 4 characters, uppercase placeholder)
  - "CONFIRM PASSWORD" field (must match)
  - "EXPIRES" dropdown: "1 HOUR" | "24 HOURS" | "7 DAYS" | "30 DAYS" | "NEVER" (default: 7 days)
  - "MAX USES" dropdown: "UNLIMITED" | "1" | "5" | "10" | "25" (default: UNLIMITED)
- "GENERATE LINK" button creates invite and shows success state:
  - Display invite URL in copyable input field with border-4 styling
  - Display password separately in another copyable field
  - "COPY LINK" and "COPY PASSWORD" buttons with accent styling
  - Show warning: "⚠️ SHARE PASSWORD SEPARATELY FOR SECURITY"

**Acceptance Criteria:**
- [ ] Tab interface added to existing InviteDialog component
- [ ] Form validation prevents mismatched passwords
- [ ] Form validation enforces min 4 char password
- [ ] Invite link generates with unique 16-char base64url code
- [ ] Password hashed with bcrypt (cost factor 10) - NEVER plaintext
- [ ] Copy to clipboard functionality for both link and password
- [ ] Link format: `{APP_URL}/invite/link/{inviteCode}`
- [ ] Expiration and max uses stored in database
- [ ] Brutalist styling matches existing dialog design
- [ ] Success state shows generated link immediately

### 2. View Active Invite Links
**As a list owner**, I should see all active invite links for my list and their status.

**Behavior:**
- New "MANAGE INVITES" section in InviteDialog or separate page
- Shows both email and link invitations in separate sections
- Link invites display in card layout with border-4 styling:
  - "INVITE CODE: ...{last6chars}" (truncated for security)
  - Created timestamp: "CREATED 3 DAYS AGO"
  - Expiration: "EXPIRES IN 4 DAYS" or "EXPIRED" badge
  - Usage: "USED 3/5 TIMES" or "USED 7 TIMES (UNLIMITED)"
  - Status badge: "ACTIVE" (green) | "EXPIRED" (orange) | "MAXED OUT" (red) | "REVOKED" (gray)
- Quick action buttons per invite:
  - "COPY LINK" button
  - "REVOKE" button (destructive styling)
- Real-time updates via Zero query on `groceryListInvitations`
- Filter tabs: "ALL" | "ACTIVE" | "EXPIRED" | "REVOKED"

**Acceptance Criteria:**
- [ ] Query all link invitations via Zero for current list
- [ ] Real-time updates when invites used/revoked
- [ ] Status badges with appropriate colors
- [ ] Copy link functionality per invite
- [ ] Revoke action with confirmation dialog
- [ ] Show who redeemed (track in separate `inviteRedemptions` table)
- [ ] Filter/sort by status and creation date
- [ ] Brutalist card styling with shadows

### 3. Redeem Invite Link
**As a new user**, when I receive an invite link, I should be able to join the list by entering the password.

**Behavior:**
- Visiting `/invite/link/{inviteCode}` shows redemption page (new route)
- Page layout with brutalist styling:
  - Large border-4 card with shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]
  - Header: "GROCERY INVITATION" (uppercase, font-black)
  - Shows list preview (fetched server-side):
    - "LIST: {LIST_NAME}" (uppercase)
    - "OWNER: {OWNER_NAME}" (uppercase)
    - "MEMBERS: {COUNT}" (uppercase)
  - Password input field (border-4, uppercase placeholder: "ENTER PASSWORD...")
  - "JOIN LIST" button (accent color, shadow effect)
- Auth flow:
  - If not authenticated: Show "SIGN IN TO JOIN" and "CREATE ACCOUNT" buttons above password input
  - After auth, user returns to same page and can submit password
- On submit:
  - POST to `/api/invitations/link/redeem` with { inviteCode, password }
  - Server validates password hash, checks expiration, max uses, membership
  - On success: Increment `usedCount`, add to `groceryListMembers`, redirect to `/groceries?listId={id}`
  - On failure: Show inline error with specific reason (brutalist error styling)
- Error states (all uppercase, border-4, red accent):
  - "INVALID PASSWORD"
  - "INVITATION EXPIRED"
  - "MAXIMUM USES REACHED"
  - "ALREADY A MEMBER"
  - "INVITATION REVOKED"

**Acceptance Criteria:**
- [ ] New route at `/invite/link/{inviteCode}` (use createFileRoute)
- [ ] Public invite preview endpoint (no auth required)
- [ ] Shows list name, owner, member count
- [ ] Password input with brutalist styling
- [ ] Auth check with redirect flow for unauthenticated users
- [ ] Server-side validation:
  - [ ] Invite exists and active (not revoked)
  - [ ] Password hash matches via bcrypt.compare
  - [ ] Not expired (check expiresAt timestamp)
  - [ ] Max uses not exceeded (usedCount < maxUses)
  - [ ] User not already a member
- [ ] Auto-increment `usedCount` on success
- [ ] Create record in `inviteRedemptions` table for audit
- [ ] Add user to `groceryListMembers` with role from invite
- [ ] Redirect to grocery list page with success toast
- [ ] Clear, specific error messages matching brutalist style

### 4. Revoke Invite Link
**As a list owner**, I should be able to disable an invite link at any time.

**Behavior:**
- "REVOKE" button on each invite in management view
- Click triggers confirmation dialog (brutalist styling):
  - Title: "REVOKE INVITE LINK?"
  - Message: "THIS LINK WILL NO LONGER BE USABLE. THIS CANNOT BE UNDONE."
  - Buttons: "REVOKE" (destructive) | "CANCEL" (outline)
- On confirm:
  - POST to `/api/invitations/revoke` with { inviteId }
  - Server sets `revokedAt = NOW()` and `revokedBy = currentUserId`
  - Zero sync updates UI immediately
- Revoked invites:
  - Show in list with "REVOKED" badge (gray, border-2)
  - Grayed out with opacity-60
  - Show "REVOKED {timeAgo} BY {userName}"
  - No copy/revoke actions available
- Redemption attempts on revoked links show error: "THIS INVITATION HAS BEEN REVOKED"

**Acceptance Criteria:**
- [ ] Revoke button with confirmation dialog
- [ ] Soft delete via `revokedAt` timestamp (never hard delete)
- [ ] Track who revoked via `revokedBy` FK
- [ ] Revoked invites clearly marked in UI
- [ ] Redemption endpoint rejects with clear error
- [ ] Real-time update via Zero when revoked
- [ ] Brutalist confirmation dialog styling

### 5. Security & Rate Limiting
**As the system**, I should prevent abuse of the invite link system.

**Behavior:**
- Rate limiting implemented at API level (using IP address):
  - Invite creation: 10 per list per hour
  - Redemption attempts: 5 attempts per IP per invite per 15 minutes
- Failed redemption tracking:
  - Log each failed password attempt to database
  - Count consecutive failures per invite
  - Auto-revoke invite after 20 consecutive failures
  - Send notification to list owner on auto-revoke
- Password validation:
  - Minimum 4 characters (configurable via env: MIN_INVITE_PASSWORD_LENGTH)
  - No maximum length (bcrypt handles truncation)
  - No special character requirements (reduce friction)
- Optional cleanup job:
  - Mark expired invites (where expiresAt < NOW() and status = 'pending')
  - Run daily via cron or on-demand

**Acceptance Criteria:**
- [ ] Rate limiting middleware for invite creation endpoint
- [ ] Rate limiting middleware for redemption endpoint (by IP + inviteCode)
- [ ] Failed attempt logging table: `inviteFailedAttempts`
- [ ] Auto-revoke after 20 consecutive failures
- [ ] Password strength validation (min 4 chars)
- [ ] Email notification to owner on suspicious activity (optional)
- [ ] Expired invite cleanup job (optional)

### 6. Mobile Share Integration
**As a mobile user**, I should easily share invite links via my device's share sheet.

**Behavior:**
- "SHARE" button in success state after generating link
- Click triggers Web Share API (if available):
  - Pre-formatted text:
    ```
    JOIN MY GROCERY LIST: {listName}

    LINK: {inviteUrl}

    PASSWORD: {password}

    ⚠️ KEEP PASSWORD SECURE
    ```
- Option to share link and password separately:
  - "SHARE LINK ONLY" button
  - "SHARE PASSWORD ONLY" button
- Desktop fallback:
  - Copy to clipboard with toast notification
  - "LINK COPIED" or "PASSWORD COPIED" message (brutalist toast)

**Acceptance Criteria:**
- [ ] Web Share API integration with feature detection
- [ ] Pre-formatted share message with line breaks
- [ ] Separate share buttons for link and password
- [ ] Works on iOS/Android share sheets
- [ ] Desktop fallback to clipboard copy
- [ ] Brutalist toast notifications
- [ ] Security warning included in share text

---

## Database Schema Changes

### Update `groceryListInvitations` table (src/schema.ts):

```typescript
export const invitationType = pgEnum("invitation_type", ["email", "link"]);

export const groceryListInvitations = pgTable("grocery_list_invitations", {
  // Existing fields
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => groceryList.id, { onDelete: "cascade" }),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: listRole("role").notNull().default("viewer"),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: invitationStatus("status").notNull().default("pending"),

  // Keep existing email fields (nullable for link invites)
  inviteeEmail: text("invitee_email"), // Make nullable
  token: text("token").unique(), // Make nullable

  // NEW: Add invite type discriminator
  inviteType: invitationType("invite_type").notNull().default("email"),

  // NEW: Link invite fields (nullable, only used when inviteType = 'link')
  inviteCode: text("invite_code").unique(), // URL-safe random string
  passwordHash: text("password_hash"), // bcrypt hash
  maxUses: integer("max_uses"), // null = unlimited
  usedCount: integer("used_count").notNull().default(0),

  // NEW: Soft delete fields
  revokedAt: timestamp("revoked_at"),
  revokedBy: text("revoked_by").references(() => user.id),
});
```

### NEW: Create `inviteRedemptions` table for audit trail:

```typescript
export const inviteRedemptions = pgTable("invite_redemptions", {
  id: text("id").primaryKey(),
  inviteId: text("invite_id")
    .notNull()
    .references(() => groceryListInvitations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  ipAddress: text("ip_address"), // For security/rate limiting
});

export const inviteRedemptionsRelations = relations(
  inviteRedemptions,
  ({ one }) => ({
    invite: one(groceryListInvitations, {
      fields: [inviteRedemptions.inviteId],
      references: [groceryListInvitations.id],
    }),
    user: one(user, {
      fields: [inviteRedemptions.userId],
      references: [user.id],
    }),
  }),
);
```

### NEW: Optional `inviteFailedAttempts` table for security:

```typescript
export const inviteFailedAttempts = pgTable("invite_failed_attempts", {
  id: text("id").primaryKey(),
  inviteId: text("invite_id")
    .notNull()
    .references(() => groceryListInvitations.id, { onDelete: "cascade" }),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
});
```

## API Endpoints

### POST `/api/invitations/link/create`
**Purpose**: Create a new link-based invitation with password

**Request:**
```typescript
{
  listId: string;
  password: string;
  expiresAt?: Date; // Optional, defaults to 7 days from now
  maxUses?: number; // Optional, null = unlimited
}
```

**Response:**
```typescript
{
  success: true;
  inviteCode: string;
  inviteUrl: string; // Full URL: {APP_URL}/invite/link/{inviteCode}
  expiresAt: Date;
  maxUses: number | null;
}
```

**Auth**: Required (list owner/editor only)

**Validation:**
- User is member of list
- Password min 4 chars
- expiresAt is future date
- maxUses is positive integer or null

---

### GET `/api/invitations/link/preview/{inviteCode}`
**Purpose**: Get public info about an invite (before password entry)

**Response:**
```typescript
{
  listId: string;
  listName: string;
  ownerName: string;
  memberCount: number;
  expiresAt: Date;
  maxUses: number | null;
  usedCount: number;
  isValid: boolean; // false if expired, revoked, or maxed out
  invalidReason?: string; // "expired" | "revoked" | "max_uses_reached"
}
```

**Auth**: Not required (public endpoint)

**Validation:**
- Invite exists
- Do not expose passwordHash or sensitive data

---

### POST `/api/invitations/link/redeem`
**Purpose**: Redeem an invite link with password

**Request:**
```typescript
{
  inviteCode: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: true;
  listId: string;
  listName: string;
}
```

**Error Response:**
```typescript
{
  error: string; // "invalid_password" | "expired" | "max_uses" | "already_member" | "revoked"
}
```

**Auth**: Required (authenticated user)

**Rate Limiting**: 5 attempts per IP per invite per 15 minutes

**Validation (in order):**
1. Invite exists
2. Invite not revoked (revokedAt is null)
3. Invite not expired (expiresAt > now)
4. Max uses not exceeded (usedCount < maxUses || maxUses is null)
5. Password hash matches (bcrypt.compare)
6. User not already a member
7. Increment usedCount
8. Create inviteRedemption record
9. Add user to groceryListMembers

---

### POST `/api/invitations/revoke`
**Purpose**: Revoke an invitation (works for both email and link invites)

**Request:**
```typescript
{
  inviteId: string;
}
```

**Response:**
```typescript
{
  success: true;
  revokedAt: Date;
}
```

**Auth**: Required (list owner/editor only)

**Validation:**
- User is member of list
- Invite exists
- Invite not already revoked

---

## Open Questions & Design Decisions

### Password Strength Requirements
**Q:** How strong should invite passwords be?
**Decision:**
- Minimum 4 characters (balance between security and shareability)
- No special character requirements (reduce friction)
- Allow numeric-only PINs for voice sharing
- Show strength indicator but don't enforce (optional: weak/medium/strong)
- Recommend strong passwords but prioritize usability

### Invite Code Format
**Q:** What format should invite codes use?
**Decision:**
- 16-char URL-safe base64 string (crypto.randomBytes(12).toString('base64url'))
- Example: `aB3dE5fG8hJ9kL2m`
- Pros: Cryptographically secure, URL-safe, reasonably short
- Cons: Not human-readable (but users will copy/paste anyway)

### Password Sharing UX
**Q:** Should password be displayed with the link or separately?
**Decision:**
- Show both together by default for convenience
- Provide separate copy buttons for link and password
- Show warning: "⚠️ SHARE PASSWORD SEPARATELY FOR SECURITY"
- Offer "SHARE LINK ONLY" option for advanced users
- Most users will share via single message (convenience > security for grocery lists)

### Multi-Use Tracking
**Q:** Should we show who redeemed each invite?
**Decision:**
- Yes - track in `inviteRedemptions` table
- Show in management UI: "USED BY: Alice, Bob, Charlie (3 of 5)"
- Only visible to list owners/editors
- Privacy: Don't expose to public preview endpoint

### Expired Invite Cleanup
**Q:** Should expired/revoked invites be auto-deleted?
**Decision:**
- Never hard delete (keep audit trail)
- Auto-hide from active list after 30 days
- Provide "SHOW EXPIRED" toggle in management view
- Optional cleanup job to mark status = 'expired' (but keep records)

### Concurrent Redemptions
**Q:** How to handle race conditions when maxUses is reached?
**Decision:**
- Use database transaction with row-level locking
- Check `usedCount < maxUses` and increment in single atomic operation
- If race condition occurs, return clear error: "MAXIMUM USES REACHED"
- Acceptable tradeoff: slightly over limit is better than complex locking

---

## Implementation Notes

### Password Hashing (bcryptjs)
```typescript
import bcrypt from 'bcryptjs';

// On invite creation
const passwordHash = await bcrypt.hash(password, 10); // Cost factor 10

// On redemption
const isValid = await bcrypt.compare(password, passwordHash);
```

**NEVER** store passwords in plaintext. **ALWAYS** hash with bcrypt.

---

### Invite Code Generation (crypto)
```typescript
import crypto from 'crypto';

const inviteCode = crypto.randomBytes(12).toString('base64url');
// Results in URL-safe 16-char string like: aB3dE5fG8hJ9kL2m
```

---

### Brutalist Styling Reference
Match existing app style from `invite-dialog.tsx`:
```typescript
// Dialog container
className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] max-w-md"

// Titles
className="text-2xl font-black font-sans uppercase tracking-tight text-foreground"

// Input fields
className="border-4 border-foreground bg-background text-foreground placeholder:text-muted-foreground font-bold font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] focus:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"

// Primary buttons
className="bg-accent text-accent-foreground border-4 border-accent-foreground hover:bg-accent-foreground hover:text-accent font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"

// Outline buttons
className="bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black font-sans uppercase text-sm shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] hover:shadow-[2px_2px_0px_0px_rgba(31,41,55,1)] transition-all"
```

---

### Zero Permissions Update
Update `src/zero/zero-schema.ts` to allow:
```typescript
export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  // ... existing permissions

  // Link invites: Public can read preview, authenticated can redeem
  groceryListInvitations: {
    row: {
      select: ["inviteCode", "listId", "expiresAt", "maxUses", "usedCount"],
      // DO NOT expose: passwordHash, token, inviteeEmail
    },
  },

  inviteRedemptions: {
    row: {
      select: (row) => row.userId === authData.userId, // Users can see their own
    },
  },
}));
```

**Note**: Currently set to `ANYONE_CAN_DO_ANYTHING` - lock down for production!

---

### Migration Checklist
1. [ ] Create migration: `npm run create-migration`
2. [ ] Add new enum: `invitationType`
3. [ ] Update `groceryListInvitations` table with new fields
4. [ ] Create `inviteRedemptions` table
5. [ ] Create `inviteFailedAttempts` table (optional)
6. [ ] Update relations in `src/schema.ts`
7. [ ] Run `npm run generate` to sync Zero schema
8. [ ] Deploy permissions via `zero-deploy-permissions`

---

## Testing Considerations

### Manual Test Cases
1. **Happy path**: Create link, share, redeem, verify membership
2. **Password mismatch**: Enter wrong password, verify clear error
3. **Expiration**: Create invite with 1-hour expiry, wait 61 minutes, try to redeem (or use shorter time for testing)
4. **Max uses**: Create invite with maxUses=1, redeem twice, verify second fails
5. **Revocation**: Create, revoke, try to redeem, verify error
6. **Concurrent**: Two users redeem same invite simultaneously (check usedCount)
7. **Already member**: Redeem invite for list you're already in
8. **Unauthenticated**: Visit link while logged out, verify auth flow
9. **Copy to clipboard**: Verify copy buttons work
10. **Mobile share**: Test on iOS/Android devices

### Security Test Cases
1. **Rate limiting**: Make 10 redemption attempts, verify blocked
2. **Password hashing**: Inspect database, verify no plaintext passwords
3. **Failed attempts**: Make 20 failed attempts, verify auto-revoke
4. **SQL injection**: Try malicious input in inviteCode/password
5. **XSS**: Try script tags in password field
6. **CSRF**: Attempt redemption without proper auth headers
