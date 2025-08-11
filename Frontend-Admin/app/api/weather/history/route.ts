import { NextRequest, NextResponse } from 'next/server';
import { getWeatherHistory } from '@/lib/weather-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 24;
    
    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 168) { // Max 1 week of hourly data
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 168.' },
        { status: 400 }
      );
    }
    
    const weatherHistory = await getWeatherHistory(limit);
    
    return NextResponse.json({
      data: weatherHistory,
      count: weatherHistory.length,
      limit: limit
    });
  } catch (error) {
    console.error('Error in weather history API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
