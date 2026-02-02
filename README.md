# Ordo Lead Generator

Automated lead generation tool for finding catering partners near schools.

## Features

- **Google Places Discovery**: Search for catering companies, pizza shops, diners, and meal prep services near any school address
- **Chain Detection**: Automatically flags known chains (Chipotle, Dominos, etc.) and cuisine-limited businesses
- **Website Enrichment**: Scrapes business websites for emails, contact names, and social media links
- **URL Validation**: Verifies that business websites are actually live
- **Excel Export**: Download leads in the exact format your team uses
- **Distance Calculation**: Shows how far each lead is from the school

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional, for database)

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Google Maps API key.

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Using Docker

```bash
# Start everything (app + database)
docker-compose up -d

# View logs
docker-compose logs -f app
```

## API Reference

### Generate Leads

```http
POST /api/leads/generate
Content-Type: application/json

{
  "schoolAddress": "123 Main St, City, State ZIP",
  "schoolName": "Example School",
  "radiusMiles": 15,
  "searchType": "catering",  // "catering" | "pizza_diner" | "meal_prep" | "custom"
  "enrichLeads": true        // optional: scrape websites for extra data
}
```

### Export to Excel

```http
POST /api/leads/export
Content-Type: application/json

{
  "leads": [...],
  "schoolName": "Example School"
}
```

## Configuration

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable these APIs:
   - Places API (New)
   - Geocoding API
4. Create an API key under "Credentials"
5. Add the key to your `.env.local`

### Search Types

| Type | Description |
|------|-------------|
| `catering` | Catering companies, food catering, meal prep catering |
| `pizza_diner` | Pizza restaurants, local diners |
| `meal_prep` | Meal prep services, meal delivery |
| `custom` | Use your own search terms |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── leads/
│   │       ├── generate/route.ts   # Lead generation endpoint
│   │       └── export/route.ts     # Excel export endpoint
│   ├── page.tsx                    # Main UI
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── lead-generator-form.tsx
│   └── leads-table.tsx
├── services/
│   ├── google-places.ts            # Google Places API integration
│   ├── chain-detector.ts           # Chain/franchise detection
│   ├── website-scraper.ts          # Email/contact extraction
│   └── lead-generator.ts           # Main orchestration
└── lib/
    ├── prisma.ts                   # Database client
    └── utils.ts
```

## Future Roadmap

- [ ] HubSpot integration (auto-trigger, sync leads)
- [ ] Yelp API integration
- [ ] Google Dorking (Facebook/Instagram search)
- [ ] Lead scoring and ranking
- [ ] Saved searches / history
- [ ] Team collaboration features

## License

Private - Ordo Inc.
