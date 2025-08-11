# ClimaTechUser (Frontend)

A minimal React + Vite app showing a Google Map with a draggable, snap-point AI chat panel overlay.

## Prerequisites
- Node.js 18+
- A Google Maps JavaScript API key
- Backend running at `http://localhost:5000` (default) or set `VITE_BACKEND_URL`

## Setup

1. Copy `.env.example` to `.env` and fill your keys:

```
VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY
VITE_BACKEND_URL=http://localhost:5000
```

2. Install deps and run:

```
npm install
npm run dev
```

Open the printed local URL in your browser. Drag the chat panel from the bottom to snap between compact, medium, and expanded modes.

## Build

```
npm run build
npm run preview
``` 