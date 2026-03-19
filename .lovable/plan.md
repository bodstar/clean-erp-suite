

## Plan: Heatmap-Only Mode with Multi-Partner Selection & Comparison

### Overview
When heatmap is enabled, hide individual location markers and make heat circles clickable to show partners within that circle's area. Add drag-selection (lasso/rectangle) to select partners in a region. Add a compare mode for selected partners.

### Changes

#### 1. Hide markers when heatmap is on
**File: `src/pages/mpromo/MPromoMap.tsx`**
- In the "Update markers" `useEffect`, skip adding markers entirely when `heatmap` is `true` (currently they render at 0.5 opacity).

#### 2. Make heat circles clickable — show partners in radius
**File: `src/components/mpromo/map/useMapHeatLayer.ts`**
- Add an `onCircleClick` callback prop to the hook options.
- On each circle marker, attach a click handler that finds all partners whose lat/lng falls within the circle's radius and passes that list to the callback.
- Export a helper to compute which partners fall within a given circle (using `L.Map.distance` or the Haversine formula based on the circle's pixel radius converted to meters at current zoom).

**File: `src/pages/mpromo/MPromoMap.tsx`**
- Pass an `onCircleClick` callback to `useMapHeatLayer` that sets `selectedPartners` (new state: `MapPartner[]`).

#### 3. Drag-selection (rectangle select) on map
**File: `src/pages/mpromo/MPromoMap.tsx`**
- Add a "Select Area" toggle button to the filter bar or map overlay.
- When active, enable a custom rectangle-draw interaction: on `mousedown` + drag, draw a `L.Rectangle` overlay; on `mouseup`, compute which partners fall within the rectangle bounds and populate `selectedPartners`.
- Use a ref for the selection rectangle and clean up on deactivate.

**File: `src/components/mpromo/map/MapFilterBar.tsx`**
- Add a new prop `areaSelect` / `onAreaSelectChange` for the toggle control, rendered as a button with a selection icon.

#### 4. Redesign MapPartnerPanel to show multiple partners
**File: `src/components/mpromo/map/MapPartnerPanel.tsx`**
- Change props from `partner: MapPartner | null` to `partners: MapPartner[]` plus `comparePartners: MapPartner[]` and selection callbacks.
- **List view**: When `partners` has items, render a scrollable table with columns: Name, Type, Status, Location, Redemptions, Orders, Payouts, Loyalty Points, and action buttons (View Partner, etc.). Each row has a checkbox for comparison selection.
- **Compare view**: When 2+ partners are checked for comparison, show a "Compare" button. Clicking it switches to a side-by-side comparison layout (vertical cards or a comparison table) showing all partner metrics aligned for easy comparison. Include a "Back to list" button.
- **Empty state**: "Click a heat circle or drag-select an area to view partners."

#### 5. Wire it all together in MPromoMap
**File: `src/pages/mpromo/MPromoMap.tsx`**
- Replace `selectedPartner: MapPartner | null` with `selectedPartners: MapPartner[]`.
- Add `comparePartners: MapPartner[]` state for the comparison selection.
- Pass both to the redesigned `MapPartnerPanel`.

### Technical Details
- Circle click partner detection: Convert the circle's pixel radius to meters using `map.containerPointToLatLng` at the circle center, then filter partners by distance.
- Drag selection: Use native Leaflet DOM events with `L.DomEvent` to capture shift+drag or a toggled mode; draw `L.Rectangle` and use `bounds.contains(partnerLatLng)` to filter.
- No new dependencies needed — all done with Leaflet's built-in APIs.

### Files to modify
1. `src/components/mpromo/map/MapFilterBar.tsx` — add area-select toggle
2. `src/components/mpromo/map/useMapHeatLayer.ts` — add circle click callback
3. `src/components/mpromo/map/MapPartnerPanel.tsx` — redesign for multi-partner list, table, and compare mode
4. `src/pages/mpromo/MPromoMap.tsx` — orchestrate new state and interactions

