# 🔗 Backend Integration Guide

This document explains how your ClimaTechUser frontend is now connected to your Python Flask backend.

## ✅ **What's Been Connected:**

### 1. **API Service Layer** (`/lib/api.ts`)
- **Enhanced Assistant API**: Direct connection to `/api/assistant/enhanced` endpoint
- **All Data APIs**: Weather, flood, landslide, and seismic data endpoints
- **Type Safety**: Full TypeScript interfaces for all API responses
- **Error Handling**: Comprehensive error management

### 2. **Chat Integration** (`/components/draggable-chat-panel.tsx`)
- **Primary Model**: Uses `google/gemma-3-27b-it:free` (your base model)
- **Fallback**: RAG system as backup support
- **Location Aware**: Sends GPS coordinates for location-specific advice
- **Real-time**: Live hazard data integration

### 3. **React Hooks** (`/hooks/useClimateAPI.ts`)
- **Easy Integration**: Simple hooks for any component
- **Loading States**: Built-in loading and error management
- **Reusable**: Multiple specialized hooks for different use cases

## 🚀 **How to Use:**

### **Option 1: Direct API Calls**
```typescript
import { callEnhancedAssistant } from '@/lib/api'

const response = await callEnhancedAssistant({
  lat: 14.5995,
  lng: 120.9842,
  question: "What climate risks should I know about?"
})

console.log(response.response) // AI advice
console.log(response.model_used) // "google/gemma-3-27b-it:free"
console.log(response.hazards) // Real-time hazard data
```

### **Option 2: React Hooks (Recommended)**
```typescript
import { useClimateAPI } from '@/hooks/useClimateAPI'

function MyComponent() {
  const { askQuestion, isLoading, error } = useClimateAPI()
  
  const handleClick = async () => {
    const response = await askQuestion(
      "How should I prepare for typhoon season?",
      { lat: 14.5995, lng: 120.9842 }
    )
    // Use response.response for the AI advice
  }
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <button onClick={handleClick}>Get Climate Advice</button>
}
```

### **Option 3: Location-Based Analysis**
```typescript
import { useLocationClimate } from '@/hooks/useClimateAPI'

function LocationAnalysis() {
  const { analyzeLocation, isLoading } = useLocationClimate()
  
  const analyze = async (lat: number, lng: number) => {
    const result = await analyzeLocation(lat, lng)
    if (result) {
      console.log(result.climateAdvice) // AI analysis
      console.log(result.hazards) // Risk data
      console.log(result.modelUsed) // Model info
    }
  }
  
  return (
    <button onClick={() => analyze(14.5995, 120.9842)}>
      Analyze Location
    </button>
  )
}
```

## 🔧 **Configuration:**

### **Environment Variables** (`.env`)
```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:5000
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### **Backend URL**
The frontend automatically connects to your backend at:
- **Local Development**: `http://127.0.0.1:5000`
- **Production**: Set `NEXT_PUBLIC_BACKEND_URL` to your production URL

## 📡 **Available Endpoints:**

### **Primary: Enhanced Assistant**
```
POST /api/assistant/enhanced
```
**Features:**
- ✅ Uses `google/gemma-3-27b-it:free` as primary model
- ✅ RAG system as backup
- ✅ Real-time hazard data integration
- ✅ Location-specific advice

**Request:**
```json
{
  "lat": 14.5995,
  "lng": 120.9842,
  "question": "What are the climate risks here?",
  "use_rag_fallback": true
}
```

**Response:**
```json
{
  "location": {"lat": 14.5995, "lng": 120.9842},
  "question": "What are the climate risks here?",
  "hazards": {
    "flood_risk": 2.1,
    "landslide_risk": 1.8,
    "recent_earthquakes": 2,
    "weather": {...}
  },
  "response": "Based on your location in Manila...",
  "model_used": "google/gemma-3-27b-it:free",
  "context_provided": [...]
}
```

### **Data Endpoints:**
- `GET /api/weather-data` - Weather data
- `GET /api/flood-data` - Flood risk maps
- `GET /api/landslide-data` - Landslide risk maps
- `GET /api/seismic-data` - Earthquake data

## 🎯 **Current Implementation:**

### **Chat Panel** (`draggable-chat-panel.tsx`)
- ✅ **Connected**: Uses enhanced assistant API
- ✅ **Model Info**: Shows which AI model responded
- ✅ **Location Aware**: Automatically includes GPS coordinates
- ✅ **Error Handling**: Graceful fallbacks

### **API Service** (`lib/api.ts`)
- ✅ **TypeScript**: Full type safety
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Modular**: Easy to extend and maintain

### **React Hooks** (`hooks/useClimateAPI.ts`)
- ✅ **Loading States**: Built-in loading management
- ✅ **Error Handling**: Automatic error catching
- ✅ **Reusable**: Multiple specialized hooks

## 🔄 **How It Works:**

1. **User asks question** in chat panel
2. **Frontend sends request** to `/api/assistant/enhanced`
3. **Backend processes** with `google/gemma-3-27b-it:free` model
4. **Real-time hazard data** is included in the response
5. **AI generates advice** based on location and hazards
6. **Response displayed** with model information

## 🛠 **Development Workflow:**

### **Start Backend:**
```bash
cd backend
conda activate ai  # or your Python environment
python app.py
```

### **Start Frontend:**
```bash
cd ClimaTechUser
npm run dev
# or
yarn dev
# or
pnpm dev
```

### **Test Connection:**
1. Open `http://localhost:3000`
2. Click on map to select location
3. Open chat panel (floating button)
4. Ask: "What climate risks should I know about?"
5. You should see response from `google/gemma-3-27b-it:free`

## 🎉 **Success Indicators:**

When everything is working, you'll see:
- ✅ Chat responses with "*Powered by 🤖 Enhanced AI*"
- ✅ Location-specific climate advice
- ✅ Real-time hazard data in responses
- ✅ No connection errors in browser console

## 🚨 **Troubleshooting:**

### **Backend Not Running:**
```
Error: Failed to fetch
```
**Solution:** Start your backend server (`python app.py`)

### **API Key Issues:**
```
Error: No OpenRouter API key found
```
**Solution:** Check your backend `.env` file has `OPENROUTER_API_KEY`

### **CORS Issues:**
```
Error: CORS policy
```
**Solution:** Backend already configured for `localhost:3000`

## 📱 **Ready for Production:**

Your frontend is now fully connected and ready for:
- ✅ **Local Development**: Works out of the box
- ✅ **Production Deployment**: Just update `NEXT_PUBLIC_BACKEND_URL`
- ✅ **Scaling**: Modular architecture for easy expansion
- ✅ **Maintenance**: Clean separation of concerns

---

**🎯 Your ClimaTechUser frontend is now fully connected to your backend with the enhanced `google/gemma-3-27b-it:free` AI model!** 