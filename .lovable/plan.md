

## Campaign Profile Page Enhancement

The current `MPromoCampaignDetail` page is a skeleton with placeholder data. The plan is to build it into a full profile page modeled after the partner detail page pattern.

### What exists now
- Basic campaign header with name, type, dates, status, and action buttons (activate/pause/end)
- Three KPI cards (total redemptions, total spend, chart placeholder)
- Two empty DataTables for codes and redemptions (hardcoded `data={[]}`)
- No campaign-scoped API calls for codes/redemptions
- No tiers display, no team info, no activity timeline

### What to build

**1. Campaign-scoped API functions** (`src/lib/api/mpromo.ts`)
- Add `getCampaignCodes(campaignId, params)` — filters `demoCodes` by `campaign_id` in demo mode
- Add `getCampaignRedemptions(campaignId, params)` — filters `demoRedemptions` by `campaign_id` in demo mode

**2. Enhanced campaign header card**
- Add team name badge (e.g., "Accra Metro") when present
- Add created date
- For VOLUME_REBATE: display tiers in a compact table (threshold, reward)
- For MYSTERY_SHOPPER: display reward amount

**3. Replace chart placeholder with a redemptions trend mini-chart**
- Simple Recharts bar or area chart showing redemptions over time (demo: generate last 7 days of mock data from existing redemptions)

**4. Populate codes and redemptions tables with real data**
- Fetch campaign-scoped codes and redemptions on mount using the new API functions
- Partner names in redemptions table link to partner detail (already defined in columns)

**5. Add tabbed layout** (matching partner detail pattern)
- Tabs: Overview (KPIs + tiers + chart), Codes, Redemptions
- Move codes and redemptions tables into their respective tabs

**6. Add activity timeline in Overview tab**
- Merge campaign codes and redemptions into a chronological feed, same pattern as partner detail

### Files to modify
- `src/lib/api/mpromo.ts` — add `getCampaignCodes`, `getCampaignRedemptions`
- `src/pages/mpromo/MPromoCampaignDetail.tsx` — rebuild with tabs, real data fetching, tiers display, chart, activity timeline

