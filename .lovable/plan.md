

## S&D Phase 2: Driver Management, Route Planning, and Driver Assignment

This is a large feature spanning 8 files (3 new, 5 modified). All pages will be fully functional in demo mode.

---

### Files to Modify

**1. `src/types/sd.ts`** — Add new types
- `DriverStatus`, `SDDriver`, `RouteStatus`, `RouteStopStatus`, `RouteOptimisedBy`, `SDRouteStop`, `SDRoute`, `SDRouteSummary` — exactly as specified in the request.

**2. `src/lib/api/sd-demo.ts`** — Add demo data
- `demoDrivers` (3 drivers), `demoRoutes` (2 route summaries), `demoRouteDetails` (1 detailed route with 3 stops) — exactly as specified.
- Import new types from `@/types/sd`.

**3. `src/lib/api/sd.ts`** — Add API functions
- Import new types and demo data.
- Add functions: `getDrivers`, `getDriver`, `createDriver`, `updateDriver`, `toggleDriverAvailability`, `assignDriver`, `getRoutes`, `getRoute`, `createRoute`, `optimiseRoute`, `updateRouteStopStatus` — all with demo mode support and scope filtering.

**4. `src/App.tsx`** — Register new route
- Import `SDRouteDetail` (lazy, since it uses Leaflet).
- Add `<Route path="routes/:id" element={<Suspense ...><SDRouteDetail /></Suspense>} />` inside the `/sd` group.

---

### Files to Create

**5. `src/pages/sd/SDDrivers.tsx`** — Full driver management page (replaces placeholder)
- DataTable with columns: Name (clickable), Phone, Vehicle Type, Plate, Status badge, Availability toggle, Team badge (global scope).
- Search + status filter bar.
- "Add Driver" button (permission-gated with `sd.drivers.manage`) opens a Dialog with form fields: name, phone, license_no, vehicle_type (Select), vehicle_plate.
- Detail Sheet on row click: driver info, status, last seen, active route link, edit form, availability toggle.
- Uses `useSDScope()` for scope-aware data loading.

**6. `src/pages/sd/SDRoutes.tsx`** — Full route planning page (replaces placeholder)
- DataTable with columns: Date, Driver + vehicle, Status badge, Stop progress ("X of Y"), Team badge.
- Row click navigates to `/sd/routes/:id`.
- Status filter (all/draft/active/completed/cancelled).
- "Create Route" button (gated by `sd.routes.manage`) opens a 3-step Dialog:
  - Step 1: Select available driver + pick delivery date.
  - Step 2: Search/select confirmed orders as stops, reorder with Up/Down arrows.
  - Step 3: Review driver, date, ordered stops → submit via `createRoute()`.

**7. `src/pages/sd/SDRouteDetail.tsx`** — New route detail page
- Header: date, driver, vehicle, status badge, "Optimise Route" button.
- Two-column desktop layout (stacked on mobile):
  - Left: ordered stop cards with sequence, order link, customer, address, status badge, and status action buttons (Mark Arrived / Mark Complete / Skip) for users with `sd.routes.manage`.
  - Right: Leaflet map with numbered `L.divIcon` markers (green=completed, amber=arrived, grey=pending), polyline connecting stops in sequence. Bounds auto-fit.
- "Optimise Route" calls `optimiseRoute()`, updates stop order, shows toast. Only visible for draft routes with manage permission.
- Lazy-loaded in App.tsx to avoid Leaflet context issues.

---

### File to Update

**8. `src/pages/sd/SDOrderDetail.tsx`** — Add driver assignment section
- When `order.status === 'confirmed'` and user has `sd.orders.manage`:
  - Load available drivers via `getDrivers({ status: 'available' }, scope)`.
  - Show a Select dropdown + "Assign Driver" button.
  - On assign: call `assignDriver()`, update order status to `assigned` and set `driver_name` locally.
- Import `useSDScope`, `getDrivers`, `assignDriver` from API layer.
- Import `useAuth` and check `hasPermission('sd.orders.manage')`.

---

### Technical Details

- Leaflet usage mirrors `MPromoMap.tsx`: same icon fix pattern, same tile layer, same `L.divIcon` approach for numbered markers.
- All existing UI patterns reused: `DataTable`, `StatusBadge`, `Sheet`, `Dialog`, `ConfirmDialog`, `TeamBadge`.
- Status badge color mapping: available/completed → green, on_delivery/arrived/active → amber, off_duty/pending/draft → grey/muted, cancelled → muted.
- `RouteOptimisedBy` exported from `sd.ts` for use in demo data.
- Franchise teams (Accra Central, Kumasi) do not get `sd.drivers.manage` or `sd.routes.manage` — already configured in AuthProvider demo data.
- No M-Promo files modified.

