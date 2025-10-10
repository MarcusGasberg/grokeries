# Feature: Grocery Shopping Trip Mode

## Prerequisites
1. User has a grocery list with at least one uncompleted item
2. User is authenticated and has access to the list

## Purpose
As a user, I want to enter a dedicated shopping mode that provides a focused, streamlined experience optimized for completing my grocery shopping in-store.

## Technical Approach
- **Client-side state**: Use Zustand to manage:
  - Active trip status (isActive, startTime)
  - Category filter state
  - Shopping UI preferences
- **Routing**: New route `/groceries/shopping?listId=xyz`
- **View transitions**: Use TanStack Router's view transitions for smooth page changes
- **Real-time sync**: Continue using Zero for real-time updates during shopping

## Use Cases

### 1. Start Shopping Trip
**As a user**, when I want to start shopping, I should see a prominent "START SHOPPING" button on my grocery list page.

**Behavior:**
- Button should be visible when list has uncompleted items
- Clicking navigates to `/groceries/shopping?listId={listId}` with view transition
- Shopping page shows only uncompleted items by default
- Header shows trip progress (X of Y items completed)
- Back button returns to main list view

**Acceptance Criteria:**
- [x] "START SHOPPING" button visible on main grocery page
- [ ] Navigation to shopping page with smooth view transition
- [x] Shopping page URL is shareable/bookmarkable
- [x] Back navigation preserves list state
- [x] Progress counter updates in real-time

### 2. End Shopping Trip
**As a user**, when I complete all items or want to exit shopping mode, I should be able to end the trip.

**Behavior:**
- "FINISH SHOPPING" button always visible in header
- Auto-redirect to main list when all items completed (with confetti if implemented)
- Option to "EXIT SHOPPING MODE" without completing all items
- Confirmation dialog if exiting with many uncompleted items (>5)

**Acceptance Criteria:**
- [x] Finish button returns to main list view
- [x] Exit button with conditional confirmation
- [x] Auto-redirect on 100% completion
- [ ] Shopping state clears on exit

### 3. Add Item While Shopping
**As a user**, when I'm shopping and realize I forgot an item, I should be able to quickly add it without leaving shopping mode.

**Behavior:**
- Floating "+" button or header action opens add item dialog/drawer
- Dialog shows simplified add form (name, quantity, category)
- New item immediately appears in shopping view
- Dialog closes automatically after adding
- Can add multiple items in succession

**Acceptance Criteria:**
- [ ] Quick-add UI accessible from shopping page
- [ ] New items appear immediately in shopping view
- [ ] Form resets after each addition
- [ ] Can dismiss dialog without adding
- [ ] Supports keyboard shortcuts for power users

### 4. Category-Based Filtering
**As a user**, when I'm in a specific section of the store (e.g., dairy), I want to quickly see only items from that category to shop efficiently.

**Behavior:**
- Horizontal scrolling filter bar with category chips (🥬 Produce, 🥛 Dairy, etc.)
- Tap category to activate filter
- Filtered items move to top and remain full opacity
- Non-matching items gray out (50% opacity) but remain visible in place
- Active filter chip has accent styling
- Tap active filter again to clear (or dedicated "Clear Filter" button)
- Filter state persists during shopping session but clears on exit

**Acceptance Criteria:**
- [ ] Category filter bar visible at top of shopping view
- [ ] Single-tap to activate category filter
- [ ] Non-matching items gray out but remain visible
- [ ] Visual indicator for active filter
- [ ] Easy filter clearing mechanism
- [ ] Filter state preserved on page refresh during trip
- [ ] *(Nice-to-have)* Smooth reordering animations

### 5. Shopping Completion Celebration
**As a user**, when I complete all items, I want visual feedback celebrating my accomplishment.

**Behavior:**
- Confetti animation when last item is checked off
- "SHOPPING COMPLETE!" message overlay
- Auto-redirect to main list after 2-3 seconds
- Celebration only triggers in shopping mode (not on main list page)

**Acceptance Criteria:**
- [ ] Confetti animation on 100% completion
- [ ] Success message overlay
- [ ] Auto-redirect with appropriate delay
- [ ] Only triggers in shopping mode

---

## Open Questions & Design Decisions

### Real-time Collaboration
**Q:** If multiple users are shopping from the same list simultaneously, how should we handle this?
- Show indicator of other active shoppers?
    - We should show an indicator of how many are in shopping mode
- Highlight items being checked by others in real-time?
    - Yes zero sync should handle this
- Show who completed which items?-
    - YES I want a stamp across the item with the user who completed it

### Completed Items Visibility
**Q:** Should completed items be hidden, grayed out, or shown in a separate section during shopping?
- The latest completed item should stay where it was completed, so you can easily undo it.
- Every other completed items should be moved to the bottom with the stamp across

### Shopping History/Stats
**Q:** Should we track shopping trip metrics?
Yes we should keep stats when of the completed shopping trip 
- Trip duration
     - Yes
- Most frequently forgotten items
     - Yes
- Average items per trip
    - Yes
- Shopping efficiency over time
    - Yes
- Most frequently bought items
    - Yes

### Offline Support
**Q:** Should shopping mode work offline?
- Cache current list before entering shopping mode
    - Zero is doing this by default
- Sync changes when back online
    - Zero is doing this by default
- Show offline indicator
    - Yes please

