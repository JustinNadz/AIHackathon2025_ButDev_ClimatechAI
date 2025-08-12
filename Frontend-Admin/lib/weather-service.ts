// Weather service utility functions
import { connectToDatabase } from '@/lib/mongodb';

export interface WeatherData {
  id?: string;
  temperature: string;
  description: string;
  alert_level: number;
  timestamp: string;
  location: string;
  raw_data?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WeatherStats {
  averageTemp: number;
  maxTemp: number;
  minTemp: number;
  mostCommonCondition: string;
  alertLevelDistribution: {
    level1: number;
    level2: number;
    level3: number;
  };
}

/**
 * Get weather data history from the database
 */
export async function getWeatherHistory(limit: number = 24): Promise<WeatherData[]> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('weather_data');
    
    const weatherHistory = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return weatherHistory.map(record => ({
      id: record._id?.toString(),
      temperature: record.temperature,
      description: record.description,
      alert_level: record.alert_level,
      timestamp: record.timestamp,
      location: record.location,
      raw_data: record.raw_data,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching weather history:', error);
    return [];
  }
}

/**
 * Get weather statistics from historical data
 */
export async function getWeatherStats(hours: number = 24): Promise<WeatherStats | null> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('weather_data');
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    const weatherData = await collection
      .find({ createdAt: { $gte: cutoffTime } })
      .toArray();
    
    if (weatherData.length === 0) {
      return null;
    }
    
    // Extract temperature values (assuming format like "28°C")
    const temperatures = weatherData
      .map(record => parseFloat(record.temperature.replace('°C', '')))
      .filter(temp => !isNaN(temp));
    
    if (temperatures.length === 0) {
      return null;
    }
    
    // Calculate temperature statistics
    const averageTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);
    
    // Find most common weather condition
    const conditionCounts = weatherData.reduce((acc, record) => {
      const condition = record.description;
      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonCondition = Object.entries(conditionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
    
    // Calculate alert level distribution
    const alertLevelCounts = weatherData.reduce((acc, record) => {
      const level = record.alert_level;
      if (level === 1) acc.level1++;
      else if (level === 2) acc.level2++;
      else if (level === 3) acc.level3++;
      return acc;
    }, { level1: 0, level2: 0, level3: 0 });
    
    return {
      averageTemp: Math.round(averageTemp * 10) / 10,
      maxTemp,
      minTemp,
      mostCommonCondition,
      alertLevelDistribution: alertLevelCounts
    };
  } catch (error) {
    console.error('Error calculating weather stats:', error);
    return null;
  }
}

/**
 * Clean up old weather data to prevent database bloat
 */
export async function cleanupOldWeatherData(retainDays: number = 7): Promise<number> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('weather_data');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retainDays);
    
    const result = await collection.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old weather records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old weather data:', error);
    return 0;
  }
}

/**
 * Get current weather alert level summary
 */
export async function getCurrentAlertSummary(): Promise<{
  currentLevel: number;
  levelDescription: string;
  lastUpdated: string;
} | null> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('weather_data');
    
    const latestRecord = await collection.findOne(
      {},
      { sort: { createdAt: -1 } }
    );
    
    if (!latestRecord) {
      return null;
    }
    
    const getLevelDescription = (level: number): string => {
      switch (level) {
        case 1:
          return 'Normal weather conditions';
        case 2:
          return 'Moderate weather advisory';
        case 3:
          return 'High weather warning';
        default:
          return 'Unknown alert level';
      }
    };
    
    return {
      currentLevel: latestRecord.alert_level,
      levelDescription: getLevelDescription(latestRecord.alert_level),
      lastUpdated: latestRecord.timestamp
    };
  } catch (error) {
    console.error('Error getting current alert summary:', error);
    return null;
  }
}
