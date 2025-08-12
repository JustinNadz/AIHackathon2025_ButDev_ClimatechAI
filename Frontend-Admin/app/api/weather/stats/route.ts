import { NextRequest, NextResponse } from 'next/server';
import { getWeatherStats, getCurrentAlertSummary } from '@/lib/weather-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam, 10) : 24;
    
    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 168) { // Max 1 week
      return NextResponse.json(
        { error: 'Invalid hours parameter. Must be between 1 and 168.' },
        { status: 400 }
      );
    }
    
    const [weatherStats, alertSummary] = await Promise.all([
      getWeatherStats(hours),
      getCurrentAlertSummary()
    ]);
    
    return NextResponse.json({
      stats: weatherStats,
      currentAlert: alertSummary,
      timeframe: `${hours} hours`
    });
  } catch (error) {
    console.error('Error in weather stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
