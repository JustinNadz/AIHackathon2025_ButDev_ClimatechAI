# Pivot Frontend

A simple React frontend with a split layout featuring Google Maps and AI analysis capabilities.

## Features

- **Split Layout**: Google Maps on the left (larger), AI analysis panel on the right (smaller)
- **Google Maps Integration**: Interactive map with API key configuration
- **AI Analysis Panel**: Reserved space for AI-generated map analysis (empty for now)
- **Minimal Dependencies**: Only essential React packages

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env.local`
   - Add your Google Maps API key:
     ```
     REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     ```

3. **Get Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select existing one
   - Enable Maps JavaScript API
   - Create credentials (API Key)
   - Add the key to your `.env.local` file

4. **Start Development Server**
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── components/
│   ├── MapComponent.js         # Google Maps integration
│   ├── AISummaryPanel.js       # AI analysis panel
│   └── AISummaryPanel.css      # AI panel styles
├── App.js                      # Main application component
├── App.css                     # Main app styles
├── index.js                    # Application entry point
└── index.css                   # Global styles
```

## Layout

- **Left Section (2/3 width)**: Google Maps component
- **Right Section (1/3 width)**: AI analysis panel (currently empty)

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Notes

- The AI analysis panel is currently empty and ready for future implementation
- The map is centered on Manila, Philippines by default
- Uses a 2:1 split layout (map takes 2/3, AI panel takes 1/3)
