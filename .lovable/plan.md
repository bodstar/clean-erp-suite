

## Advanced Area Selection — Additive Feature (Preserving Existing Select Area)

### Principle
The current "Select Area" (single rectangle drag) remains completely untouched. The advanced area selection is a **separate, independent tool** with its own toggle, state, and UI. It can coexist with the basic selection but does not modify it.

### New Files

**1. `src/types/area-zone.ts`**
- `ShapeMode = "rectangle" | "circle" | "polygon"`
- `AreaZone { id, label, color, shapeMode, layer: L.Layer | null, partners: MapPartner[] }`
- Color palette constant (6 colors: indigo, amber, emerald, red, violet, pink)

**2. `src/hooks/useAdvancedAreaSelection.ts`**
Custom hook accepting `map`, `partners`, `active` (boolean).
- State: `zones: AreaZone[]`, `activeZoneId: string | null`
- Actions: `addZone()` — creates zone with next color from palette, auto-sets as active; `removeZone(id)` — removes zone and its Leaflet layer; `setActiveZone(id)`; `setShapeMode(id, mode)` — changes shape and clears that zone's existing layer so user redraws; `clearAll()`
- Drawing logic (only when `active` and there's an `activeZoneId`):
  - **Rectangle**: mousedown/mousemove/mouseup drag draws `L.rectangle` in zone color
  - **Circle**: first click sets center (temporary dot marker), second click finalizes `L.circle` with computed radius
  - **Polygon**: each click adds a vertex (`L.circleMarker` numbered); polyline preview follows cursor; double-click closes shape creating `L.polygon`; min 3 points enforced
- After shape is drawn, computes `zone.partners` via containment checks (bounds for rect, distance for circle, ray-cast for polygon)
- Disables map dragging while drawing; re-enables when not active
- Cleanup removes all Leaflet layers on unmount or when `active` toggled off

**3. `src/components/mpromo/map/AdvancedAreaPanel.tsx`**
Renders when advanced selection is active, between filter bar and map.
- Header: "Advanced Selection" with "Add Zone" button and "Clear All" button
- Zone rows (repeater): color swatch, editable label, shape mode toggle group (Rect / Circle / Polygon icons), partner count badge, delete button
- Active zone row is highlighted
- Clicking a row sets it as active zone

### Modified Files

**4. `src/components/mpromo/map/MapFilterBar.tsx`**
- Add new props: `advancedAreaSelect: boolean`, `onAdvancedAreaSelectChange: (v: boolean) => void`
- Add a new button next to "Select Area": "Advanced Select" with a different icon (e.g. `Shapes` from lucide)
- When advanced select is enabled, basic select area button is still independently toggleable

**5. `src/pages/mpromo/MPromoMap.tsx`**
- Add `advancedAreaSelect` state (boolean, default false)
- Import and call `useAdvancedAreaSelection({ map, partners, active: advancedAreaSelect })`
- Render `<AdvancedAreaPanel>` conditionally when `advancedAreaSelect` is true
- Aggregate partners: existing `selectedPartners` (from basic select) remain untouched; advanced zones' partners are surfaced separately via the panel or merged into `selectedPartners` for the `MapPartnerPanel`
- Pass `advancedAreaSelect` and zone data to `MapPartnerPanel` so it can show zone-grouped sections

**6. `src/components/mpromo/map/MapPartnerPanel.tsx`**
- Accept optional `zones: AreaZone[]` prop
- When zones are provided and have partners, show a zone-grouped view: each zone gets a collapsible section with its color swatch and label as header, listing its partners below
- Compare mode works across all zones' partners
- Falls back to current behavior when no zones provided

### Interaction Flow

```text
User enables "Advanced Select"
  → AdvancedAreaPanel appears above map
  → No zones yet — panel shows "Add Zone" prompt
User clicks "Add Zone"
  → Zone A created (indigo, rectangle mode, active)
  → Map cursor becomes crosshair
  → User draws rectangle → partners computed → shown in panel
User clicks "Add Zone" again
  → Zone B created (amber, rectangle mode, active)
  → User switches to Polygon mode via toggle
  → User clicks points on map → polygon drawn → partners computed
User can toggle basic "Select Area" independently — it works as before
```

### Implementation Order
1. Create types (`area-zone.ts`)
2. Build `useAdvancedAreaSelection` hook — rectangle mode first, then circle, then polygon
3. Build `AdvancedAreaPanel` UI
4. Wire into `MPromoMap` and `MapFilterBar`
5. Update `MapPartnerPanel` for zone-grouped display

