import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Google Weather API configuration
const GOOGLE_WEATHER_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ILOILO_COORDS = {
  latitude: 10.720321,
  longitude: 122.562019
};

interface GoogleWeatherResponse {
  currentTime: string;
  timeZone: {
    id: string;
  };
  isDaytime: boolean;
  weatherCondition: {
    iconBaseUri: string;
    description: {
      text: string;
      languageCode: string;
    };
    type: string;
  };
  temperature: {
    degrees: number;
    unit: string;
  };
  feelsLikeTemperature: {
    degrees: number;
    unit: string;
  };
  dewPoint: {
    degrees: number;
    unit: string;
  };
  relativeHumidity: number;
  uvIndex: number;
  precipitation: {
    probability: {
      percent: number;
      type: string;
    };
    snowQpf: {
      quantity: number;
      unit: string;
    };
    qpf: {
      quantity: number;
      unit: string;
    };
  };
  thunderstormProbability: number;
  airPressure: {
    meanSeaLevelMillibars: number;
  };
}

interface WeatherAnalysis {
  temperature: string;
  description: string;
  alert_level: number;
  timestamp: string;
  location: string;
  raw_data?: GoogleWeatherResponse;
}

function determineAlertLevel(weatherData: GoogleWeatherResponse): number {
  const temp = weatherData.temperature.degrees;
  const humidity = weatherData.relativeHumidity;
  const precipitationProb = weatherData.precipitation.probability.percent;
  const thunderstormProb = weatherData.thunderstormProbability;
  
  // Alert Level 3 - High Risk
  if (temp >= 35 || temp <= 15 || precipitationProb >= 70 || thunderstormProb >= 50) {
    return 3;
  }
  
  // Alert Level 2 - Moderate Risk
  if (temp >= 32 || temp <= 18 || precipitationProb >= 40 || thunderstormProb >= 20 || humidity >= 85) {
    return 2;
  }
  
  // Alert Level 1 - Normal
  return 1;
}

async function fetchGoogleWeatherData(): Promise<GoogleWeatherResponse> {
  const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_WEATHER_API_KEY}&location.latitude=${ILOILO_COORDS.latitude}&location.longitude=${ILOILO_COORDS.longitude}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Weather API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function saveWeatherDataToDatabase(analysisData: WeatherAnalysis) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('weather_data');
    
    // Insert the new weather data
    await collection.insertOne({
      ...analysisData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Keep only the last 1000 records to prevent database bloat
    const totalRecords = await collection.countDocuments();
    if (totalRecords > 1000) {
      const oldRecords = await collection.find({})
        .sort({ createdAt: 1 })
        .limit(totalRecords - 1000)
        .toArray();
      
      if (oldRecords.length > 0) {
        const oldIds = oldRecords.map(record => record._id);
        await collection.deleteMany({ _id: { $in: oldIds } });
      }
    }
    
    console.log('Weather data saved to database successfully');
  } catch (error) {
    console.error('Error saving weather data to database:', error);
    // Don't throw error to avoid breaking the API response
  }
}

async function getLatestWeatherFromDatabase(): Promise<WeatherAnalysis | null> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('weather_data');
    
    const latestRecord = await collection.findOne(
      {},
      { sort: { createdAt: -1 } }
    );
    
    if (latestRecord) {
      // Remove MongoDB _id and internal fields
      const { _id, createdAt, updatedAt, ...weatherData } = latestRecord;
      return weatherData as WeatherAnalysis;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching latest weather from database:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have a recent record in the database (within last 30 minutes)
    const latestWeatherData = await getLatestWeatherFromDatabase();
    const now = new Date();
    
    if (latestWeatherData) {
      const lastUpdate = new Date(latestWeatherData.timestamp);
      const timeDifferenceMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      
      // If we have data from within the last 30 minutes, return it
      if (timeDifferenceMinutes < 30) {
        return NextResponse.json(latestWeatherData);
      }
    }
    
    // Fetch fresh data from Google Weather API
    console.log('Fetching fresh weather data from Google API...');
    const googleWeatherData = await fetchGoogleWeatherData();
    
    // Process the data into our format
    const analysisData: WeatherAnalysis = {
      temperature: `${googleWeatherData.temperature.degrees}°C`,
      description: googleWeatherData.weatherCondition.description.text,
      alert_level: determineAlertLevel(googleWeatherData),
      timestamp: new Date().toISOString(),
      location: 'Iloilo City',
      raw_data: googleWeatherData
    };
    
    // Save to database asynchronously
    saveWeatherDataToDatabase(analysisData);
    
    // Return the processed data
    return NextResponse.json(analysisData);
    
  } catch (error) {
    console.error('Error in weather analysis API:', error);
    
    // Try to return cached data if available
    const cachedData = await getLatestWeatherFromDatabase();
    if (cachedData) {
      console.log('Returning cached weather data due to API error');
      return NextResponse.json(cachedData);
    }
    
    // Return fallback data if everything fails
    const fallbackData: WeatherAnalysis = {
      temperature: '28°C',
      description: 'Weather data temporarily unavailable',
      alert_level: 1,
      timestamp: new Date().toISOString(),
      location: 'Iloilo City'
    };
    
    return NextResponse.json(fallbackData, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
