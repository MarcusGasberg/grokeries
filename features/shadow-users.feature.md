# Feature: Shadow Users (Trial/Demo Mode)

## Prerequisites
None - Shadow users should be able to access the app without any authentication

## Purpose
Allow potential users to try the grocery app without creating an account, while providing a smooth upgrade path to convert their trial data into a full account when they decide to sign up.

## Current State Analysis

### Existing Auth Assumptions Found:
1. **src/routes/_layout/groceries/index.tsx:48-56** - `beforeLoad` requires authentication with redirect to `/login`
2. **src/components/session-init.tsx:19-28** - Session data expects cookies (`userid`, `email`, `name`, `jwt`)
3. **src/components/zero-init.tsx:21** - Falls back to `"anon"` when no userID present ✓
4. **src/zero/mutators.ts:13-14** - All mutators check `if (!authData)` and throw error
5. **src/routes/index.tsx:88** - "TRY DEMO" button links to `/groceries` but will redirect to login
6. **User menu** - Shows logout, settings, invite options that don't make sense for shadow users

## Technical Approach

### Shadow User Identification
- **Browser fingerprint** - Use device fingerprint (via fingerprintjs2 or similar)
- **LocalStorage key** - Store `shadowUserId` in localStorage for persistence
- **Format**: `shadow_{fingerprint}_{timestamp}` (e.g., `shadow_abc123def456_1234567890`)
- **Upgrade tracking**: Store shadow user ID in database on signup to migrate data

### Session Management
- **Cookie strategy**: Set special cookie `shadow_user=true` + `shadow_id={id}`
- **Zero auth**: Use shadow ID as userID for Zero sync
- **JWT**: Generate lightweight "shadow JWT" for Zero authentication (no real auth verification)

### Database Changes
- Add `isShadow` boolean field to `user` table
- Add `shadowUserId` text field to `user` table (for linking on upgrade)
- Shadow users are "soft" users - minimal data, marked as trial

## Use Cases

### 1. Access Demo Mode
**As a visitor**, when I click "TRY DEMO" on the landing page, I should be able to use the app without creating an account.

**Behavior:**
- Click "TRY DEMO" button on homepage
- Generate shadow user ID (fingerprint + timestamp)
- Store in localStorage: `shadowUserId`
- Set cookies: `shadow_user=true`, `shadow_id={id}`, `shadow_jwt={token}`
- Create minimal shadow user record in database
- Auto-generate shadow username: "Guest Shopper {3-char-hash}" (e.g., "Guest Shopper A3F")
- Create default grocery list: "My Trial List"
- Navigate to `/groceries` (no redirect to login)
- Show banner: "YOU'RE IN TRIAL MODE - SIGN UP TO SAVE YOUR PROGRESS" (dismissable)

**Acceptance Criteria:**
- [ ] Remove auth redirect from `/groceries` route for shadow users
- [ ] Generate stable device fingerprint for shadow ID
- [ ] Store shadow ID in localStorage
- [ ] Create shadow user in database with minimal data
- [ ] Generate shadow JWT for Zero authentication
- [ ] Create default list automatically
- [ ] Show trial mode banner with brutalist styling
- [ ] "TRY DEMO" button navigates to `/groceries` successfully

### 2. Feature Restrictions for Shadow Users
**As a shadow user**, I should have limited access to collaborative features to encourage signup.

**Restricted Features:**
- ❌ **Invite collaborators** - Disabled, shows "SIGN UP TO INVITE" tooltip
- ❌ **Accept invitations** - Cannot receive email invites (no email!)
- ❌ **Create multiple lists** - Limited to 1 default list
- ❌ **Delete default list** - Cannot delete trial list
- ❌ **Share list via link** - Feature locked
- ❌ **View collaborators** - No collaborators in trial mode
- ❌ **Logout** - Replace with "SIGN UP" button in menu

**Allowed Features:**
- ✅ **Add/edit/delete groceries** - Full CRUD on items (up to limit)
- ✅ **Shopping mode** - Can use shopping trip feature
- ✅ **Category management** - Can categorize items
- ✅ **Complete items** - Can check off items
- ✅ **Clear completed** - Can clear list

**Item Limits:**
- Max 25 grocery items in trial mode
- Show counter: "15/25 ITEMS (SIGN UP FOR UNLIMITED)"

**Acceptance Criteria:**
- [ ] Modify `user-menu.tsx` to hide/disable restricted actions
- [ ] Replace "LOGOUT" with "SIGN UP TO SAVE" button
- [ ] Add item limit validation (25 items max)
- [ ] Show upgrade prompts with brutalist styling
- [ ] Disable "INVITE USER" button with tooltip
- [ ] Disable "CREATE LIST" button
- [ ] Hide "COLLABORATORS" menu item
- [ ] Gray out "SHARE LIST" with "SIGN UP REQUIRED" text

### 3. Trial Mode UI Indicators
**As a shadow user**, I should see clear indicators that I'm in trial mode and how to upgrade.

**UI Changes:**
- **Header**: Replace user name with "GUEST SHOPPER {hash}"
- **Banner**: Sticky banner at top: "⚠️ TRIAL MODE - SIGN UP TO SAVE YOUR PROGRESS"
- **Item counter**: "15/25 ITEMS - SIGN UP FOR UNLIMITED" (bottom of form card)
- **Menu badge**: "TRIAL" badge on user menu button
- **Limited features**: Show lock icon 🔒 on disabled menu items

**Acceptance Criteria:**
- [ ] Update header to show shadow username
- [ ] Add dismissable trial mode banner (brutalist styling)
- [ ] Add item counter with upgrade prompt
- [ ] Add "TRIAL" badge to user menu
- [ ] Add lock icons to restricted menu items
- [ ] Use muted colors for disabled features

### 4. Upgrade to Full Account
**As a shadow user**, when I sign up, my trial data should be preserved and migrated to my new account.

**Behavior:**
- Click "SIGN UP TO SAVE" in menu or banner
- Navigate to `/register?shadow={shadowUserId}` (pass shadow ID in URL)
- Registration form pre-filled with shadow username (editable)
- On successful signup:
  - Link shadow user ID to new user account
  - Migrate grocery list to new user
  - Migrate all grocery items
  - Remove shadow cookies
  - Set real auth cookies
  - Redirect to `/groceries`
  - Show success toast: "YOUR TRIAL DATA HAS BEEN SAVED!"

**Database Migration:**
```typescript
// On signup with shadow ID:
1. Create real user account
2. Update user.shadowUserId = {shadowId}
3. Update groceryListMembers: change userId from shadow to real
4. Update groceries: change authorId from shadow to real
5. Soft-delete shadow user record (keep for audit)
```

**Acceptance Criteria:**
- [ ] Add `shadowUserId` query param to register URL
- [ ] Modify registration flow to detect shadow upgrade
- [ ] Create migration function to transfer ownership
- [ ] Update all related tables (lists, items, members)
- [ ] Remove shadow cookies after migration
- [ ] Show success message on upgrade
- [ ] Log migration for analytics

### 5. Shadow User Expiration
**As the system**, shadow user data should expire after inactivity to prevent database bloat.

**Behavior:**
- Shadow users expire after 30 days of inactivity
- Track `lastActivityAt` timestamp on shadow users
- Daily cleanup job soft-deletes expired shadow users
- Expired shadow users see: "YOUR TRIAL EXPIRED - START A NEW TRIAL"

**Acceptance Criteria:**
- [ ] Add `lastActivityAt` timestamp to user table
- [ ] Update timestamp on any shadow user activity
- [ ] Create cleanup job (cron or scheduled Lambda)
- [ ] Soft-delete expired shadow users
- [ ] Handle expired session gracefully (restart trial)

### 6. Shadow User Re-identification
**As a returning shadow user**, if I return to the site, I should see my previous trial data (within expiration window).

**Behavior:**
- User returns to site (same device/browser)
- Check localStorage for `shadowUserId`
- Verify shadow user still exists and not expired
- If valid: Restore session with existing shadow user ID
- If expired: Create new shadow user (fresh trial)

**Acceptance Criteria:**
- [ ] Check localStorage on app init
- [ ] Verify shadow user exists in database
- [ ] Check expiration timestamp
- [ ] Restore session if valid
- [ ] Create new trial if expired
- [ ] Handle multiple devices gracefully (separate trials per device)

---

## Database Schema Changes

### Update `user` table:
```typescript
export const user = pgTable("user", {
  // ... existing fields
  isShadow: boolean("is_shadow").default(false).notNull(),
  shadowUserId: text("shadow_user_id"), // Original shadow ID for tracking upgrades
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
});
```

### Add index for shadow user queries:
```sql
CREATE INDEX idx_shadow_users ON user(is_shadow, last_activity_at);
```

---

## Implementation Roadmap

### Phase 1: Basic Shadow User Support
1. Create shadow user generation logic
2. Modify auth checks to allow shadow users
3. Create shadow JWT system
4. Update Zero mutators to accept shadow users
5. Add trial mode banner

### Phase 2: Feature Restrictions
1. Update user menu for shadow users
2. Implement item limits
3. Add upgrade prompts throughout UI
4. Hide/disable collaborative features

### Phase 3: Upgrade Path
1. Build shadow-to-real migration logic
2. Update registration flow
3. Test data migration thoroughly
4. Add success messaging

### Phase 4: Maintenance
1. Implement expiration cleanup job
2. Add analytics tracking
3. Monitor trial-to-signup conversion rate

---

## Code Changes Required

### 1. Create shadow user utilities (`src/lib/shadow-user.ts`)
```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { nanoid } from 'nanoid';

export async function generateShadowUserId(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const hash = result.visitorId.slice(0, 8);
  const timestamp = Date.now();
  return `shadow_${hash}_${timestamp}`;
}

export function generateShadowUsername(shadowId: string): string {
  const hash = shadowId.split('_')[1].slice(0, 3).toUpperCase();
  return `Guest Shopper ${hash}`;
}

export function isShadowUser(userId: string | undefined): boolean {
  return userId?.startsWith('shadow_') ?? false;
}
```

### 2. Update mutators (`src/zero/mutators.ts`)
```typescript
export function createMutators(authData: AuthData | undefined) {
  return {
    groceryList: {
      addInitial: async (tx, { name, id }: { name: string; id: string }) => {
        // REMOVE: if (!authData) throw new Error("Not authenticated");

        // NEW: Allow shadow users
        const userId = authData?.sub ?? 'anon';

        const existingLists = await tx.query.groceryListMembers
          .where("userId", "=", userId)
          .one();

        if (existingLists) {
          return;
        }

        // ... rest of logic
      },
      // ... similar updates for other mutators
    },
  };
}
```

### 3. Update session init (`src/components/session-init.tsx`)
```typescript
export function SessionInit({ children }: { children: React.ReactNode }) {
  const [cookies] = useCookies(['userid', 'email', 'name', 'jwt', 'shadow_user', 'shadow_id']);

  const data = useMemo(() => {
    // Check for shadow user
    if (cookies.shadow_user === 'true' && cookies.shadow_id) {
      return {
        userID: cookies.shadow_id,
        email: 'shadow@trial.local', // Placeholder email
        name: generateShadowUsername(cookies.shadow_id),
        isShadow: true,
      };
    }

    // Check for real user
    if (!cookies.userid || !cookies.name || !cookies.email) {
      return undefined;
    }

    return {
      userID: cookies.userid,
      email: cookies.email,
      name: cookies.name,
      isShadow: false,
    };
  }, [cookies]);

  // ... rest of component
}
```

### 4. Update groceries route (`src/routes/_layout/groceries/index.tsx`)
```typescript
export const Route = createFileRoute("/_layout/groceries/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return groceriesSearchSchema.parse(search);
  },
  beforeLoad: async () => {
    const { data: session, error } = await authClient.getSession();

    // Allow shadow users through
    const cookies = new Cookies();
    const isShadowUser = cookies.get('shadow_user') === 'true';

    if (!session?.session && !isShadowUser) {
      throw redirect({
        to: "/login",
        search: { redirect: "/groceries" },
      });
    }
  },
});
```

### 5. Create trial mode banner (`src/components/trial-banner.tsx`)
```typescript
export function TrialBanner({ isShadow }: { isShadow: boolean }) {
  const [dismissed, setDismissed] = useState(false);

  if (!isShadow || dismissed) return null;

  return (
    <div className="bg-orange-500 text-white p-3 border-4 border-orange-600 shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] mb-4">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-black font-sans uppercase text-sm">TRIAL MODE</p>
            <p className="text-xs font-bold">SIGN UP TO SAVE YOUR PROGRESS</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => window.location.href = '/register?shadow=' + localStorage.getItem('shadowUserId')}
            className="bg-white text-orange-600 font-black uppercase text-xs"
          >
            SIGN UP NOW
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-white"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 6. Update user menu (`src/components/user-menu.tsx`)
```typescript
interface UserMenuProps {
  onInviteClick: () => void;
  onCreateListClick: () => void;
  onDeleteList?: () => void;
  currentListId?: string;
  isShadow?: boolean; // NEW
}

export function UserMenu({
  onInviteClick,
  onCreateListClick,
  onDeleteList,
  currentListId,
  isShadow = false // NEW
}: UserMenuProps) {
  // ... existing code

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative ..."
        >
          <MoreVertical className="w-4 h-4" />
          {isShadow && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-black px-1 border border-orange-600">
              TRIAL
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* CREATE LIST - Disabled for shadow users */}
        <DropdownMenuItem
          onClick={isShadow ? undefined : onCreateListClick}
          disabled={isShadow}
          className={isShadow ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isShadow && <span className="mr-2">🔒</span>}
          <Plus className="w-4 h-4" />
          CREATE LIST
        </DropdownMenuItem>

        {/* INVITE USER - Disabled for shadow users */}
        <DropdownMenuItem
          onClick={isShadow ? undefined : onInviteClick}
          disabled={isShadow}
          className={isShadow ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isShadow && <span className="mr-2">🔒</span>}
          <UserPlus className="w-4 h-4" />
          INVITE USER {isShadow && '(SIGN UP)'}
        </DropdownMenuItem>

        {/* Hide collaborators for shadow users */}
        {!isShadow && (
          <DropdownMenuItem onClick={handleViewCollaborators}>
            <Users className="w-4 h-4" />
            COLLABORATORS
          </DropdownMenuItem>
        )}

        {/* LOGOUT becomes SIGN UP for shadow users */}
        <DropdownMenuItem
          onClick={isShadow ? handleSignUp : handleLogout}
          className="..."
        >
          {isShadow ? (
            <>
              <Star className="w-4 h-4" />
              SIGN UP TO SAVE
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              LOGOUT
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## API Endpoints

### POST `/api/shadow/create`
**Purpose**: Create a new shadow user session

**Request:**
```typescript
{
  fingerprint: string;
}
```

**Response:**
```typescript
{
  shadowUserId: string;
  shadowUsername: string;
  jwt: string;
}
```

**Sets cookies:**
- `shadow_user=true`
- `shadow_id={shadowUserId}`
- `shadow_jwt={jwt}`

---

### POST `/api/shadow/upgrade`
**Purpose**: Migrate shadow user data to real account

**Request:**
```typescript
{
  shadowUserId: string;
  newUserId: string; // Real user ID from registration
}
```

**Response:**
```typescript
{
  success: boolean;
  migratedLists: number;
  migratedItems: number;
}
```

---

## Testing Considerations

### Manual Test Cases
1. **New shadow user**: Visit site → Click "TRY DEMO" → Verify no login required
2. **Add items**: Add 10 items as shadow user → Verify all saved
3. **Item limit**: Try to add 26th item → Verify blocked with message
4. **Restrictions**: Try to invite user → Verify disabled with lock icon
5. **Upgrade**: Click "SIGN UP" → Register → Verify data migrated
6. **Return visit**: Close browser → Reopen → Verify shadow session restored
7. **Expiration**: Manually set lastActivityAt to 31 days ago → Verify fresh trial
8. **Multiple devices**: Use different browsers → Verify separate trials

### Edge Cases
1. **LocalStorage cleared**: Shadow user ID lost → Create new trial
2. **Cookies disabled**: Fallback to query param session
3. **Concurrent signup**: Two tabs signing up with same shadow ID → Handle gracefully
4. **Partial migration**: Migration fails mid-process → Rollback or complete

---

## Analytics & Metrics

### Track These Events:
- `shadow_user_created` - New trial started
- `shadow_user_added_item` - Engagement indicator
- `shadow_user_hit_limit` - Conversion opportunity
- `shadow_user_clicked_signup` - Conversion intent
- `shadow_user_upgraded` - Successful conversion
- `shadow_user_expired` - Lost trial user

### Key Metrics:
- Trial start rate (from landing page clicks)
- Average items per trial user
- Trial-to-signup conversion rate
- Time from trial start to signup
- Trial feature usage patterns

---

## Security Considerations

1. **Rate limiting**: Prevent abuse of trial accounts
   - Max 5 shadow accounts per IP per day
   - Max 100 items total across all shadow accounts per IP

2. **Spam prevention**: Shadow users cannot send invites or emails

3. **Data isolation**: Shadow users only see their own data

4. **Fingerprint privacy**: Use privacy-respecting fingerprinting, explain in ToS

5. **Shadow JWT**: Short expiration (24 hours), no sensitive data

---

## Open Questions

### 1. Should shadow users persist across devices?
**Current approach**: No - each device gets separate trial
**Alternative**: Sync via anonymous ID stored in cloud
**Decision**: Start with device-only, add sync later if requested

### 2. What happens if shadow user never signs up?
**Current approach**: Data expires after 30 days, soft-deleted
**Alternative**: Keep data indefinitely, user can "claim" later
**Decision**: 30-day expiration to manage database size

### 3. Should we allow multiple trial restarts?
**Current approach**: Yes - clear localStorage to restart
**Alternative**: Block after N trials per device
**Decision**: Allow unlimited restarts (better UX, low abuse risk for grocery lists)

### 4. Item limit: 25 too restrictive?
**Current approach**: 25 items max
**Alternative**: 50 items, or unlimited with feature restrictions only
**Decision**: Start with 25, adjust based on feedback

---

## Migration Strategy

### For Existing Users:
- No changes needed - shadow user is opt-in for new visitors only
- Existing authenticated users continue with full access

### Rollout Plan:
1. **Week 1**: Deploy shadow user backend (feature flag off)
2. **Week 2**: Enable for 10% of traffic, monitor metrics
3. **Week 3**: Enable for 50% of traffic
4. **Week 4**: Enable for 100% of traffic
5. **Ongoing**: Monitor conversion rates, adjust limits/restrictions

---

## Success Criteria

- **Adoption**: 30%+ of landing page visitors click "TRY DEMO"
- **Engagement**: 50%+ of shadow users add at least 5 items
- **Conversion**: 10%+ of shadow users sign up within 30 days
- **Technical**: Zero data loss during migration
- **Performance**: Shadow user creation < 500ms
