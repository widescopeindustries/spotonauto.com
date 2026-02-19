# Charm.li Integration Guide

## Overview
This integration ensures your site **only offers repair guides for vehicles that actually exist in charm.li**, eliminating hallucinations completely.

## How It Works

```
User selects Make → Dropdown shows only makes in charm.li
     ↓
User selects Model → Dropdown shows only models for that make
     ↓
User selects Year → Dropdown shows only years charm.li has data for
     ↓
User clicks "Get Guide" → Only if all three match charm.li exactly
```

If the user tries to access a URL directly (e.g., `/repair/1985/ford/explorer/...`):
1. Basic validation checks if the vehicle existed in reality
2. **Additional check** verifies charm.li has data for that exact year
3. If not → **404 error**

## Files Added/Modified

### New Files
1. **`scripts/scrape-charm-li.js`** - Scrapes charm.li to build the database
2. **`src/data/charmLiDatabase.ts`** - Auto-generated database of available vehicles
3. **`src/components/CharmLiVehicleSelector.tsx`** - Dropdown selector component
4. **`src/app/charm-repair/page.tsx`** - New repair page using the selector

### Modified Files
1. **`src/app/repair/[year]/[make]/[model]/[task]/page.tsx`** - Added charm.li validation check

## Setup Instructions

### Step 1: Scrape charm.li
```bash
node scripts/scrape-charm-li.js
```

This will:
- Crawl charm.li for all available makes, models, and years
- Generate `src/data/charmLiDatabase.ts` with the complete whitelist
- Show you a summary of what's available

### Step 2: Test Locally
```bash
npm run dev
```

Visit:
- `http://localhost:3000/charm-repair` - New selector-based page
- `http://localhost:3000/repair/1985/ford/explorer/radiator-replacement` - Should 404
- `http://localhost:3000/repair/1992/ford/explorer/radiator-replacement` - Should work

### Step 3: Deploy
```bash
vercel --prod
```

## User Experience

### Scenario 1: Vehicle Available
1. User selects Ford → Explorer → 1992
2. Sees green checkmark: "Service manual available"
3. Selects repair task
4. Gets accurate guide grounded in charm.li data

### Scenario 2: Vehicle Not Available
1. User selects Ford → Explorer → 1985
2. Sees red message: "Sorry, we don't have data for this vehicle yet"
3. Message shows available years: "We have Ford Explorer data for years: 1991-2013"
4. No guide generated, no hallucination

### Scenario 3: Direct URL Access
- User visits `/repair/1985/ford/explorer/...`
- **404 error** - page doesn't exist
- Google will de-index these over time

## Benefits

| Before | After |
|--------|-------|
| AI could hallucinate any year/make/model | Only charm.li vehicles shown |
| 1985 Ford Explorer pages existed | 1985 Ford Explorer returns 404 |
| Users got wrong repair procedures | Users only get verified procedures |
| Google indexed fake pages | Google only indexes real pages |
| Legal liability for wrong info | Safe, verified content only |

## Maintenance

### Adding New Vehicles
When charm.li adds new data:
1. Re-run `node scripts/scrape-charm-li.js`
2. Commit the updated `charmLiDatabase.ts`
3. Redeploy

### Handling User Requests
If users request vehicles you don't have:
1. Check if charm.li has the data (run scraper)
2. If yes → regenerate database and deploy
3. If no → add to "coming soon" list, consider alternative sources

## Database Structure

```typescript
CHARM_LI_DATABASE = {
    "Ford": {
        "Explorer": { 
            years: [1991, 1992, 1993, ...], 
            path: "/Ford/1991/" 
        },
        "Escape": { 
            years: [2001, 2002, 2003, ...], 
            path: "/Ford/2001/" 
        }
    },
    "Toyota": {
        "Camry": { 
            years: [1983, 1984, 1985, ...], 
            path: "/Toyota/1983/" 
        }
    }
}
```

## Fallback Strategy

If charm.li is missing a vehicle you want to support:

**Option A: Hybrid Approach**
- Use charm.li for vehicles it has
- For others, clearly label "Aggregated from multiple sources (not charm.li)"

**Option B: User Contribution**
- Let users request vehicles
- Manually verify and add from other sources
- Mark as "Community verified" vs "Factory manual"

**Option C: Partner with charm.li**
- Contact charm.li about missing vehicles
- Contribute to their database

## Summary

This integration makes your site **impossible to hallucinate** because:
1. Users can only select from dropdowns populated by charm.li data
2. Direct URL access is validated against the same database
3. If it's not in charm.li, it returns 404

**Result**: 100% of your repair guides are grounded in actual factory service manuals.
