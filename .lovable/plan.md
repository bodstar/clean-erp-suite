

## Build Heatmap Layer for M-Promo Map

### Summary
Implement a canvas-based heatmap overlay that visualizes redemption intensity across partner locations. When the "Heatmap" toggle is enabled, colored intensity circles overlay the map using each partner's `redemptions_amount` as the weight. Markers remain visible underneath.

### Approach
Since `leaflet.heat` is a third-party plugin that would require an npm install and has compatibility concerns, we will implement a **lightweight custom canvas heatmap layer** using Leaflet's `L.CircleMarker` approach — drawing semi-transparent, gradient circles sized and colored by redemption amount. This avoids external dependencies entirely.

Alternatively, we can use a simple `L.CircleMarker`-based approach:
- Each partner gets a translucent circle whose radius and color intensity scale with `redemptions_amount`
- Low redemptions = small green circle, high redemptions = large red circle
- Circles are added to a separate `LayerGroup` that is toggled by the heatmap switch

### Changes

**1. `src/pages/mpromo/MPromoMap.tsx`**
- Add a new `heatLayerRef = useRef<L.LayerGroup>()` for heatmap circles
- Add the layer group to the map on init
- New `useEffect` that reacts to `[partners, heatmap]`:
  - Clears the heat layer
  - If `heatmap` is true, iterates partners and adds `L.circleMarker` at each location with:
    - `radius`: scaled from `redemptions_amount` (min 8, max 40)
    - `fillColor`: gradient from green (low) → yellow (mid) → red (high)
    - `fillOpacity`: 0.45
    - `stroke`: false
  - Each circle gets a tooltip showing partner name and redemption amount
- When heatmap is on, optionally reduce marker opacity so circles are more visible
- Remove the placeholder text at the bottom
- Add a legend below the map showing the color scale (green → yellow → red) with labels "Low" / "Medium" / "High"

### Files modified
- `src/pages/mpromo/MPromoMap.tsx`

