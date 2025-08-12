"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cloud, Activity, Mic } from "lucide-react"
import Link from "next/link"

interface WeatherAnalysis {
  temperature: string;
  description: string;
  alert_level: number;
  timestamp: string;
  location: string;
}

export function StatusCards() {
  const [weatherData, setWeatherData] = useState<WeatherAnalysis>({
    temperature: '28°C',
    description: 'Partly cloudy, no rainfall',
    alert_level: 1,
    timestamp: new Date().toISOString(),
    location: 'Iloilo City'
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchWeatherData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weather/analysis/current');
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      } else {
        console.warn('Failed to fetch weather data from backend');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data immediately
    fetchWeatherData();
    
    // Set up interval to fetch every hour (3600000 ms)
    const interval = setInterval(fetchWeatherData, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  const getAlertLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { text: 'Normal', className: 'bg-green-100 text-green-800' };
      case 2:
        return { text: 'Alert Level 2', className: 'bg-yellow-100 text-yellow-800' };
      case 3:
        return { text: 'Alert Level 3', className: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Normal', className: 'bg-green-100 text-green-800' };
    }
  };

  const alertInfo = getAlertLevelInfo(weatherData.alert_level);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <Card className="border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Weather Summary</CardTitle>
          <Cloud className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {isLoading ? '...' : weatherData.temperature}
          </div>
          <p className="text-xs text-blue-600">
            {isLoading ? 'Loading...' : weatherData.description}
          </p>
          <Badge className={`mt-2 ${alertInfo.className}`}>
            {alertInfo.text}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Seismic Activity</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">Mag 3.2</div>
          <p className="text-xs text-blue-600">Last recorded 2 hours ago</p>
          <Badge className="mt-2 bg-green-100 text-green-800">Normal</Badge>
        </CardContent>
      </Card>

      <Card className="border-blue-200 w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Voice Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/assistant">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Mic className="h-4 w-4 mr-2" /> C.L.I.M.A
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
