

## S&D Phase 3: Dispatch Map

Replace the SDMap placeholder with a fully functional real-time dispatch map showing live driver positions, delivery destinations, and route lines.

---

### Files to Create

**1. `src/hooks/useSDRealtime.ts`** — Real-time driver location hook
- In demo mode: `setInterval` every 3s nudging driver 1 eastward and driver 2 with small jitter.
- In production: dynamically imports `laravel-echo` + `pusher-js`, connects to Laravel Reverb on `team.{id}.drivers` channel.
- Accepts `{ teamId, onDriverLocationUpdate, enabled }` — toggling `enabled` starts/stops updates.
- Env var comments at top for developer reference.

---

### Files to Modify

**2. `src/types/sd.ts`** — Add new types
- `DriverLocation` interface (driver_id, latitude, longitude, recorded_at).
- `DispatchMapDriver` interface (driver info + current destination details for map rendering).

**3. `src/lib/api/sd.ts`** — Add `getDispatchMapDrivers`
- Import `DispatchMapDriver` type.
- In demo mode: returns 2 hardcoded drivers (Emmanuel on delivery with destination, Isaac available).
- In production: `GET /sd/map/drivers` with scope params.

**4. `src/pages/sd/SDMap.tsx`** — Full replacement with dispatch map
- **Layout**: Two-panel — 320px sidebar on left, Leaflet map filling rest. On mobile, sidebar becomes a toggleable bottom sheet.
- **Sidebar**: "Dispatch Map" header with real-time on/off Switch, status filter buttons (All/On Delivery/Available/Off Duty), scrollable driver cards showing name, plate, status badge, destination or "No active delivery", relative "last seen" time. Click card → pan map to driver.
- **Map**: Same Leaflet setup as MPromoMap (icon fix, theme-aware tiles, Ghana center). Driver markers via `L.divIcon` (amber=on_delivery, green=available, grey=off_duty). Red destination markers for on_delivery drivers. Dashed amber polylines connecting driver→destination.
- **Real-time**: `useSDRealtime` updates marker positions via `setLatLng()` without recreation. Route lines updated via `setLatLngs()`. `driversRef` avoids stale closures.
- **Controls**: Floating "Fit All" and "Refresh" buttons on map.
- **Permission**: Gate behind `hasPermission('sd.view')`.
- **Loading/Empty**: Skeleton while loading; empty message when no drivers match filters.

---

### Technical Details

- Leaflet pattern identical to MPromoMap.tsx and SDRouteDetail.tsx (icon fix, tile layer, theme switching, cleanup).
- `useCallback` on `handleDriverLocationUpdate` to prevent re-triggering the realtime hook interval.
- Marker refs (`Map<number, L.Marker>`) for efficient position updates without marker recreation.
- Separate `useEffect` for marker rebuild on `[drivers, statusFilter]` vs map init.
- No M-Promo or Phase 1/2 files modified.
- `DEMO_MODE` check uses `!import.meta.env.VITE_API_BASE_URL` consistent with existing code (not `VITE_DEMO_MODE`).

