

## Mobile and Tablet Responsiveness Overhaul

This plan addresses horizontal scrolling across the entire app by restructuring the TopBar for mobile, ensuring cards fit the viewport, and improving table/form layouts on small screens.

---

### 1. TopBar: Collapse actions into a slide-out menu on mobile

**Problem**: On mobile, the TopBar shows the sidebar trigger, team badge, team switcher button, theme toggle, notifications bell, and user menu all in a single row -- causing overflow.

**Solution**: On screens below `sm` (640px), hide the individual icon buttons (theme, notifications, user) and the team switcher, and replace them with a single hamburger/menu icon that opens a Sheet (slide-in panel from the right). The sheet will contain all those actions in a vertical list.

**Changes to `src/components/layout/TopBar.tsx`**:
- Import `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` from `@/components/ui/sheet`
- Import `useIsMobile` from `@/hooks/use-mobile`
- Import `Menu` icon from lucide-react
- On mobile (`isMobile === true`): render only `SidebarTrigger` + team badge + spacer + a single Menu button that opens a Sheet from the right
- Inside the Sheet: list "Switch Team" options, Theme toggle, Notifications, Profile, and Logout as full-width menu items
- On desktop (`isMobile === false`): keep the current layout unchanged

---

### 2. Breadcrumbs: Truncate on mobile

**Problem**: Long breadcrumb trails can overflow horizontally on small screens.

**Changes to `src/components/layout/Breadcrumbs.tsx`**:
- Add `overflow-hidden` and `whitespace-nowrap` with `text-ellipsis` on the nav container
- On mobile, show only the last breadcrumb segment (hide intermediate segments) using a `hidden sm:flex` pattern for middle crumbs

---

### 3. Cards: Ensure full-width on mobile

**Problem**: Cards with fixed or minimum widths may not fit mobile viewports.

**Changes**:
- `src/components/shared/KpiCard.tsx`: Already uses `w-full` implicitly via grid. No change needed; the grid in overview/dashboard already uses `grid-cols-1` at mobile. Verified OK.
- `src/pages/mpromo/MPromoPartnerCreate.tsx`: The form has `max-w-2xl` which is fine. The geolocation buttons row should get `flex-wrap` to prevent overflow on narrow screens.

---

### 4. DataTable header: Stack search/filters/actions vertically on mobile

**Problem**: The search bar, filters, and action buttons sit in a row that can overflow.

**Changes to `src/components/shared/DataTable.tsx`**:
- The header already uses `flex-col sm:flex-row`. Ensure `headerActions` drops `ml-auto` on mobile and goes full width: change to `sm:ml-auto`.
- Make search input `w-full sm:max-w-sm` (remove `max-w-sm` on mobile so it takes full width).

---

### 5. MPromoLayout nav tabs: Already scrollable, but ensure no page-level overflow

**Changes to `src/components/mpromo/MPromoLayout.tsx`**:
- Already has `overflow-x-auto` and edge-to-edge negative margins. Verified OK.

---

### 6. Partner create form: Wrap geolocation buttons

**Changes to `src/pages/mpromo/MPromoPartnerCreate.tsx`**:
- Add `flex-wrap` to the geolocation buttons container (line 249) so buttons stack on narrow screens.

---

### Technical Summary

| File | Change |
|------|--------|
| `src/components/layout/TopBar.tsx` | Mobile: collapse right-side actions into a Sheet slide-out panel |
| `src/components/layout/Breadcrumbs.tsx` | Truncate/collapse middle segments on mobile |
| `src/components/shared/DataTable.tsx` | Full-width search on mobile, stack header actions |
| `src/pages/mpromo/MPromoPartnerCreate.tsx` | Wrap geolocation buttons with `flex-wrap` |

No new dependencies are needed -- Sheet and useIsMobile already exist in the project.

