# SpotOnAuto Search Launch Import Sheets

These CSVs are structured to be Google Ads Editor-friendly and easy to map if Editor does not auto-detect every column name.

The files are intentionally lean:
- Search only
- US-only plan
- Exact and phrase match only
- Search Partners off
- Campaigns set to `Paused` for safe review before launch

## Files

- `campaigns.csv`
- `ad_groups.csv`
- `keywords.csv`
- `responsive_search_ads.csv`
- `account_negative_keywords.csv`
- `campaign_negative_keywords.csv`

## Recommended Import Order

1. Import `campaigns.csv`
2. Import `ad_groups.csv`
3. Import `keywords.csv`
4. Import `responsive_search_ads.csv`
5. Import the negative keyword sheets

## Launch Notes

- If total budget is around `$20/day`, start with these priority ad groups first:
  - `2008 Honda Civic Battery Replacement`
  - `2015 Jeep Cherokee Headlight Bulb`
  - `2014 Nissan Altima Brake Pad Replacement`
  - `Chrysler 300 Battery Location`
  - `BMW X3 Oil Type`
  - `2006 BMW X3 Alternator Wiring`

- Leave all campaigns paused until you confirm:
  - location targeting is `United States`
  - language is `English`
  - bidding is `Maximize Clicks`
  - Search Partners are disabled
  - conversion actions are mapped correctly

## Conversion Setup

Primary conversions:
- `guide_generated`
- `wiring_diagram_open`
- `manual_retrieval`

Secondary conversions:
- `repair_guide_open`
- `repair_answer_click`
- `knowledge_graph_click`
- `vehicle_search`
- `affiliate_click`

## Why These Pages

The selected URLs are based on a combination of:
- current GSC impressions
- existing tool page coverage
- valid live URLs checked on `spotonauto.com`
- page types that match ad intent directly

The wiring URLs in this sheet were validated against live `200` responses on March 22, 2026.
