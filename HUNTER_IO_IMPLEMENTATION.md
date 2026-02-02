# Hunter.io Integration Plan

## Overview

Integrate Hunter.io's Domain Search API to reliably fetch contact names (owner/manager) for businesses based on their website domain.

## Prerequisites

1. Sign up for a Hunter.io account at https://hunter.io
2. Get your API key from https://app.hunter.io/api_keys
3. Add to `.env.local`:
   ```
   HUNTER_API_KEY=your_api_key_here
   ```

## Free Tier Limits

- 50 requests/month (Domain Search)
- 50 requests/month (Email Verification)
- Rate limit: 10 requests/second

## API Endpoint

```
GET https://api.hunter.io/v2/domain-search
```

### Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain` | Yes | The domain to search (e.g., `example.com`) |
| `api_key` | Yes | Your Hunter.io API key |
| `limit` | No | Number of results (default: 10, max: 100) |
| `seniority` | No | Filter by seniority: `junior`, `senior`, `executive` |
| `department` | No | Filter by department: `executive`, `management`, etc. |

### Response Example
```json
{
  "data": {
    "domain": "example.com",
    "organization": "Example Company",
    "emails": [
      {
        "value": "john.smith@example.com",
        "type": "personal",
        "confidence": 95,
        "first_name": "John",
        "last_name": "Smith",
        "position": "Owner",
        "seniority": "executive",
        "department": "executive"
      }
    ]
  }
}
```

## Implementation Steps

### Step 1: Create Hunter.io Service

Create `src/services/hunter.ts`:

```typescript
export interface HunterContact {
  email: string
  firstName: string
  lastName: string
  position: string | null
  confidence: number
}

export interface HunterResult {
  success: boolean
  contact: HunterContact | null
  error?: string
}

export async function findContactByDomain(domain: string): Promise<HunterResult> {
  const apiKey = process.env.HUNTER_API_KEY
  
  if (!apiKey) {
    return { success: false, contact: null, error: "HUNTER_API_KEY not configured" }
  }
  
  // Extract domain from full URL if needed
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
  
  try {
    const url = new URL("https://api.hunter.io/v2/domain-search")
    url.searchParams.set("domain", cleanDomain)
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("limit", "1")
    // Prioritize executives/owners
    url.searchParams.set("seniority", "executive")
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    if (!response.ok) {
      return { 
        success: false, 
        contact: null, 
        error: data.errors?.[0]?.details || "Hunter API error" 
      }
    }
    
    const emails = data.data?.emails || []
    
    if (emails.length === 0) {
      return { success: true, contact: null }
    }
    
    // Get the first (highest confidence) result
    const contact = emails[0]
    
    return {
      success: true,
      contact: {
        email: contact.value,
        firstName: contact.first_name || "",
        lastName: contact.last_name || "",
        position: contact.position || null,
        confidence: contact.confidence || 0,
      }
    }
  } catch (error) {
    console.error("Hunter API error:", error)
    return { success: false, contact: null, error: String(error) }
  }
}
```

### Step 2: Update Website Scraper

In `src/services/website-scraper.ts`, add Hunter.io integration:

```typescript
import { findContactByDomain } from "./hunter"

// In scrapeWebsite function, after extracting other data:
if (process.env.HUNTER_API_KEY) {
  const hunterResult = await findContactByDomain(url)
  if (hunterResult.success && hunterResult.contact) {
    result.contactName = `${hunterResult.contact.firstName} ${hunterResult.contact.lastName}`.trim()
    result.contactTitle = hunterResult.contact.position || undefined
    // Optionally add Hunter email if not already found
    if (hunterResult.contact.email && !result.emails.includes(hunterResult.contact.email)) {
      result.emails.unshift(hunterResult.contact.email)
    }
  }
}
```

### Step 3: Add Rate Limiting (Optional)

To avoid hitting API limits, consider adding a simple rate limiter:

```typescript
// Simple in-memory rate limiter
let hunterRequestCount = 0
const HUNTER_MONTHLY_LIMIT = 50

export function canMakeHunterRequest(): boolean {
  return hunterRequestCount < HUNTER_MONTHLY_LIMIT
}

export function incrementHunterCount(): void {
  hunterRequestCount++
}
```

### Step 4: Update Environment Types

Add to your environment type definitions if you have them:

```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    HUNTER_API_KEY?: string
  }
}
```

## Integration Points

| File | Change |
|------|--------|
| `.env.local` | Add `HUNTER_API_KEY` |
| `src/services/hunter.ts` | New file - Hunter.io API client |
| `src/services/website-scraper.ts` | Call Hunter.io for contact lookup |

## Cost Considerations

| Plan | Credits/Month | Monthly Cost | Cost per Lead |
|------|---------------|--------------|---------------|
| Free | 50 | $0 | $0 |
| Starter | 2,000 | $34 (yearly) | $0.017 |
| Growth | 10,000 | $104 (yearly) | $0.010 |

## Fallback Behavior

If Hunter.io is not configured or fails:
- Contact name fields remain empty (current behavior)
- Emails/phones still extracted from website scraping
- No error shown to user - graceful degradation

## Testing

1. Add API key to `.env.local`
2. Run a search with website enrichment enabled
3. Check that contact names appear in results
4. Monitor Hunter.io dashboard for usage

## Notes

- Hunter.io works best with company domains (not personal websites)
- Small local businesses may have limited data
- Consider caching results to reduce API calls
- Free tier is sufficient for testing and low-volume use
