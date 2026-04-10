

## Update Points History for Dual Entry Types

### Overview

Update the `PointsHistoryEntry` type and the points history rendering to support both redemption-based entries and manual adjustment entries. Also update the demo data builder to include sample manual adjustments.

### Changes

**1. `src/types/mpromo.ts`** — Update `PointsHistoryEntry` interface:
- Change `campaign_id`, `campaign_name`, `redemption_id` to nullable (`number | null` / `string | null`)
- Add `type: 'earned' | 'deducted'`
- Add `adjusted_by_name: string | null`
- Add `reason: string | null`

**2. `src/pages/mpromo/MPromoPartnerDetail.tsx`** — Update points history rendering (lines 339-353):
- If `campaign_id` is not null: show Star icon, green `+{points} pts`, campaign link, date (current behavior)
- If `campaign_id` is null (manual adjustment): show PenLine icon, green or red text based on sign of `entry.points`, show `adjusted_by_name` as actor, show `reason` if present, show date
- Use destructive/red color for negative points, green for positive

**3. `src/lib/demo/mpromo-data.ts`** — Update `buildPointsHistory()` to add `type`, `adjusted_by_name`, `reason` (all null for redemption entries). Append 1-2 sample manual adjustment entries with negative points and an `adjusted_by_name`.

**4. `src/lib/api/mpromo.ts`** — Update `getPartnerPointsHistory()` demo builder to include the new fields (`type`, `adjusted_by_name`, `reason`) matching the updated type.

### No other files or styling changes required.

