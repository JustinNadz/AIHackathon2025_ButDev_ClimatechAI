export type WeatherCondition =
  | "Clear Skies"
  | "Cloudy Skies with Rainshowers"
  | "Monsoon Rains"
  | "Partly Cloudy Skies"
  | "Partly Cloudy Skies With Isolated Rainshowers"
  | "Stormy"
  | "Cloudy Skies"
  | "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms"
  | "Light Rains"
  | "Cloudy Skies with Rainshowers and Thunderstorms"
  | "Occasional Rains"
  | "Rains with Gusty Winds"

export type TemperatureRange = [number, number]; // [min, max] in °C

export const temperatureRanges: Record<WeatherCondition, TemperatureRange> = {
  "Clear Skies": [28, 35],
  "Cloudy Skies with Rainshowers": [23, 29],
  "Monsoon Rains": [22, 27],
  "Partly Cloudy Skies": [26, 33],
  "Partly Cloudy Skies With Isolated Rainshowers": [25, 31],
  "Stormy": [21, 26],
  "Cloudy Skies": [24, 30],
  "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms": [24, 30],
  "Light Rains": [23, 29],
  "Cloudy Skies with Rainshowers and Thunderstorms": [23, 29],
  "Occasional Rains": [24, 30],
  "Rains with Gusty Winds": [22, 28],
};

export const weatherIcons: Record<WeatherCondition, string> = {
  "Clear Skies": "/Clear Skies.png",
  "Cloudy Skies with Rainshowers": "/Cloudy Skies with Rain showers.png",
  "Cloudy Skies with Rainshowers and Thunderstorms": "/Cloudy Skies with Rainshowers and Thunderstorms.png",
  "Cloudy Skies": "/Cloudy Skies.png",
  "Monsoon Rains": "/Monsoon Rains.png",
  "Occasional Rains": "/Occasional Rain.png",
  "Partly Cloudy Skies": "/Partly Cloudy Skies.png",
  "Partly Cloudy Skies With Isolated Rainshowers": "/Partly Cloud Skies with isolated rainshowers.png",
  "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms": "/Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms.png",
  "Rains with Gusty Winds": "/Rains with Gusty Winds.png",
  "Stormy": "/Stormy.png",
  "Light Rains": "/Light Rains.png",
};

export const allWeatherConditions: WeatherCondition[] = [
  "Clear Skies",
  "Cloudy Skies with Rainshowers",
  "Monsoon Rains",
  "Partly Cloudy Skies",
  "Partly Cloudy Skies With Isolated Rainshowers",
  "Stormy",
  "Cloudy Skies",
  "Partly Cloudy Skies to at times cloudy with Rainshowers and Thunderstorms",
  "Light Rains",
  "Cloudy Skies with Rainshowers and Thunderstorms",
  "Occasional Rains",
  "Rains with Gusty Winds",
];

export function getTemperatureRange(condition: WeatherCondition): TemperatureRange {
  return temperatureRanges[condition];
}

export function getRandomTemperatureInRange(condition: WeatherCondition): number {
  const [min, max] = getTemperatureRange(condition);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomWeatherCondition(): WeatherCondition {
  return allWeatherConditions[Math.floor(Math.random() * allWeatherConditions.length)];
}

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export function generateWeatherData(): WeatherData {
  const condition = getRandomWeatherCondition();
  const temperature = getRandomTemperatureInRange(condition);
  
  return {
    condition,
    temperature,
    humidity: Math.floor(Math.random() * 40) + 50, // 50-90%
    windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    icon: weatherIcons[condition],
  };
} 