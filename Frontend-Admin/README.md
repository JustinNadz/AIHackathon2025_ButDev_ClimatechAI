# ClimaTech-AI Frontend (Weather API Integration)

This Next.js app exposes Weather API routes backed by MongoDB and Google Weather API, plus a simple UI status card.

## Setup

1. Copy `.env.local.example` to `.env.local` and set values:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key
MONGODB_URI=mongodb://localhost:27017/climatech-ai
MONGODB_DATABASE=climatech-ai
```

2. Install and run:

```
npm install
npm run dev
```

App: `http://localhost:3000`

## API Endpoints

- GET `/api/weather/analysis/current`
- GET `/api/weather/history?limit=24`
- GET `/api/weather/stats?hours=24`
- POST `/api/weather/cleanup` with `{ "retainDays": 7 }`

## Testing

- `npm run test:weather` (ensure `npm run dev` is running)

## Notes

- Data cached for 30 minutes using MongoDB records
- Automatic retention to keep only the last ~1000 records


