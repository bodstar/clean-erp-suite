

## Make Partner Names Clickable Links Across M-Promo Module

All occurrences of partner names in the M-Promo module need to become clickable links navigating to `/mpromo/partners/:id`.

### Files to Edit

**1. `src/pages/mpromo/MPromoPartners.tsx`**
- Change the `name` column from plain text to a render function returning a `<Link to={/mpromo/partners/${row.id}}>` with appropriate styling (e.g., `text-primary hover:underline cursor-pointer`).

**2. `src/pages/mpromo/MPromoRedemptions.tsx`**
- Add `import { Link } from "react-router-dom"`.
- Change `partner_name` column to use a render function: `<Link to={/mpromo/partners/${r.partner_id}}>`.

**3. `src/pages/mpromo/MPromoPayouts.tsx`**
- Add `import { Link } from "react-router-dom"`.
- Change `partner_name` column in both `pendingCols` and `paidCols` to render a link using `r.partner_id`.

**4. `src/pages/mpromo/MPromoOrders.tsx`**
- Change `partner_name` column to render a link using `r.partner_id`.

**5. `src/pages/mpromo/MPromoCampaignDetail.tsx`**
- Change `partner_name` column in redemption table to render a link using `r.partner_id`.

**6. `src/pages/mpromo/MPromoGeoQueue.tsx`**
- Add `import { Link } from "react-router-dom"`.
- Change `name` column to render a link using `r.id`.

**7. `src/pages/mpromo/MPromoOverview.tsx`**
- In the Top Chillers and Top Ice Water Sellers lists, wrap `p.name` in a `<Link to={/mpromo/partners/${p.id}}>`.

### Link Styling
All partner name links will use: `className="text-primary hover:underline"` for consistent styling across the module.

