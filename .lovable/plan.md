

## Relocate Demo Data from Lagos to Accra

The demo data currently has about half of the partners located in Lagos, Nigeria with Nigerian phone numbers and Lagos GPS coordinates. Since the app launches in Ghana (Accra first), all demo data needs to be Ghana-focused.

### Changes (single file: `src/lib/demo/mpromo-data.ts`)

**Partners** -- Replace all 6 Lagos-based partners with Accra-area locations and Ghanaian names/phones:
- id 3: "Emeka Cold Drinks" (Ikeja, Lagos) → Ghanaian name, location like "Cantonments, Accra", GPS ~5.56, -0.17, phone +233...
- id 4: "Fatima Pure Water" (Lekki, Lagos) → location like "East Legon, Accra", GPS ~5.64, -0.16
- id 6: "Blessing Ice Point" (Surulere, Lagos) → "Dansoman, Accra", GPS ~5.55, -0.26
- id 8: "Chidi Cooler Station" (Victoria Island, Lagos) → "Airport Residential, Accra", GPS ~5.60, -0.18
- id 10: "Tunde Refresh Corner" (Yaba, Lagos) → "Achimota, Accra", GPS ~5.63, -0.23
- id 12: "Ngozi Drinks Depot" (Ajah, Lagos) → "Spintex, Accra", GPS ~5.63, -0.10

All Nigerian phone numbers (+234...) become Ghanaian (+233...).

**Teams** -- Replace "Lagos Central" (team_id 2) with "Tema/East Accra" across campaigns, orders, and overview data.

**Map Partners** -- Update the same 6 partners with Accra GPS coordinates and Ghanaian details.

**Redemptions, Payouts, Codes, Orders** -- Update partner names/phones to match the renamed partners. Update team_name references from "Lagos Central" to "Tema/East Accra".

**Overview** -- Update any partner names in top_chillers/top_ice_water_sellers and recent_activity descriptions.

No structural or API changes needed -- only data values in `src/lib/demo/mpromo-data.ts`.

