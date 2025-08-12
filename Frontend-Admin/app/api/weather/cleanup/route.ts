import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldWeatherData } from '@/lib/weather-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retainDays = 7 } = body;
    
    // Validate retainDays parameter
    if (typeof retainDays !== 'number' || retainDays < 1 || retainDays > 30) {
      return NextResponse.json(
        { error: 'Invalid retainDays parameter. Must be between 1 and 30.' },
        { status: 400 }
      );
    }
    
    const deletedCount = await cleanupOldWeatherData(retainDays);
    
    return NextResponse.json({
      success: true,
      deletedRecords: deletedCount,
      retainDays: retainDays,
      message: `Successfully cleaned up ${deletedCount} old weather records`
    });
  } catch (error) {
    console.error('Error in weather cleanup API:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup weather data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Use POST method to trigger cleanup' },
    { status: 405 }
  );
}
