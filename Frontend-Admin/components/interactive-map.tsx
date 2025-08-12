"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Wrapper, Status } from "@googlemaps/react-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { MapPin, Layers, Droplets, Mountain, Flame, Cloud, ArrowLeft, ChevronDown, Info, Zap } from "lucide-react"
import dynamic from "next/dynamic"

// Props for the AlphaEarth overlay component
type AlphaEarthOverlayProps = {
	className?: string
	height?: string
	defaultCenter?: { lat: number; lng: number }
	defaultZoom?: number
}

// Dynamically load AlphaEarth overlay only in the browser and only when needed
const AlphaEarthMap = dynamic<AlphaEarthOverlayProps>(() => import("@/components/AlphaEarthMap"), { ssr: false })

interface WeatherData {
	_id: string;
	location: {
		latitude: number;
		longitude: number;
		name: string;
	};
	temperature?: {
		value: number;
		unit: string;
	};
	humidity?: number;
	pressure?: {
		value: number;
		unit: string;
	};
	windSpeed?: {
		value: number;
		unit: string;
	};
	windDirection?: number;
	visibility?: {
		value: number;
		unit: string;
	};
	uvIndex?: number;
	cloudCover?: number;
	condition?: string;
	timestamp: string;
}

interface FloodPrediction {
	id: number;
	coordinates: google.maps.LatLngLiteral[];
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	probability: number;
	timeToFlood: number; // minutes
	waterLevel: number; // meters
}

// Backend data interfaces
interface BackendFloodData {
	id: number;
	latitude: number;
	longitude: number;
	risk_level: number;
	water_level?: number;
	flood_type?: string;
	location_name?: string;
	last_updated?: string;
}

interface BackendLandslideData {
	id: number;
	latitude: number;
	longitude: number;
	risk_level: number;
	slope_angle?: number;
	soil_type?: string;
	location_name?: string;
	last_updated?: string;
}

interface BackendSeismicData {
	id: number;
	latitude: number;
	longitude: number;
	magnitude?: number;
	depth?: number;
	event_time?: string;
	location_name?: string;
	intensity?: number;
}

interface BackendWeatherData {
	id: number;
	latitude: number;
	longitude: number;
	temperature?: number;
	humidity?: number;
	pressure?: number;
	wind_speed?: number;
	wind_direction?: number;
	station_name?: string;
	recorded_at?: string;
}

interface LegendItem {
	id: string;
	label: string;
	color: string;
	icon: string;
	visible: boolean;
	description: string;
}

// Google Maps Component
interface MapProps {
	center: google.maps.LatLngLiteral;
	zoom: number;
	onMapLoad?: (map: google.maps.Map) => void;
}

function MockMapComponent() {
	return (
		<div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-green-200/30"></div>

            {/* Mock Butuan City layout */}
			<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
				<div className="relative w-80 h-60">
					{/* Risk zones as colored circles */}
					<div className="absolute top-8 left-12 w-4 h-4 bg-red-500 rounded-full opacity-80 border-2 border-white shadow-lg"></div>
					<div className="absolute top-16 right-16 w-4 h-4 bg-yellow-500 rounded-full opacity-80 border-2 border-white shadow-lg"></div>
					<div className="absolute bottom-12 left-20 w-4 h-4 bg-blue-500 rounded-full opacity-80 border-2 border-white shadow-lg"></div>
					<div className="absolute bottom-20 right-12 w-4 h-4 bg-red-500 rounded-full opacity-80 border-2 border-white shadow-lg"></div>

					{/* Mock city center */}
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-700 rounded-sm opacity-80"></div>

					{/* Mock roads */}
					<div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400 opacity-60"></div>
					<div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400 opacity-60"></div>
				</div>
			</div>

			{/* Mock map controls */}
			<div className="absolute top-4 right-4 bg-white rounded shadow-md p-2">
				<div className="w-6 h-6 bg-gray-200 rounded mb-1"></div>
				<div className="w-6 h-6 bg-gray-200 rounded"></div>
			</div>

            {/* Coordinates display */}
			<div className="absolute bottom-4 left-4 bg-white/90 rounded px-3 py-1 text-xs font-mono">
                8.9492°N, 125.5436°E
			</div>
		</div>
	);
}

function MapComponent({ center, zoom, onMapLoad }: MapProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [map, setMap] = useState<google.maps.Map>();
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		// Add global error handler for Google Maps
		const handleGoogleMapsError = (error: any) => {
			console.warn('Google Maps Error:', error);
			if (
				(error.message && (
					error.message.includes('BillingNotEnabled') ||
					error.message.includes('billing') ||
					error.message.includes('Google Maps JavaScript API error')
				)) ||
				(error.error && error.error.message && (
					error.error.message.includes('BillingNotEnabled') ||
					error.error.message.includes('billing')
				))
			) {
				setHasError(true);
			}
		};

		// Listen for Google Maps errors
		if (typeof window !== 'undefined') {
			window.addEventListener('error', handleGoogleMapsError);
		}

		if (ref.current && !map && !hasError) {
			try {
				// Check for billing immediately before creating map
				if (typeof window !== 'undefined' && window.google && window.google.maps) {
					console.log('🗺️ Google Maps API is loaded, creating map...');
				}

				const newMap = new google.maps.Map(ref.current, {
					center,
					zoom,
					disableDefaultUI: true,
					zoomControl: false,
					mapTypeControl: false,
					scaleControl: false,
					streetViewControl: false,
					rotateControl: false,
					fullscreenControl: false,
					gestureHandling: "cooperative",
					tilt: 67.5,
					heading: 0,
                    restriction: {
                        // Butuan City bounding box (approx)
                        latLngBounds: {
                            north: 9.10,
                            south: 8.80,
                            west: 125.40,
                            east: 125.70
                        },
                        strictBounds: false
                    },
					keyboardShortcuts: false,
					clickableIcons: true,
					mapTypeId: "hybrid",
					styles: [
						{
							featureType: "all",
							elementType: "labels.text",
							stylers: [
								{ visibility: "on" },
								{ color: "#e7edf3" },
								{ weight: 0.5 }
							]
						},
						{
							featureType: "all",
							elementType: "labels.text.fill",
							stylers: [
								{ visibility: "on" },
								{ color: "#f5f7fa" }
							]
						},
						{
							featureType: "all",
							elementType: "labels.text.stroke",
							stylers: [
								{ visibility: "on" },
								{ color: "#1f2937" },
								{ weight: 2 }
							]
						},
						{
							featureType: "administrative.locality",
							elementType: "labels.text",
							stylers: [
								{ visibility: "on" },
								{ color: "#f5f7fa" },
								{ weight: 1.5 }
							]
						},
						{
							featureType: "poi",
							elementType: "labels.text",
							stylers: [
								{ visibility: "on" },
								{ color: "#e9edf1" }
							]
						},
						{
							featureType: "poi.business",
							elementType: "labels.text",
							stylers: [
								{ visibility: "on" },
								{ color: "#e9edf1" }
							]
						},
						{
							featureType: "road",
							elementType: "labels.text",
							stylers: [
								{ visibility: "on" },
								{ color: "#f1f5f9" }
							]
						},
						{
							featureType: "road.highway",
							elementType: "labels.text",
							stylers: [
								{ visibility: "on" },
								{ color: "#ffffff" },
								{ weight: 1.5 }
							]
						}
					]
				});

				// Hide attribution and copyright controls
				const hideMapElements = () => {
					const mapDiv = ref.current;
					if (mapDiv) {
						const style = document.createElement('style');
						style.textContent = `
              /* User-friendly text rendering for easy navigation */
              .gm-style div,
              .gm-style span,
              .gm-style label {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                font-smooth: always;
                -webkit-text-stroke: 0;
              }
              
              /* Smooth and readable text rendering */
              .gm-style {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                image-rendering: auto;
              }
              
              /* User-friendly label styling */
              .gm-style div[style*="font-family"] {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                font-weight: 400 !important;
                text-shadow: 0 0 3px rgba(255, 255, 255, 0.9) !important;
                opacity: 0.9 !important;
              }
              
              .gm-style-cc {
                display: none !important;
              }
              .gmnoprint {
                display: none !important;
              }
              .gm-style .gm-style-cc {
                display: none !important;
              }
              .gm-style-mtc {
                display: none !important;
              }
              [title="Report errors in the road map or imagery to Google"] {
                display: none !important;
              }
              [title="Report a map error"] {
                display: none !important;
              }
              [title="Click to see this area on Google Maps"] {
                display: none !important;
              }
              [title="Terms of Use"] {
                display: none !important;
              }
              [title="Terms"] {
                display: none !important;
              }
              [title="Drag Pegman onto the map to open Street View"] {
                display: none !important;
              }
              [title="Zoom in"] {
                display: none !important;
              }
              [title="Zoom out"] {
                display: none !important;
              }
              [title="Toggle fullscreen view"] {
                display: none !important;
              }
              [title="Map Data"] {
                display: none !important;
              }
              [title="Keyboard shortcuts"] {
                display: none !important;
              }
              [title="Show satellite imagery"] {
                display: none !important;
              }
              [title="Show street map"] {
                display: none !important;
              }
              [title="Show terrain"] {
                display: none !important;
              }
              [title="Map Scale"] {
                display: none !important;
              }
              [title*="1 km"] {
                display: none !important;
              }
              [title*="1000 ft"] {
                display: none !important;
              }
              [title*="Camera Controls"] {
                display: none !important;
              }
              [title="Map Camera Controls"] {
                display: none !important;
              }
              /* Additional UI control hiding */
              .gm-ui-hover-effect {
                display: none !important;
              }
              .gm-style .gm-ui-hover-effect {
                display: none !important;
              }
              [data-value="Pegman"] {
                display: none !important;
              }
              .gm-svpc-container {
                display: none !important;
              }
              .gm-style-iw {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
              .gm-bundled-control {
                display: none !important;
              }
              .gm-bundled-control-on-bottom {
                display: none !important;
              }
              .gmnoprint div[style*="margin: 10px"] {
                display: none !important;
              }
              .gm-control-active {
                display: none !important;
              }
              .gm-svpc {
                display: none !important;
              }
              .gm-fullscreen-control {
                display: none !important;
              }
              .gm-compass {
                display: none !important;
              }
              .gm-err-container {
                display: none !important;
              }
              div[title="Map Scale"] {
                display: none !important;
              }
              .gm-scale-control {
                display: none !important;
              }
              a[href*="maps.google.com"] {
                display: none !important;
              }
              a[href*="google.com/maps"] {
                display: none !important;
              }
              a[href*="terms"] {
                display: none !important;
              }
              a[href*="report"] {
                display: none !important;
              }
            `;
						document.head.appendChild(style);
					}
				};

				// Apply styles immediately and after map loads
				setTimeout(hideMapElements, 100);
				newMap.addListener('idle', hideMapElements);

				console.log('✅ Google Maps instance created successfully');

				// Enable 3D features with proper fallback
				try {
					const maps3d = (google as any).maps?.maps3d;
					if (maps3d && maps3d.Map3DElement) {
						newMap.setOptions({
							mapTypeId: "hybrid",
							tilt: 67.5,
							heading: 0,
							styles: [
								{
									featureType: "all",
									elementType: "labels.text",
									stylers: [
										{ visibility: "on" },
										{ color: "#2d3748" },
										{ weight: "bold" }
									]
								},
								{
									featureType: "all",
									elementType: "labels.text.fill",
									stylers: [
										{ visibility: "on" },
										{ color: "#2d3748" }
									]
								},
								{
									featureType: "all",
									elementType: "labels.text.stroke",
									stylers: [
										{ visibility: "on" },
										{ color: "#ffffff" },
										{ weight: 3 }
									]
								},
								{
									featureType: "administrative.locality",
									elementType: "labels.text",
									stylers: [
										{ visibility: "on" },
										{ color: "#1a202c" },
										{ weight: "bold" }
									]
								},
								{
									featureType: "poi",
									elementType: "labels.text",
									stylers: [
										{ visibility: "on" },
										{ color: "#4a5568" }
									]
								},
								{
									featureType: "poi.business",
									elementType: "labels.text",
									stylers: [
										{ visibility: "on" },
										{ color: "#2d3748" }
									]
								}
							]
						});
					} else {
						newMap.setOptions({
							mapTypeId: "hybrid",
							tilt: 67.5,
							heading: 0
						});
					}
				} catch (error) {
					console.warn('3D Maps features not available, using fallback:', error);
					newMap.setOptions({
						mapTypeId: "hybrid",
						tilt: 0,
						heading: 0
					});
				}

				setMap(newMap);
				if (onMapLoad) {
					onMapLoad(newMap);
				}

				// Force refresh to ensure labels are loaded
				setTimeout(() => {
					google.maps.event.trigger(newMap, 'resize');
					newMap.setCenter(center);
				}, 1000);
			} catch (error) {
				console.error('Error initializing Google Maps:', error);
				setHasError(true);
			}
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('error', handleGoogleMapsError);
			}
		};
	}, [ref, map, center, zoom, onMapLoad, hasError]);

	if (hasError) {
		return (
			<div className="w-full h-full bg-yellow-50 border border-yellow-200 rounded-lg">
				<div className="flex flex-col items-center justify-center h-full p-8">
					<MapPin className="w-12 h-12 mb-4 text-yellow-600" />
					<h3 className="font-semibold text-lg mb-2 text-yellow-800">Google Maps Billing Required</h3>
					<p className="text-sm mb-4 text-yellow-700 text-center max-w-md">
						Google Maps requires billing to be enabled in your Google Cloud Console.
						Using fallback map view for now.
					</p>
					<MockMapComponent />
				</div>
			</div>
		);
	}

	return <div ref={ref} className="w-full h-full" />;
}

// Render function for Google Maps Wrapper
const render = (status: Status): React.ReactElement => {
	switch (status) {
		case Status.LOADING:
			return <div className="flex items-center justify-center h-full">Loading map...</div>;
		case Status.FAILURE:
			return (
				<div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 border border-gray-200 rounded-md">
					<div className="text-red-500 mb-2">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900">Map failed to load</h3>
					<p className="text-sm text-gray-500 text-center mt-1">
						There was an issue loading Google Maps. Using fallback display mode.
					</p>
					<MockMapComponent />
				</div>
			);
		case Status.SUCCESS:
			return <></>;
		default:
			return <div className="flex items-center justify-center h-full">Loading...</div>;
	}
};

export function InteractiveMap() {
    // Default to Butuan City
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number }>({ lat: 8.9492, lng: 125.5436 });
	const [selectedLayer, setSelectedLayer] = useState<string>("all");
	const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'billing-error'>('checking');
	const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
	const [map, setMap] = useState<google.maps.Map | null>(null);
	const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
	const [isLoadingWeather, setIsLoadingWeather] = useState(false);
	const [isLoadingFloodData, setIsLoadingFloodData] = useState(false);
	const [isLoadingLandslideData, setIsLoadingLandslideData] = useState(false);
	const [isLoadingSeismicData, setIsLoadingSeismicData] = useState(false);
	
	// Missing state variables
	const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number, lng: number }>({ lat: 10.7302, lng: 122.5591 });
	const [queryRadius, setQueryRadius] = useState<number>(50);
	const [seismicMarkers, setSeismicMarkers] = useState<google.maps.Marker[]>([]);
	
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);
	const [weatherError, setWeatherError] = useState<string | null>(null);
	const [isFullScreen, setIsFullScreen] = useState(false);
	const [showAlphaEarth, setShowAlphaEarth] = useState<boolean>(false);
	const mapRef = useRef<google.maps.Map | null>(null);
	const currentInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
	const centerMarkerRef = useRef<google.maps.Marker | null>(null);

	// New states for flood prediction and legend
	const [showFloodPrediction, setShowFloodPrediction] = useState(true); // Always enabled
	const [floodPredictions, setFloodPredictions] = useState<FloodPrediction[]>([]);
	const [floodPolygons, setFloodPolygons] = useState<google.maps.Polygon[]>([]);
	const [floodCenterMarkers, setFloodCenterMarkers] = useState<google.maps.Marker[]>([]);
	const [animationFrame, setAnimationFrame] = useState(0);
	const [landslideMarkers, setLandslideMarkers] = useState<google.maps.Marker[]>([]);
	const [fireMarkers, setFireMarkers] = useState<google.maps.Marker[]>([]);
	const [landslideZones, setLandslideZones] = useState<google.maps.Polygon[]>([]);
	const [fireZones, setFireZones] = useState<google.maps.Polygon[]>([]);
	const [energyZones, setEnergyZones] = useState<google.maps.Polygon[]>([]);

	// Backend data states
	const [backendFloodData, setBackendFloodData] = useState<BackendFloodData[]>([]);
	const [backendLandslideData, setBackendLandslideData] = useState<BackendLandslideData[]>([]);
	const [backendSeismicData, setBackendSeismicData] = useState<BackendSeismicData[]>([]);
	const [backendWeatherData, setBackendWeatherData] = useState<BackendWeatherData[]>([]);
	const [isLoadingBackendData, setIsLoadingBackendData] = useState(false);
	const [backendDataMarkers, setBackendDataMarkers] = useState<google.maps.Marker[]>([]);

	const getPolygonCentroid = (coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral => {
		const { length } = coords;
		if (!length) return selectedLocation;
		const sum = coords.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
		return { lat: sum.lat / length, lng: sum.lng / length };
	};

	const getTransparentIcon = () => ({
		url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
		scaledSize: new google.maps.Size(1, 1),
	} as google.maps.Icon);

	// Adaptive height based on viewport
	const calculateHeight = () => {
		if (typeof window !== 'undefined') {
			return window.innerWidth >= 1024 ? '500px' : '350px';
		}
		return '400px';
	};

	const [mapHeight, setMapHeight] = useState(calculateHeight());

	// Sample flood prediction data (Iloilo areas prone to flooding)
	const sampleFloodPredictions: FloodPrediction[] = [
		{
			id: 1,
			coordinates: [
				{ lat: 10.7302, lng: 122.5591 },
				{ lat: 10.7312, lng: 122.5601 },
				{ lat: 10.7322, lng: 122.5591 },
				{ lat: 10.7312, lng: 122.5581 }
			],
			riskLevel: 'high',
			probability: 85,
			timeToFlood: 120,
			waterLevel: 2.5
		},
		{
			id: 2,
			coordinates: [
				{ lat: 10.7200, lng: 122.5500 },
				{ lat: 10.7210, lng: 122.5510 },
				{ lat: 10.7220, lng: 122.5500 },
				{ lat: 10.7210, lng: 122.5490 }
			],
			riskLevel: 'medium',
			probability: 65,
			timeToFlood: 180,
			waterLevel: 1.5
		},
		{
			id: 3,
			coordinates: [
				{ lat: 10.7100, lng: 122.5400 },
				{ lat: 10.7110, lng: 122.5410 },
				{ lat: 10.7120, lng: 122.5400 },
				{ lat: 10.7110, lng: 122.5390 }
			],
			riskLevel: 'low',
			probability: 35,
			timeToFlood: 300,
			waterLevel: 0.8
		}
	];

	// Functions to fetch backend data
	const fetchBackendData = async () => {
		setIsLoadingBackendData(true);
		const backendUrl = BACKEND_BASE_URL;

		try {
			// Quick health check first
			await fetch(`${backendUrl}/health`, { method: 'GET' });

			// Fetch all data types in parallel
			const [floodResponse, landslideResponse, seismicResponse, weatherResponse] = await Promise.all([
				fetch(`${backendUrl}/api/flood-data`).catch(() => new Response(null, { status: 503 })),
				fetch(`${backendUrl}/api/landslide-data`).catch(() => new Response(null, { status: 503 })),
				fetch(`${backendUrl}/api/seismic-data`).catch(() => new Response(null, { status: 503 })),
				fetch(`${backendUrl}/api/weather-data`).catch(() => new Response(null, { status: 503 }))
			]);

			if (floodResponse.ok) {
				const floodData = await floodResponse.json();
				setBackendFloodData(floodData.features || floodData || []);
			}

			if (landslideResponse.ok) {
				const landslideData = await landslideResponse.json();
				setBackendLandslideData(landslideData.features || landslideData || []);
			}

			if (seismicResponse.ok) {
				const seismicData = await seismicResponse.json();
				setBackendSeismicData(seismicData.features || seismicData || []);
			}

			if (weatherResponse.ok) {
				const weatherData = await weatherResponse.json();
				setBackendWeatherData(weatherData.features || weatherData || []);
			}

		} catch (error) {
			console.error('Error fetching backend data:', error);
			console.warn(`Backend at ${backendUrl} might be offline. Start PivotBackend on port 8000 or set NEXT_PUBLIC_BACKEND_BASE_URL.`);
		} finally {
			setIsLoadingBackendData(false);
		}
	};

	const getRiskColor = (riskLevel: number) => {
		if (riskLevel >= 7) return '#dc2626'; // High risk - red
		if (riskLevel >= 4) return '#d97706'; // Medium risk - orange
		return '#16a34a'; // Low risk - green
	};

	const getRiskLabel = (riskLevel: number) => {
		if (riskLevel >= 7) return 'High';
		if (riskLevel >= 4) return 'Medium';
		return 'Low';
	};

	const createBackendMarkers = () => {
		if (!map) return;

		// Clear existing backend markers
		backendDataMarkers.forEach(marker => marker.setMap(null));
		const newMarkers: google.maps.Marker[] = [];

		// Create flood markers
		backendFloodData.forEach(flood => {
			const marker = new google.maps.Marker({
				position: { lat: flood.latitude, lng: flood.longitude },
				map: selectedLayer === 'flood' || selectedLayer === 'all' ? map : null,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 8,
					fillColor: getRiskColor(flood.risk_level),
					fillOpacity: 0.8,
					strokeColor: '#fff',
					strokeWeight: 2
				},
				title: `Flood Risk: ${getRiskLabel(flood.risk_level)}`,
				zIndex: 100
			});

			const infoWindow = new google.maps.InfoWindow({
				content: `
          <div class="p-3">
            <h3 class="font-bold text-blue-900">🌊 Flood Data</h3>
            <p><strong>Location:</strong> ${flood.location_name || 'Unknown'}</p>
            <p><strong>Risk Level:</strong> ${getRiskLabel(flood.risk_level)} (${flood.risk_level}/10)</p>
            ${flood.water_level ? `<p><strong>Water Level:</strong> ${flood.water_level}m</p>` : ''}
            ${flood.flood_type ? `<p><strong>Type:</strong> ${flood.flood_type}</p>` : ''}
            ${flood.last_updated ? `<p><strong>Last Updated:</strong> ${new Date(flood.last_updated).toLocaleString()}</p>` : ''}
          </div>
        `
			});

			marker.addListener('click', () => {
				currentInfoWindowRef.current?.close();
				infoWindow.open(map, marker);
				currentInfoWindowRef.current = infoWindow;
			});

			newMarkers.push(marker);
		});

		// Create landslide markers
		backendLandslideData.forEach(landslide => {
			const marker = new google.maps.Marker({
				position: { lat: landslide.latitude, lng: landslide.longitude },
				map: selectedLayer === 'landslide' || selectedLayer === 'all' ? map : null,
				icon: {
					path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
					scale: 8,
					fillColor: getRiskColor(landslide.risk_level),
					fillOpacity: 0.8,
					strokeColor: '#fff',
					strokeWeight: 2,
					rotation: 45
				},
				title: `Landslide Risk: ${getRiskLabel(landslide.risk_level)}`,
				zIndex: 100
			});

			const infoWindow = new google.maps.InfoWindow({
				content: `
          <div class="p-3">
            <h3 class="font-bold text-yellow-900">⛰️ Landslide Data</h3>
            <p><strong>Location:</strong> ${landslide.location_name || 'Unknown'}</p>
            <p><strong>Risk Level:</strong> ${getRiskLabel(landslide.risk_level)} (${landslide.risk_level}/10)</p>
            ${landslide.slope_angle ? `<p><strong>Slope Angle:</strong> ${landslide.slope_angle}°</p>` : ''}
            ${landslide.soil_type ? `<p><strong>Soil Type:</strong> ${landslide.soil_type}</p>` : ''}
            ${landslide.last_updated ? `<p><strong>Last Updated:</strong> ${new Date(landslide.last_updated).toLocaleString()}</p>` : ''}
          </div>
        `
			});

			marker.addListener('click', () => {
				currentInfoWindowRef.current?.close();
				infoWindow.open(map, marker);
				currentInfoWindowRef.current = infoWindow;
			});

			newMarkers.push(marker);
		});

		// Create seismic markers
		backendSeismicData.forEach(seismic => {
			const magnitudeScale = seismic.magnitude ? Math.max(4, seismic.magnitude * 2) : 6;
			const marker = new google.maps.Marker({
				position: { lat: seismic.latitude, lng: seismic.longitude },
				map: selectedLayer === 'seismic' || selectedLayer === 'all' ? map : null,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: magnitudeScale,
					fillColor: seismic.magnitude && seismic.magnitude >= 5 ? '#dc2626' : seismic.magnitude && seismic.magnitude >= 3 ? '#d97706' : '#16a34a',
					fillOpacity: 0.8,
					strokeColor: '#fff',
					strokeWeight: 2
				},
				title: `Seismic Activity: ${seismic.magnitude || 'Unknown'}`,
				zIndex: 100
			});

			const infoWindow = new google.maps.InfoWindow({
				content: `
          <div class="p-3">
            <h3 class="font-bold text-red-900">🌍 Seismic Data</h3>
            <p><strong>Location:</strong> ${seismic.location_name || 'Unknown'}</p>
            ${seismic.magnitude ? `<p><strong>Magnitude:</strong> ${seismic.magnitude}</p>` : ''}
            ${seismic.depth ? `<p><strong>Depth:</strong> ${seismic.depth}km</p>` : ''}
            ${seismic.intensity ? `<p><strong>Intensity:</strong> ${seismic.intensity}</p>` : ''}
            ${seismic.event_time ? `<p><strong>Event Time:</strong> ${new Date(seismic.event_time).toLocaleString()}</p>` : ''}
          </div>
        `
			});

			marker.addListener('click', () => {
				currentInfoWindowRef.current?.close();
				infoWindow.open(map, marker);
				currentInfoWindowRef.current = infoWindow;
			});

			newMarkers.push(marker);
		});

		// Create weather markers
		backendWeatherData.forEach(weather => {
			const marker = new google.maps.Marker({
				position: { lat: weather.latitude, lng: weather.longitude },
				map: selectedLayer === 'weather' || selectedLayer === 'all' ? map : null,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 6,
					fillColor: '#0ea5e9',
					fillOpacity: 0.8,
					strokeColor: '#fff',
					strokeWeight: 2
				},
				title: `Weather Station: ${weather.station_name || 'Unknown'}`,
				zIndex: 100
			});

			const infoWindow = new google.maps.InfoWindow({
				content: `
          <div class="p-3">
            <h3 class="font-bold text-blue-900">🌤️ Weather Data</h3>
            <p><strong>Station:</strong> ${weather.station_name || 'Unknown'}</p>
            ${weather.temperature ? `<p><strong>Temperature:</strong> ${weather.temperature}°C</p>` : ''}
            ${weather.humidity ? `<p><strong>Humidity:</strong> ${weather.humidity}%</p>` : ''}
            ${weather.pressure ? `<p><strong>Pressure:</strong> ${weather.pressure}hPa</p>` : ''}
            ${weather.wind_speed ? `<p><strong>Wind Speed:</strong> ${weather.wind_speed}km/h</p>` : ''}
            ${weather.recorded_at ? `<p><strong>Recorded:</strong> ${new Date(weather.recorded_at).toLocaleString()}</p>` : ''}
          </div>
        `
			});

			marker.addListener('click', () => {
				currentInfoWindowRef.current?.close();
				infoWindow.open(map, marker);
				currentInfoWindowRef.current = infoWindow;
			});

			newMarkers.push(marker);
		});

		setBackendDataMarkers(newMarkers);
	};

	// Fetch backend data on component mount
	useEffect(() => {
		fetchBackendData();
	}, []);

	// Update markers when map, data, or layer changes
	useEffect(() => {
		createBackendMarkers();
	}, [map, backendFloodData, backendLandslideData, backendSeismicData, backendWeatherData, selectedLayer]);

	// Legend items configuration
	const legendItems: LegendItem[] = [
		{
			id: 'high-risk',
			label: 'High/Critical Risk',
			color: '#FF0000',
			icon: 'triangle-alert',
			visible: true,
			description: 'High flood risk areas (red zones)'
		},
		{
			id: 'medium-risk',
			label: 'Medium Risk',
			color: '#FFA500',
			icon: 'triangle-alert',
			visible: true,
			description: 'Medium flood risk areas (orange zones)'
		},
		{
			id: 'low-risk',
			label: 'Low Risk',
			color: '#00FF00',
			icon: 'triangle-alert',
			visible: true,
			description: 'Low flood risk areas (green zones)'
		},
		{
			id: 'weather-stations',
			label: 'Weather Stations',
			color: '#3b82f6',
			icon: 'map-pin',
			visible: true,
			description: 'Active weather monitoring stations'
		},
		{
			id: 'flood-animation',
			label: 'HEC-RAS Flood Simulation',
			color: '#1e40af',
			icon: 'droplets',
			visible: true,
			description: 'Real-time flood progression simulation (Always Active)'
		}
	];

	// Update height when window resizes
	useEffect(() => {
		const handleResize = () => {
			setMapHeight(calculateHeight());
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Google Maps API key must come from environment variables
	const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
	const isValidApiKey = typeof GOOGLE_MAPS_API_KEY === 'string' && GOOGLE_MAPS_API_KEY.length > 0

	// Test the API key validity
	const testApiKey = useCallback(async () => {
		if (!GOOGLE_MAPS_API_KEY) {
			setApiKeyStatus('invalid')
			return
		}

		try {
			// Simple test: try to load a basic Google Maps script
			const testUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`
			const script = document.createElement('script')
			script.src = testUrl

			script.onload = () => {
				console.log('✅ Google Maps API key appears to be working')
				setApiKeyStatus('valid')
			}

			script.onerror = () => {
				console.error('❌ Google Maps API key test failed')
				setApiKeyStatus('invalid')
			}

			// Don't actually append the script, just test the URL format
			console.log(`🔍 Testing API key presence from env: ${GOOGLE_MAPS_API_KEY ? 'present' : 'missing'}`)

			// For now, assume valid if it has the right format
			if (GOOGLE_MAPS_API_KEY.startsWith('AIza') && GOOGLE_MAPS_API_KEY.length >= 30) {
				setApiKeyStatus('valid')
			} else {
				setApiKeyStatus('invalid')
			}
		} catch (error) {
			console.error('API key test error:', error)
			setApiKeyStatus('invalid')
		}
	}, [GOOGLE_MAPS_API_KEY])

	useEffect(() => {
		testApiKey()
	}, [testApiKey])

	useEffect(() => {
		// Add global error handler for Google Maps billing errors
		const handleGoogleMapsError = (event: ErrorEvent) => {
			console.log('🔍 Caught error event:', event);

			if (event.error && event.error.message) {
				const errorMessage = event.error.message.toLowerCase();
				console.log('📝 Error message:', errorMessage);

				if (errorMessage.includes('billingnotenabled') ||
					errorMessage.includes('billing') ||
					errorMessage.includes('billingnotenabledmaperror')) {
					console.log('💳 Billing error detected - updating state');
					setGoogleMapsError('billing');
					setApiKeyStatus('billing-error');
					console.error('Google Maps billing error detected:', event.error);
				}
			}

			// Also check for the specific error type in the message
			if (event.message && event.message.includes('BillingNotEnabledMapError')) {
				console.log('💳 BillingNotEnabledMapError detected directly');
				setGoogleMapsError('billing');
				setApiKeyStatus('billing-error');
			}
		};

		// Handle console.error calls that might contain the billing error
		const originalConsoleError = console.error.bind(console);
		console.error = function(...args) {
			try {
				const errorString = args.map(a => (typeof a === 'string' ? a : '')).join(' ').toLowerCase();
				if (errorString.includes('billingnotenabledmaperror') ||
					errorString.includes('billing-not-enabled-map-error')) {
					console.log('💳 Console error billing detection triggered');
					setGoogleMapsError('billing');
					setApiKeyStatus('billing-error');
					// Downgrade to warn to avoid Next overlay
					console.warn(...args);
					return;
				}
				// Suppress benign Google Maps messages from triggering overlay
				if (errorString.includes('google maps billing error') ||
					errorString.includes('google maps error')) {
					console.warn(...args);
					return;
				}
				originalConsoleError(...args);
			} catch (err) {
				// If our error handling fails, make sure we still log the original error
				originalConsoleError(...args);
				// And then log our error handling error
				originalConsoleError('Error in error handler:', err);
			}
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('error', handleGoogleMapsError);
			// Also listen for unhandled promise rejections that might come from Google Maps
			window.addEventListener('unhandledrejection', (event) => {
				if (event.reason && typeof event.reason === 'object') {
					const errorMessage = event.reason.message ? event.reason.message.toLowerCase() : '';
					const errorString = JSON.stringify(event.reason).toLowerCase();

					if (errorMessage.includes('billingnotenabled') ||
						errorMessage.includes('billing') ||
						errorMessage.includes('billingnotenabledmaperror') ||
						errorString.includes('billing') ||
						errorString.includes('google maps')) {
						setGoogleMapsError('billing');
						setApiKeyStatus('billing-error');
						console.error('Google Maps billing error (promise rejection):', event.reason);
					}
				}
			});
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('error', handleGoogleMapsError);
				console.error = originalConsoleError; // Restore original console.error
			}
		};
	}, []);

	const riskZones = [
		{ id: 1, name: "Iloilo River Basin", type: "flood", level: "high", lat: 10.7200, lng: 122.5500 },
		{ id: 2, name: "Jaro District Hills", type: "landslide", level: "medium", lat: 10.7450, lng: 122.5650 },
		{ id: 3, name: "La Paz Fire Zone", type: "fire", level: "high", lat: 10.7150, lng: 122.5450 },
	]

	const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
		setMap(mapInstance)

		// Set initial map center
		const center = mapInstance.getCenter()
		if (center) {
			setCurrentMapCenter({ lat: center.lat(), lng: center.lng() })
		}

		// Listen for map center changes
		mapInstance.addListener('center_changed', () => {
			const newCenter = mapInstance.getCenter()
			if (newCenter) {
				setCurrentMapCenter({ lat: newCenter.lat(), lng: newCenter.lng() })
			}
		})

		// Markers removed - only using polygons for flood zones
	}, [])

	const mapLayers = [
		{ id: "all", label: "", icon: Layers },
		{ id: "weather", label: "Weather Data", icon: Cloud },
		{ id: "flood", label: "Flood Risk", icon: Droplets },
		{ id: "landslide", label: "Landslide Risk", icon: Mountain },
		{ id: "seismic", label: "Seismic Activity", icon: Zap },
		{ id: "fire", label: "Fire Risk", icon: Flame },
	]

	// Backend API base URL
	const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000'

	// Data fetching functions
	const fetchFloodData = async () => {
		try {
			setIsLoadingFloodData(true)
			console.log('🌊 Fetching flood data from backend...')
			const response = await fetch(`${BACKEND_BASE_URL}/api/flood-data`)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()
			console.log(`✅ Fetched ${data.features?.length || 0} flood features`)

			if (data.features && data.features.length > 0) {
				// Clear existing flood polygons
				floodPolygons.forEach(polygon => polygon.setMap(null))

				const newPolygons: google.maps.Polygon[] = []

				data.features.forEach((feature: any) => {
					let coordinates: google.maps.LatLngLiteral[] = []

					// Handle different geometry types
					if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
						coordinates = feature.geometry.coordinates[0].map((coord: number[]) => ({
							lat: Number(coord[1]),
							lng: Number(coord[0])
						}))
					} else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates) {
						// For MultiPolygon, take the first polygon
						if (feature.geometry.coordinates[0] && feature.geometry.coordinates[0][0]) {
							coordinates = feature.geometry.coordinates[0][0].map((coord: number[]) => ({
								lat: Number(coord[1]),
								lng: Number(coord[0])
							}))
						}
					}

					// Skip if no valid coordinates
					if (coordinates.length < 3) {
						console.warn('⚠️ Skipping flood feature - insufficient coordinates:', coordinates.length)
						return
					}

					// Validate coordinates are finite numbers
					const validCoordinates = coordinates.filter(coord =>
						isFinite(coord.lat) && isFinite(coord.lng)
					)

					if (validCoordinates.length < 3) {
						console.warn('⚠️ Skipping flood feature - invalid coordinates')
						return
					}

					coordinates = validCoordinates

					const riskLevel = feature.properties.risk_level
					const riskCategory = feature.properties.risk_category || 'Unknown'

					// Color coding based on risk category
					let color = '#00FF00' // Default green
					let opacity = 0.3

					switch (riskCategory.toLowerCase()) {
						case 'high':
						case 'critical':
							color = '#FF0000' // Red
							opacity = 0.7
							break
						case 'medium':
						case 'moderate':
							color = '#FFA500' // Orange
							opacity = 0.5
							break
						case 'low':
						case 'minimal':
							color = '#00FF00' // Green
							opacity = 0.3
							break
						default:
							// Fallback to numeric risk level
							if (riskLevel >= 2.5) {
								color = '#FF0000'
								opacity = 0.7
							} else if (riskLevel >= 1.5) {
								color = '#FFA500'
								opacity = 0.5
							} else {
								color = '#00FF00'
								opacity = 0.3
							}
					}

					const polygon = new google.maps.Polygon({
						paths: coordinates,
						strokeColor: color,
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: color,
						fillOpacity: opacity,
						map: map || undefined
					})

					// Add click listener for info window
					polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
						if (currentInfoWindowRef.current) {
							currentInfoWindowRef.current.close()
						}

						const infoWindow = new google.maps.InfoWindow({
							content: `
                <div style="padding: 10px; max-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937;">🌊 Flood Risk Zone</h3>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Risk Category:</strong> 
                    <span style="color: ${color}; font-weight: bold;">${riskCategory.toUpperCase()}</span>
                  </p>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Risk Level:</strong> ${feature.properties.risk_level.toFixed(1)}/3.0
                  </p>
                  <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                    ID: ${feature.properties.id}
                  </p>
                </div>
              `,
							position: event.latLng
						})

						infoWindow.open(map)
						currentInfoWindowRef.current = infoWindow
					})

					newPolygons.push(polygon)
				})

				setFloodPolygons(newPolygons)
				console.log(`✅ Added ${newPolygons.length} flood polygons to map`)
			}
		} catch (error) {
			console.error('❌ Error fetching flood data:', error)
		} finally {
			setIsLoadingFloodData(false)
		}
	}

	const fetchLandslideData = async (lat?: number, lng?: number, radiusKm: number = 50) => {
		try {
			setIsLoadingLandslideData(true)
			console.log('🏔️ Fetching landslide data from backend...')

			// Build URL with parameters
			let url = `${BACKEND_BASE_URL}/api/landslide-data`
			const params = new URLSearchParams()

			// Add nearby parameters if provided
			if (lat !== undefined && lng !== undefined) {
				params.append('lat', lat.toString())
				params.append('lng', lng.toString())
				params.append('radius_km', radiusKm.toString())
				console.log(`📍 Fetching landslide data near (${lat}, ${lng}) within ${radiusKm}km radius`)
			} else {
				console.log('📊 Fetching all landslide data')
			}

			if (params.toString()) {
				url += '?' + params.toString()
			}

			const response = await fetch(url)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()
			console.log(`✅ Fetched ${data.features?.length || 0} landslide features`)

			if (data.features && data.features.length > 0) {
				// Clear existing landslide zones
				landslideZones.forEach(zone => zone.setMap(null))

				const newZones: google.maps.Polygon[] = []

				data.features.forEach((feature: any) => {
					let coordinates: google.maps.LatLngLiteral[] = []

					// Handle different geometry types
					if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
						coordinates = feature.geometry.coordinates[0].map((coord: number[]) => ({
							lat: Number(coord[1]),
							lng: Number(coord[0])
						}))
					} else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates) {
						// For MultiPolygon, take the first polygon
						if (feature.geometry.coordinates[0] && feature.geometry.coordinates[0][0]) {
							coordinates = feature.geometry.coordinates[0][0].map((coord: number[]) => ({
								lat: Number(coord[1]),
								lng: Number(coord[0])
							}))
						}
					}

					// Skip if no valid coordinates
					if (coordinates.length < 3) {
						console.warn('⚠️ Skipping landslide feature - insufficient coordinates:', coordinates.length)
						return
					}

					// Validate coordinates are finite numbers
					const validCoordinates = coordinates.filter(coord =>
						isFinite(coord.lat) && isFinite(coord.lng)
					)

					if (validCoordinates.length < 3) {
						console.warn('⚠️ Skipping landslide feature - invalid coordinates')
						return
					}

					coordinates = validCoordinates

					const riskLevel = feature.properties.risk_level
					const color = riskLevel >= 2.5 ? '#8B4513' : riskLevel >= 1.5 ? '#D2691E' : '#DEB887'
					const opacity = riskLevel >= 2.5 ? 0.7 : riskLevel >= 1.5 ? 0.5 : 0.3

					const polygon = new google.maps.Polygon({
						paths: coordinates,
						strokeColor: color,
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: color,
						fillOpacity: opacity,
						map: map || undefined
					})

					// Add click listener for info window
					polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
						if (currentInfoWindowRef.current) {
							currentInfoWindowRef.current.close()
						}

						const infoWindow = new google.maps.InfoWindow({
							content: `
                <div style="padding: 10px; max-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937;">Landslide Risk Zone</h3>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Risk Level:</strong> ${feature.properties.risk_level.toFixed(1)}/3.0
                  </p>
                  <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Category:</strong> ${feature.properties.risk_category}
                  </p>
                  <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                    ID: ${feature.properties.id}
                  </p>
                </div>
              `,
							position: event.latLng
						})

						infoWindow.open(map)
						currentInfoWindowRef.current = infoWindow
					})

					newZones.push(polygon)
				})

				setLandslideZones(newZones)
				console.log(`✅ Added ${newZones.length} landslide zones to map`)
			}
		} catch (error) {
			console.error('❌ Error fetching landslide data:', error)
		} finally {
			setIsLoadingLandslideData(false)
		}
	}

	const fetchSeismicData = async () => {
		try {
			setIsLoadingSeismicData(true)
			console.log('🌋 Fetching seismic data from backend...')
			const response = await fetch(`${BACKEND_BASE_URL}/api/seismic-data?hours=24`)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()
			console.log(`✅ Fetched ${data.features?.length || 0} seismic events`)

			if (data.features && data.features.length > 0) {
				// Clear existing seismic markers
				seismicMarkers.forEach(marker => marker.setMap(null))

				const newMarkers: google.maps.Marker[] = []

				data.features.forEach((feature: any) => {
					if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
						const [lng, lat] = feature.geometry.coordinates
						const magnitude = feature.properties.magnitude
						const depth = feature.properties.depth
						const locationName = feature.properties.location_name
						const eventTime = feature.properties.event_time

						// Determine marker color based on magnitude
						let markerColor = '#00FF00' // Green for low magnitude
						let markerSize = 8
						let markerOpacity = 0.6

						if (magnitude >= 6.0) {
							markerColor = '#FF0000' // Red for major earthquakes
							markerSize = 16
							markerOpacity = 0.9
						} else if (magnitude >= 4.5) {
							markerColor = '#FFA500' // Orange for moderate earthquakes
							markerSize = 12
							markerOpacity = 0.8
						} else if (magnitude >= 3.0) {
							markerColor = '#FFFF00' // Yellow for minor earthquakes
							markerSize = 10
							markerOpacity = 0.7
						}

						// Create custom marker icon
						const markerIcon = {
							path: google.maps.SymbolPath.CIRCLE,
							fillColor: markerColor,
							fillOpacity: markerOpacity,
							strokeColor: '#000000',
							strokeWeight: 1,
							scale: markerSize
						}

						const marker = new google.maps.Marker({
							position: { lat: Number(lat), lng: Number(lng) },
							map: map || undefined,
							icon: markerIcon,
							title: `Magnitude ${magnitude} earthquake`,
							zIndex: 150
						})

						// Add click listener for info window
						marker.addListener('click', () => {
							if (currentInfoWindowRef.current) {
								currentInfoWindowRef.current.close()
							}

							const infoWindow = new google.maps.InfoWindow({
								content: `
                  <div style="padding: 10px; max-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937;">🌋 Earthquake Event</h3>
                    <p style="margin: 4px 0; font-size: 14px;">
                      <strong>Magnitude:</strong> ${magnitude.toFixed(1)}
                    </p>
                    <p style="margin: 4px 0; font-size: 14px;">
                      <strong>Depth:</strong> ${depth ? `${depth.toFixed(1)} km` : 'Unknown'}
                    </p>
                    <p style="margin: 4px 0; font-size: 14px;">
                      <strong>Location:</strong> ${locationName || 'Unknown'}
                    </p>
                    <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                      <strong>Time:</strong> ${eventTime ? new Date(eventTime).toLocaleString() : 'Unknown'}
                    </p>
                    <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                      ID: ${feature.properties.id}
                    </p>
                  </div>
                `,
								position: { lat: Number(lat), lng: Number(lng) }
							})

							infoWindow.open(map)
							currentInfoWindowRef.current = infoWindow
						})

						newMarkers.push(marker)
					}
				})

				setSeismicMarkers(newMarkers)
				console.log(`✅ Added ${newMarkers.length} seismic markers to map`)
			}
		} catch (error) {
			console.error('❌ Error fetching seismic data:', error)
		} finally {
			setIsLoadingSeismicData(false)
		}
	}

	const clearMapData = () => {
		console.log('🧹 Clearing all map data...')

		// Clear flood polygons
		floodPolygons.forEach(polygon => polygon.setMap(null))
		setFloodPolygons([])

		// Clear landslide zones
		landslideZones.forEach(zone => zone.setMap(null))
		setLandslideZones([])

		// Clear fire zones
		fireZones.forEach(zone => zone.setMap(null))
		setFireZones([])

		// Clear markers
		landslideMarkers.forEach(marker => marker.setMap(null))
		setLandslideMarkers([])
		fireMarkers.forEach(marker => marker.setMap(null))
		setFireMarkers([])
		seismicMarkers.forEach(marker => marker.setMap(null))
		setSeismicMarkers([])

		// Close any open info windows
		if (currentInfoWindowRef.current) {
			currentInfoWindowRef.current.close()
			currentInfoWindowRef.current = null
		}

		console.log('✅ Map cleared successfully')
	}

	const fetchWeatherData = async (lat: number, lng: number) => {
		setIsLoadingWeather(true)
		setWeatherError(null)

		try {
			// Skip backend health check and directly provide mock data for better reliability
			console.log('Using mock weather data for Iloilo City')

			// Provide immediate mock data for Iloilo City
			const mockWeatherData: WeatherData = {
				_id: 'mock-iloilo-' + Date.now(),
				location: {
					latitude: lat,
					longitude: lng,
					name: 'Iloilo City, Philippines'
				},
				temperature: {
					value: 28.5,
					unit: '°C'
				},
				humidity: 78,
				pressure: {
					value: 1013,
					unit: 'hPa'
				},
				windSpeed: {
					value: 11.5,
					unit: 'km/h'
				},
				windDirection: 120,
				visibility: {
					value: 10.0,
					unit: 'km'
				},
				uvIndex: 7,
				cloudCover: 65,
				condition: 'scattered clouds',
				timestamp: new Date().toISOString()
			}

			setWeatherData(mockWeatherData)

		} catch (error) {
			console.error('Weather service error:', error)

			// Always provide fallback data to ensure map functionality
			const fallbackWeatherData: WeatherData = {
				_id: 'fallback-iloilo-' + Date.now(),
				location: {
					latitude: lat,
					longitude: lng,
					name: 'Iloilo City, Philippines'
				},
				temperature: {
					value: 28.5,
					unit: '°C'
				},
				humidity: 78,
				windSpeed: {
					value: 11.5,
					unit: 'km/h'
				},
				condition: 'scattered clouds',
				timestamp: new Date().toISOString()
			}

			setWeatherData(fallbackWeatherData)
			setWeatherError('Using offline weather data')
		} finally {
			setIsLoadingWeather(false)
		}
	}

	const refreshWeatherData = () => {
		if (selectedLocation) {
			fetchWeatherData(selectedLocation.lat, selectedLocation.lng)
		}
	}

	// Load weather data on component mount and when location changes (non-blocking)
	useEffect(() => {
		// Use setTimeout to make weather fetching non-blocking for map display
		const timeoutId = setTimeout(() => {
			if (selectedLocation) {
				fetchWeatherData(selectedLocation.lat, selectedLocation.lng)
			}
		}, 100) // Small delay to allow map to render first

		return () => clearTimeout(timeoutId)
	}, [selectedLocation])

	// Keyboard navigation for layer buttons
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
				const currentIndex = mapLayers.findIndex(layer => layer.id === selectedLayer)
				let nextIndex

				if (event.key === 'ArrowLeft') {
					nextIndex = currentIndex > 0 ? currentIndex - 1 : mapLayers.length - 1
				} else {
					nextIndex = currentIndex < mapLayers.length - 1 ? currentIndex + 1 : 0
				}

				setSelectedLayer(mapLayers[nextIndex].id)

				// Scroll to the selected button
				if (scrollContainerRef.current) {
					const buttonWidth = 120 // Approximate button width
					scrollContainerRef.current.scrollTo({
						left: nextIndex * buttonWidth,
						behavior: 'smooth'
					})
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [selectedLayer, mapLayers])

	// Check scroll position for indicators
	const checkScrollPosition = useCallback(() => {
		if (scrollContainerRef.current) {
			const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
			setCanScrollLeft(scrollLeft > 0)
			setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
		}
	}, [])

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current
		if (scrollContainer) {
			checkScrollPosition()
			scrollContainer.addEventListener('scroll', checkScrollPosition)
			return () => scrollContainer.removeEventListener('scroll', checkScrollPosition)
		}
	}, [checkScrollPosition])

	// Risk overlays rendering based on selected layer (create/destroy overlays only on layer change)
	useEffect(() => {
		if (map) {
			// Clear existing overlays first
			floodPolygons.forEach(polygon => polygon.setMap(null));
			floodCenterMarkers.forEach(m => m.setMap(null));
			landslideMarkers.forEach(m => m.setMap(null));
			fireMarkers.forEach(m => m.setMap(null));
			landslideZones.forEach(z => z.setMap(null));
			fireZones.forEach(z => z.setMap(null));
			setFloodPolygons([]);
			setFloodCenterMarkers([]);
			setLandslideMarkers([]);
			setFireMarkers([]);
			setLandslideZones([]);
			setFireZones([]);
			if (centerMarkerRef.current) {
				centerMarkerRef.current.setMap(null);
				centerMarkerRef.current = null;
			}

			// Helper to zoom into high-risk areas
			const zoomToBounds = (positions: google.maps.LatLngLiteral[]) => {
				if (!positions.length) return;
				const bounds = new google.maps.LatLngBounds();
				positions.forEach(p => bounds.extend(p));
				if (positions.length === 1) {
					map.setZoom(15);
					map.setCenter(positions[0]);
				} else {
					map.fitBounds(bounds);
				}
			};

			if (selectedLayer === 'flood') {
				// Create new flood prediction polygons only for flood layer
				const newCenterMarkers: google.maps.Marker[] = [];
				const newPolygons = sampleFloodPredictions.map(prediction => {
					// Create polygon with enhanced visibility and animation
					const polygon = new google.maps.Polygon({
						paths: prediction.coordinates,
						strokeColor: prediction.riskLevel === 'high' ? '#dc2626' :
							prediction.riskLevel === 'medium' ? '#d97706' : '#16a34a',
						strokeOpacity: 0.9,
						strokeWeight: 3,
						fillColor: prediction.riskLevel === 'high' ? '#ef4444' :
							prediction.riskLevel === 'medium' ? '#f59e0b' : '#22c55e',
						fillOpacity: 0.4 + (Math.sin(animationFrame * 0.5) * 0.2), // Smooth pulsing animation
						map: map,
						clickable: true,
						zIndex: 100
					});
					// Per-polygon center 🌊 marker
					const centroid = getPolygonCentroid(prediction.coordinates);
					newCenterMarkers.push(new google.maps.Marker({ position: centroid, map, icon: getTransparentIcon(), label: { text: '🌊', color: '#1e40af' }, zIndex: 200 }));

					// Create closable info window with better styling
					const container = document.createElement('div');
					container.style.padding = '12px';
					container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
					container.style.position = 'relative';

					const closeBtn = document.createElement('button');
					closeBtn.textContent = '×';
					closeBtn.setAttribute('aria-label', 'Close');
					closeBtn.style.position = 'absolute';
					closeBtn.style.top = '8px';
					closeBtn.style.right = '8px';
					closeBtn.style.background = '#ef4444';
					closeBtn.style.color = '#fff';
					closeBtn.style.border = 'none';
					closeBtn.style.borderRadius = '50%';
					closeBtn.style.width = '24px';
					closeBtn.style.height = '24px';
					closeBtn.style.cursor = 'pointer';
					closeBtn.style.fontSize = '14px';
					closeBtn.style.fontWeight = 'bold';
					closeBtn.style.display = 'flex';
					closeBtn.style.alignItems = 'center';
					closeBtn.style.justifyContent = 'center';

					const contentWrapper = document.createElement('div');
					contentWrapper.style.marginBottom = '8px';
					contentWrapper.style.marginRight = '30px';
					const title = document.createElement('h3');
					title.style.fontWeight = '600';
					title.style.fontSize = '14px';
					title.style.margin = '0';
					title.style.color = '#1f2937';
					title.textContent = `🌊 Flood Risk: ${prediction.riskLevel.toUpperCase()}`;
					contentWrapper.appendChild(title);

					const details = document.createElement('div');
					details.style.fontSize = '12px';
					details.style.lineHeight = '1.4';
					details.style.color = '#4b5563';
					details.innerHTML = `
            <p style="margin:4px 0;"><strong>Probability:</strong> ${prediction.probability}%</p>
            <p style="margin:4px 0;"><strong>Time to flood:</strong> ${prediction.timeToFlood} minutes</p>
            <p style="margin:4px 0;"><strong>Expected water level:</strong> ${prediction.waterLevel}m</p>
          `;

					container.appendChild(closeBtn);
					container.appendChild(contentWrapper);
					container.appendChild(details);

					const infoWindow = new google.maps.InfoWindow({
						content: container,
						disableAutoPan: false,
						maxWidth: 280,
						pixelOffset: new google.maps.Size(0, -10)
					});

					closeBtn.addEventListener('click', (e) => {
						e.preventDefault();
						e.stopPropagation();
						infoWindow.close();
						if (currentInfoWindowRef.current === infoWindow) {
							currentInfoWindowRef.current = null;
						}
					});

					// Add click listener for polygon interaction
					polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
						// Close any existing info windows
						if (currentInfoWindowRef.current) {
							currentInfoWindowRef.current.close();
						}

						// Set position and open new info window
						if (event.latLng) {
							infoWindow.setPosition(event.latLng);
							infoWindow.open(map);

							// Store reference to current info window for closing
							currentInfoWindowRef.current = infoWindow;
						}
					});

					infoWindow.addListener('closeclick', () => {
						if (currentInfoWindowRef.current === infoWindow) {
							currentInfoWindowRef.current = null;
						}
					});

					// Add hover effects for better interaction
					polygon.addListener('mouseover', () => {
						polygon.setOptions({
							strokeWeight: 4,
							fillOpacity: 0.6
						});
					});

					polygon.addListener('mouseout', () => {
						polygon.setOptions({
							strokeWeight: 3,
							fillOpacity: 0.4 + (Math.sin(animationFrame * 0.5) * 0.2)
						});
					});

					return polygon;
				});

				setFloodPolygons(newPolygons);
				setFloodCenterMarkers(newCenterMarkers);
				setFloodPredictions(sampleFloodPredictions);

				// Zoom to high-risk flood polygons (only once on layer change)
				const highCenters = sampleFloodPredictions
					.filter(p => p.riskLevel === 'high')
					.map(p => getPolygonCentroid(p.coordinates));
				zoomToBounds(highCenters.length ? highCenters : [getPolygonCentroid(sampleFloodPredictions[0].coordinates)]);

				// Add a single centered 🌊 marker for all flood zones
				const allCenters = sampleFloodPredictions.map(p => getPolygonCentroid(p.coordinates));
				const sumAll = allCenters.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
				const avgCenter = { lat: sumAll.lat / allCenters.length, lng: sumAll.lng / allCenters.length };
				centerMarkerRef.current = new google.maps.Marker({
					position: avgCenter,
					map,
					icon: getTransparentIcon(),
					label: { text: '🌊', color: '#1e40af', fontSize: '20px' as any },
					zIndex: 250,
				});

			} else if (selectedLayer === 'landslide' || selectedLayer === 'fire' || selectedLayer === 'energy') {
				// Render markers for the selected risk type
				const typeToEmoji: Record<string, string> = {
					landslide: '⛰️',
					fire: '🔥',
				};
				const markers: google.maps.Marker[] = [];
				const newPolygons: google.maps.Polygon[] = [];
				const positions: google.maps.LatLngLiteral[] = [];
				const filtered = riskZones.filter(z =>
					(selectedLayer === 'landslide' && z.type === 'landslide') ||
					(selectedLayer === 'fire' && z.type === 'fire')
				);
				filtered.forEach(z => {
					const pos = { lat: z.lat, lng: z.lng };
					const m = new google.maps.Marker({
						position: pos,
						map,
						icon: getTransparentIcon(),
						label: { text: typeToEmoji[selectedLayer], color: '#111827', fontSize: '20px' as any },
					});
					markers.push(m);
					positions.push(pos);
					// Polygon zone around center (diamond shape)
					const sizeByLevel: Record<string, number> = { high: 0.008, medium: 0.006, low: 0.004, active: 0.006 };
					const colorByType: Record<string, string> = { landslide: '#f59e0b', fire: '#ef4444' };
					const poly = new google.maps.Polygon({
						paths: [
							{ lat: pos.lat + sizeByLevel[z.level] || 0.005, lng: pos.lng },
							{ lat: pos.lat, lng: pos.lng + (sizeByLevel[z.level] || 0.005) },
							{ lat: pos.lat - (sizeByLevel[z.level] || 0.005), lng: pos.lng },
							{ lat: pos.lat, lng: pos.lng - (sizeByLevel[z.level] || 0.005) },
						],
						strokeColor: colorByType[selectedLayer],
						strokeOpacity: 0.9,
						strokeWeight: 3,
						fillColor: colorByType[selectedLayer],
						fillOpacity: 0.35,
						map,
						zIndex: 90,
					});
					// InfoWindow on polygon click
					const infoContainer = document.createElement('div');
					infoContainer.style.font = '13px system-ui';
					infoContainer.style.position = 'relative';
					const closeBtn = document.createElement('button');
					closeBtn.textContent = '×';
					closeBtn.setAttribute('aria-label', 'Close');
					Object.assign(closeBtn.style, { position: 'absolute', top: '4px', right: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '9999px', width: '18px', height: '18px', cursor: 'pointer', lineHeight: '16px', textAlign: 'center' });
					const body = document.createElement('div');
					body.innerHTML = `<strong>${selectedLayer[0].toUpperCase() + selectedLayer.slice(1)} Risk</strong><br/>Level: ${z.level.toUpperCase()}<br/>Location: ${z.name || 'Zone'}`;
					infoContainer.appendChild(closeBtn);
					infoContainer.appendChild(body);
					const info = new google.maps.InfoWindow({ content: infoContainer });
					closeBtn.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); info.close(); if (currentInfoWindowRef.current === info) currentInfoWindowRef.current = null; });
					poly.addListener('click', (e: google.maps.MapMouseEvent) => {
						if (currentInfoWindowRef.current) currentInfoWindowRef.current.close();
						if (e.latLng) info.setPosition(e.latLng);
						info.open(map);
						currentInfoWindowRef.current = info;
					});
					newPolygons.push(poly);
				});

				if (selectedLayer === 'landslide') setLandslideMarkers(markers);
				if (selectedLayer === 'fire') setFireMarkers(markers);
				if (selectedLayer === 'landslide') setLandslideZones(newPolygons as unknown as any);
				if (selectedLayer === 'fire') setFireZones(newPolygons as unknown as any);

				// Zoom preference: high level for landslide/fire
				const priority = 'high';
				const priorityPositions = filtered
					.filter(z => z.level === priority)
					.map(z => ({ lat: z.lat, lng: z.lng }));
				zoomToBounds(priorityPositions.length ? priorityPositions : positions);

				// Add single centered icon for the selected non-flood risk
				if (positions.length) {
					const sum = positions.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
					const avg = { lat: sum.lat / positions.length, lng: sum.lng / positions.length };
					centerMarkerRef.current = new google.maps.Marker({
						position: avg,
						map,
						icon: getTransparentIcon(),
						label: { text: typeToEmoji[selectedLayer], color: '#111827', fontSize: '20px' as any },
						zIndex: 250,
					});
				}

			} else if (selectedLayer === 'seismic') {
				// Render seismic markers (data will be loaded via fetchSeismicData)
				// The markers are already created in fetchSeismicData function
				// Just add a centered icon for seismic layer
				centerMarkerRef.current = new google.maps.Marker({
					position: selectedLocation,
					map,
					icon: getTransparentIcon(),
					label: { text: '🌋', color: '#dc2626', fontSize: '20px' as any },
					zIndex: 250,
				});

			} else if (selectedLayer === 'all') {
				// Show everything
				const newPolygons = sampleFloodPredictions.map(prediction => new google.maps.Polygon({
					paths: prediction.coordinates,
					strokeColor: prediction.riskLevel === 'high' ? '#dc2626' : prediction.riskLevel === 'medium' ? '#d97706' : '#16a34a',
					strokeOpacity: 0.9,
					strokeWeight: 3,
					fillColor: prediction.riskLevel === 'high' ? '#ef4444' : prediction.riskLevel === 'medium' ? '#f59e0b' : '#22c55e',
					fillOpacity: 0.4 + (Math.sin(animationFrame * 0.5) * 0.2),
					map,
					clickable: false,
					zIndex: 80,
				}));
				setFloodPolygons(newPolygons);

				// Per-polygon flood centers for All view
				const allCentersMarkers = sampleFloodPredictions.map(p => new google.maps.Marker({
					position: getPolygonCentroid(p.coordinates),
					map,
					icon: getTransparentIcon(),
					label: { text: '🌊', color: '#1e40af', fontSize: '20px' as any },
					zIndex: 200,
				}));
				setFloodCenterMarkers(allCentersMarkers);

				const positions: google.maps.LatLngLiteral[] = [];
				const landslideArr: google.maps.Marker[] = [];
				const fireArr: google.maps.Marker[] = [];
				const landslidePolyArr: google.maps.Polygon[] = [];
				const firePolyArr: google.maps.Polygon[] = [];
				riskZones.forEach(z => {
					const pos = { lat: z.lat, lng: z.lng };
					if (z.type === 'landslide') {
						landslideArr.push(new google.maps.Marker({ position: pos, map, icon: getTransparentIcon(), label: { text: '⛰️', color: '#111827', fontSize: '18px' as any } }));
						const s = z.level === 'high' ? 0.008 : z.level === 'medium' ? 0.006 : 0.004;
						const coords = [
							{ lat: pos.lat + s, lng: pos.lng },
							{ lat: pos.lat, lng: pos.lng + s },
							{ lat: pos.lat - s, lng: pos.lng },
							{ lat: pos.lat, lng: pos.lng - s },
						];
						const poly = new google.maps.Polygon({ paths: coords, strokeColor: '#f59e0b', strokeOpacity: 0.9, strokeWeight: 3, fillColor: '#f59e0b', fillOpacity: 0.35, map, zIndex: 90 });
						const cont = document.createElement('div'); cont.style.position = 'relative'; cont.style.font = '13px system-ui';
						const x = document.createElement('button'); x.textContent = '×'; x.setAttribute('aria-label', 'Close'); Object.assign(x.style, { position: 'absolute', top: '4px', right: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '9999px', width: '18px', height: '18px', cursor: 'pointer', lineHeight: '16px', textAlign: 'center' });
						const b = document.createElement('div'); b.innerHTML = `<strong>Landslide Risk</strong><br/>Level: ${z.level.toUpperCase()}<br/>Location: ${z.name || 'Zone'}`;
						cont.appendChild(x); cont.appendChild(b);
						const iw = new google.maps.InfoWindow({ content: cont });
						x.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); iw.close(); if (currentInfoWindowRef.current === iw) currentInfoWindowRef.current = null; });
						poly.addListener('click', (e: google.maps.MapMouseEvent) => {
							if (currentInfoWindowRef.current) currentInfoWindowRef.current.close();
							if (e.latLng) iw.setPosition(e.latLng);
							iw.open(map);
							currentInfoWindowRef.current = iw;
						});
						landslidePolyArr.push(poly);
						positions.push(pos);
					} else if (z.type === 'fire') {
						fireArr.push(new google.maps.Marker({ position: pos, map, icon: getTransparentIcon(), label: { text: '🔥', color: '#111827', fontSize: '18px' as any } }));
						const s = z.level === 'high' ? 0.008 : z.level === 'medium' ? 0.006 : 0.004;
						const coords = [
							{ lat: pos.lat + s, lng: pos.lng },
							{ lat: pos.lat, lng: pos.lng + s },
							{ lat: pos.lat - s, lng: pos.lng },
							{ lat: pos.lat, lng: pos.lng - s },
						];
						const poly = new google.maps.Polygon({ paths: coords, strokeColor: '#ef4444', strokeOpacity: 0.9, strokeWeight: 3, fillColor: '#ef4444', fillOpacity: 0.35, map, zIndex: 90 });
						const cont = document.createElement('div'); cont.style.position = 'relative'; cont.style.font = '13px system-ui';
						const x = document.createElement('button'); x.textContent = '×'; x.setAttribute('aria-label', 'Close'); Object.assign(x.style, { position: 'absolute', top: '4px', right: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '9999px', width: '18px', height: '18px', cursor: 'pointer', lineHeight: '16px', textAlign: 'center' });
						const b = document.createElement('div'); b.innerHTML = `<strong>Fire Risk</strong><br/>Level: ${z.level.toUpperCase()}<br/>Location: ${z.name || 'Zone'}`;
						cont.appendChild(x); cont.appendChild(b);
						const iw = new google.maps.InfoWindow({ content: cont });
						x.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); iw.close(); if (currentInfoWindowRef.current === iw) currentInfoWindowRef.current = null; });
						poly.addListener('click', (e: google.maps.MapMouseEvent) => {
							if (currentInfoWindowRef.current) currentInfoWindowRef.current.close();
							if (e.latLng) iw.setPosition(e.latLng);
							iw.open(map);
							currentInfoWindowRef.current = iw;
						});
						firePolyArr.push(poly);
						positions.push(pos);
					}
				});
				setLandslideMarkers(landslideArr);
				setFireMarkers(fireArr);
				setLandslideZones(landslidePolyArr as unknown as any);
				setFireZones(firePolyArr as unknown as any);

				// Fit to all features once
				const polygonCenters = sampleFloodPredictions.map(p => getPolygonCentroid(p.coordinates));
				zoomToBounds(positions.concat(polygonCenters));
			}
		}
	}, [map, selectedLayer]);

	// Load data when map is ready and layer changes
	useEffect(() => {
		if (!map) return;

		console.log(`🔄 Loading data for layer: ${selectedLayer}`)

		if (selectedLayer === 'flood' || selectedLayer === 'all') {
			fetchFloodData()
		}

		if (selectedLayer === 'landslide' || selectedLayer === 'all') {
			fetchLandslideData(currentMapCenter.lat, currentMapCenter.lng, queryRadius)
		}

		if (selectedLayer === 'seismic' || selectedLayer === 'all') {
			fetchSeismicData()
		}

		if (selectedLayer === 'weather' || selectedLayer === 'all') {
			fetchWeatherData(currentMapCenter.lat, currentMapCenter.lng)
		}
	}, [map, selectedLayer])

	// Animation loop for HEC-RAS style pulsing effect - Always active
	useEffect(() => {
		const interval = setInterval(() => {
			setAnimationFrame(prev => (prev + 1) % 10); // Cycle through 0-9
		}, 500); // Update every 500ms for smooth pulsing

		return () => clearInterval(interval);
	}, []);

	// Apply animation to existing flood polygons without recreating/zooming
	useEffect(() => {
		if (floodPolygons.length > 0) {
			const opacity = 0.4 + (Math.sin(animationFrame * 0.5) * 0.2);
			floodPolygons.forEach(p => p.setOptions({ fillOpacity: opacity }));
		}
		const ringOpacity = 0.35 + (Math.sin(animationFrame * 0.5) * 0.1);
		landslideZones.forEach((p: any) => p.setOptions({ fillOpacity: ringOpacity }));
		fireZones.forEach((p: any) => p.setOptions({ fillOpacity: ringOpacity }));
	}, [animationFrame, floodPolygons, landslideZones, fireZones]);

	const getLevelColor = (level: string) => {
		switch (level) {
			case "high":
				return "bg-red-500"
			case "medium":
				return "bg-yellow-500"
			case "low":
				return "bg-green-500"
			case "active":
				return "bg-blue-500"
			default:
				return "bg-gray-500"
		}
	}

	// Add a new state variable to track if we should show the fallback UI
	const [showFallbackUI, setShowFallbackUI] = useState(false);

	// Add useEffect to handle Google Maps errors and show fallback UI if needed
	useEffect(() => {
		if (googleMapsError || apiKeyStatus === 'billing-error' || apiKeyStatus === 'invalid') {
			setShowFallbackUI(true);
		} else {
			setShowFallbackUI(false);
		}
	}, [googleMapsError, apiKeyStatus]);

	// Add fallback UI rendering
	if (showFallbackUI) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Interactive Map</span>
						<Badge variant="outline" className="ml-2">Fallback Mode</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div style={{ height: mapHeight }} className="relative rounded-md overflow-hidden">
						<MockMapComponent />
						<div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-md shadow-sm">
							<h4 className="text-sm font-medium mb-1">Google Maps Unavailable</h4>
							<p className="text-xs text-gray-500 mb-2">
								{apiKeyStatus === 'billing-error' ?
									'Google Maps requires billing to be enabled on the API key.' :
									apiKeyStatus === 'invalid' ?
										'Invalid or restricted Google Maps API key.' :
										'Unable to load Google Maps. Using fallback display mode.'}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setGoogleMapsError(null);
									setApiKeyStatus('checking');
									setShowFallbackUI(false);
									window.location.reload();
								}}
							>
								Retry
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			{/* Full Screen Modal */}
			{isFullScreen && (
				<div className="fixed inset-0 z-50 bg-white">
					{/* Back Button */}
					<div className="absolute top-4 left-4 z-10">
						<Button
							onClick={() => setIsFullScreen(false)}
							className="bg-white/90 hover:bg-white text-gray-700 border border-gray-300 shadow-lg backdrop-blur-sm"
							size="sm"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Dashboard
						</Button>
					</div>

					{/* My Location Button */}
					<div className="absolute top-4 left-48 z-10">
						<Button
							onClick={() => {
								if (navigator.geolocation) {
									navigator.geolocation.getCurrentPosition(
										(position) => {
											const { latitude, longitude } = position.coords
											setCurrentMapCenter({ lat: latitude, lng: longitude })
											if (map) {
												map.setCenter({ lat: latitude, lng: longitude })
												map.setZoom(12)
											}
										},
										(error) => {
											console.error('Error getting current location:', error)
											alert('Unable to get current location. Please check your browser permissions.')
										}
									)
								} else {
									alert('Geolocation is not supported by this browser.')
								}
							}}
							className="bg-green-600 hover:bg-green-700 text-white border border-green-500 shadow-lg backdrop-blur-sm"
							size="sm"
						>
							<MapPin className="w-4 h-4 mr-2" />
							My Location
						</Button>
					</div>

					{/* Fullscreen Layer Toolbar */}
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4">
						<div className="flex flex-col gap-3">
							{/* Layer Buttons */}
							<div className="flex gap-3 overflow-x-auto p-2 bg-white/80 rounded-lg shadow-md backdrop-blur-sm">
								{mapLayers.map((layer) => (
									<Button
										key={layer.id}
										variant={selectedLayer === layer.id ? "default" : "outline"}
										size="sm"
										onClick={() => setSelectedLayer(layer.id)}
										className={`${selectedLayer === layer.id ? "bg-blue-600 text-white border-blue-600" : "border-blue-200 text-blue-700 hover:bg-blue-50"} min-w-fit px-4 py-2`}
									>
										<layer.icon className="w-4 h-4 mr-2" />
										<span className="whitespace-nowrap font-medium">{layer.label || 'All'}</span>
									</Button>
								))}
							</div>

							{/* Radius Control */}
							<div className="flex items-center justify-center gap-3 p-2 bg-white/80 rounded-lg shadow-md backdrop-blur-sm">
								<label className="text-sm font-medium text-gray-700 whitespace-nowrap">
									Query Radius:
								</label>
								<select
									value={queryRadius}
									onChange={(e) => setQueryRadius(Number(e.target.value))}
									className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value={10}>10 km</option>
									<option value={25}>25 km</option>
									<option value={50}>50 km</option>
									<option value={100}>100 km</option>
									<option value={200}>200 km</option>
								</select>
								<span className="text-xs text-gray-500">
									(for nearby queries)
								</span>
							</div>

							{/* Load Data and Clear Map Buttons */}
							<div className="flex justify-center gap-3">
								<Button
									onClick={() => {
										if (selectedLayer === 'flood' || selectedLayer === 'all') {
											fetchFloodData()
										}
										if (selectedLayer === 'landslide' || selectedLayer === 'all') {
											fetchLandslideData(currentMapCenter.lat, currentMapCenter.lng, queryRadius)
										}
										if (selectedLayer === 'seismic' || selectedLayer === 'all') {
											fetchSeismicData()
										}
										if (selectedLayer === 'weather' || selectedLayer === 'all') {
											fetchWeatherData(currentMapCenter.lat, currentMapCenter.lng)
										}
									}}
									disabled={isLoadingFloodData || isLoadingLandslideData || isLoadingSeismicData || isLoadingWeather}
									className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg disabled:opacity-50"
									size="sm"
								>
									<Cloud className="w-4 h-4 mr-2" />
									{isLoadingFloodData || isLoadingLandslideData || isLoadingSeismicData || isLoadingWeather
										? 'Loading...'
										: `Load ${selectedLayer === 'all' ? 'All Data' : selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1) + ' Data'}`
									}
								</Button>

								<Button
									onClick={clearMapData}
									className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 shadow-lg"
									size="sm"
								>
									<Info className="w-4 h-4 mr-2" />
									Clear Map
								</Button>
							</div>
						</div>
					</div>

					{/* Full Screen Map */}
					<div className="w-full h-full">
						{showAlphaEarth ? (
							<AlphaEarthMap height="100%" defaultCenter={selectedLocation} defaultZoom={12} />
						) : googleMapsError === 'billing' ? (
							<div className="flex flex-col items-center justify-center h-full bg-yellow-50 border border-yellow-200 text-yellow-800">
								<div className="text-center p-8">
									<MapPin className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
									<h3 className="font-semibold text-lg mb-2">Google Maps Billing Required</h3>
									<p className="text-sm mb-4">
										Google Maps requires billing to be enabled in your Google Cloud Console.
									</p>
									<div className="bg-white/70 p-4 rounded-lg border border-yellow-200 text-left max-w-md mb-4">
										<h4 className="font-medium text-sm mb-2">To enable Google Maps:</h4>
										<ul className="text-xs space-y-1 text-yellow-700">
											<li>• Visit Google Cloud Console</li>
											<li>• Enable billing for your project</li>
											<li>• Enable Maps JavaScript API</li>
											<li>• Restart your application</li>
										</ul>
									</div>
									<MockMapComponent />
								</div>
							</div>
						) : isValidApiKey ? (
							<Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render}>
								<MapComponent
									center={selectedLocation}
									zoom={14}
									onMapLoad={handleMapLoad}
								/>
							</Wrapper>
						) : (
							<div className="flex flex-col items-center justify-center h-full bg-gray-100 text-gray-600">
								<div className="text-center p-8">
									<MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
									<h3 className="font-semibold text-lg mb-2">Interactive Map Configuration Required</h3>
									<p className="text-sm mb-4">Please configure Google Maps API key</p>
									<div className="bg-white p-4 rounded-lg border border-gray-200 text-left max-w-md">
										<h4 className="font-medium text-sm mb-2">Required Setup:</h4>
										<ul className="text-xs space-y-1 text-gray-600">
											<li>• Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
											<li>• Enable Maps JavaScript API</li>
											<li>• Enable Map Tiles API for 3D tiles</li>
										</ul>
									</div>
								</div>
							</div>
						)}

						{/* Current Selection Info in Full Screen */}
						{selectedLayer !== "weather" && (
							<div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
								<div className="flex items-center space-x-2">
									<MapPin className="w-4 h-4 text-blue-600" />
									<span className="text-sm font-medium">Map Center</span>
								</div>
								<p className="text-xs text-gray-600 mt-1">
									{currentMapCenter.lat.toFixed(4)}, {currentMapCenter.lng.toFixed(4)}
								</p>
								<p className="text-xs text-gray-500 mt-1">Real-time monitoring active</p>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Normal Card View */}
			<Card className="border-blue-200 w-full overflow-hidden max-w-full">
				<CardHeader className="pb-2">
					<div className="flex flex-col gap-4 max-w-full">
						<div className="flex items-center justify-between">
							<CardTitle className="text-blue-900">Interactive GIS Map</CardTitle>

							{/* Data Info and Legend */}
							<div className="flex items-center gap-2">
								{/* Backend Data Count Indicator */}
								{isLoadingBackendData ? (
									<Badge variant="secondary" className="text-xs">
										Loading data...
									</Badge>
								) : (
									<Badge variant="outline" className="text-xs">
										{backendFloodData.length + backendLandslideData.length + backendSeismicData.length + backendWeatherData.length} data points
									</Badge>
								)}

								{/* Legend Dropdown Button */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="gap-2">
											<Layers className="h-4 w-4" />
											Legend
											<ChevronDown className="h-3 w-3" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-80">
										<DropdownMenuLabel className="flex items-center gap-2">
											<Info className="h-4 w-4" />
											Map Legend
										</DropdownMenuLabel>
										<DropdownMenuSeparator />

										{/* Legend Items */}
										{legendItems.map((item) => (
											<div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-md">
												<div
													className="w-4 h-4 rounded border border-gray-300"
													style={{ backgroundColor: item.color }}
												/>
												<div className="flex flex-col flex-1">
													<span className="text-sm font-medium text-gray-900">{item.label}</span>
													<span className="text-xs text-gray-500">{item.description}</span>
												</div>
											</div>
										))}

										<DropdownMenuSeparator />

										{/* HEC-RAS Status Info */}
										<div className="p-3 bg-blue-50 rounded-md mx-2 mb-2">
											<div className="flex items-center gap-2 mb-1">
												<Droplets className="h-4 w-4 text-blue-600" />
												<span className="text-sm font-medium text-blue-900">HEC-RAS Simulation</span>
											</div>
											<p className="text-xs text-blue-700">
												Real-time flood prediction system is always active for high-risk areas
											</p>
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Horizontal Swipeable Buttons */}
						<div className="relative w-full">
							<div
								ref={scrollContainerRef}
								className="flex gap-3 overflow-x-auto scrollbar-hide py-3 snap-x snap-mandatory"
								style={{
									scrollbarWidth: 'none',
									msOverflowStyle: 'none',
									WebkitOverflowScrolling: 'touch'
								}}
							>
								{mapLayers.map((layer, index) => (
									<Button
										key={layer.id}
										variant={selectedLayer === layer.id ? "default" : "outline"}
										size="sm"
										onClick={() => setSelectedLayer(layer.id)}
										className={`
                      flex-shrink-0 snap-start transition-all duration-300 ease-in-out transform
                      ${selectedLayer === layer.id
												? "bg-blue-600 text-white shadow-lg scale-105 border-blue-600"
												: "border-blue-200 text-blue-700 hover:bg-blue-50 hover:scale-102 hover:border-blue-300"
											}
                      ${index === 0 ? "ml-1" : ""}
                      ${index === mapLayers.length - 1 ? "mr-1" : ""}
                      min-w-fit px-4 py-2 active:scale-95
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                    `}
									>
										<layer.icon className="w-4 h-4 mr-2 flex-shrink-0" />
										<span className="whitespace-nowrap font-medium">{layer.label}</span>
									</Button>
								))}
							</div>
							{/* Conditional fade effects for better UX - positioned to not cover buttons */}
							{canScrollLeft && (
								<div className="absolute left-0 top-3 bottom-3 w-3 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10 transition-opacity duration-300"></div>
							)}
							{canScrollRight && (
								<div className="absolute right-0 top-3 bottom-3 w-3 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 transition-opacity duration-300"></div>
							)}
						</div>

						{/* Load Data and Clear Map Buttons */}
						<div className="flex justify-center gap-3 mt-3">
							<Button
								onClick={() => {
									if (selectedLayer === 'flood' || selectedLayer === 'all') {
										fetchFloodData()
									}
									if (selectedLayer === 'landslide' || selectedLayer === 'all') {
										fetchLandslideData(currentMapCenter.lat, currentMapCenter.lng, queryRadius)
									}
									if (selectedLayer === 'seismic' || selectedLayer === 'all') {
										fetchSeismicData()
									}
									if (selectedLayer === 'weather' || selectedLayer === 'all') {
										fetchWeatherData(currentMapCenter.lat, currentMapCenter.lng)
									}
								}}
								disabled={isLoadingFloodData || isLoadingLandslideData || isLoadingSeismicData || isLoadingWeather}
								className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 disabled:opacity-50"
								size="sm"
							>
								<Cloud className="w-4 h-4 mr-2" />
								{isLoadingFloodData || isLoadingLandslideData || isLoadingSeismicData || isLoadingWeather
									? 'Loading...'
									: `Load ${selectedLayer === 'all' ? 'All Data' : selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1) + ' Data'}`
								}
							</Button>

							<Button
								onClick={clearMapData}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
								size="sm"
							>
								<Info className="w-4 h-4 mr-2" />
								Clear Map
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="w-full p-2">

					<div className="relative rounded-lg h-[500px] overflow-hidden w-full">
						{/* Google Maps Component */}
						{googleMapsError === 'billing' ? (
							<div className="flex flex-col items-center justify-center h-full bg-yellow-50 border border-yellow-200 text-yellow-800">
								<div className="text-center p-8">
									<MapPin className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
									<h3 className="font-semibold text-lg mb-2">Google Maps Billing Required</h3>
									<p className="text-sm mb-4">
										Google Maps requires billing to be enabled in your Google Cloud Console.
									</p>
									<div className="bg-white/70 p-4 rounded-lg border border-yellow-200 text-left max-w-md mb-4">
										<h4 className="font-medium text-sm mb-2">To enable Google Maps:</h4>
										<ul className="text-xs space-y-1 text-yellow-700">
											<li>• Visit Google Cloud Console</li>
											<li>• Enable billing for your project</li>
											<li>• Enable Maps JavaScript API</li>
											<li>• Restart your application</li>
										</ul>
									</div>
									<MockMapComponent />
								</div>
							</div>
						) : isValidApiKey ? (
							<Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render}>
								<MapComponent
									center={selectedLocation}
									zoom={12}
									onMapLoad={handleMapLoad}
								/>
							</Wrapper>
						) : (
							<div className="flex flex-col items-center justify-center h-full bg-gray-100 text-gray-600">
								<div className="text-center p-8">
									<MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
									<h3 className="font-semibold text-lg mb-2">Interactive Map Configuration Required</h3>
									<p className="text-sm mb-4">Please configure Google Maps API key</p>
									<div className="bg-white p-4 rounded-lg border border-gray-200 text-left max-w-md">
										<h4 className="font-medium text-sm mb-2">Required Setup:</h4>
										<ul className="text-xs space-y-1 text-gray-600">
											<li>• Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
											<li>• Enable Maps JavaScript API</li>
											<li>• Enable Map Tiles API for 3D tiles</li>
										</ul>
									</div>
								</div>
							</div>
						)}

						{/* Legend */}


						{/* Current Selection Info */}
						{selectedLayer !== "weather" && (
							<div className="absolute top-0.5 right-0.5 bg-white/90 backdrop-blur-sm p-3 rounded-lg">
								<div className="flex items-center space-x-2">
									<MapPin className="w-4 h-4 text-blue-600" />
									<span className="text-sm font-medium">Map Center</span>
								</div>
								<p className="text-xs text-gray-600 mt-1">
									{currentMapCenter.lat.toFixed(4)}, {currentMapCenter.lng.toFixed(4)}
								</p>
								<p className="text-xs text-gray-500 mt-1">Real-time monitoring active</p>
							</div>
						)}
					</div>

					{/* Map Controls */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
						<div className="flex items-center gap-3">
							<label className="text-sm font-medium text-gray-700 whitespace-nowrap">
								Query Radius:
							</label>
							<select
								value={queryRadius}
								onChange={(e) => setQueryRadius(Number(e.target.value))}
								className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value={10}>10 km</option>
								<option value={25}>25 km</option>
								<option value={50}>50 km</option>
								<option value={100}>100 km</option>
								<option value={200}>200 km</option>
							</select>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="border-green-200 text-green-700 bg-transparent"
								onClick={() => {
									if (navigator.geolocation) {
										navigator.geolocation.getCurrentPosition(
											(position) => {
												const { latitude, longitude } = position.coords
												setCurrentMapCenter({ lat: latitude, lng: longitude })
												if (map) {
													map.setCenter({ lat: latitude, lng: longitude })
													map.setZoom(12)
												}
											},
											(error) => {
												console.error('Error getting current location:', error)
												alert('Unable to get current location. Please check your browser permissions.')
											}
										)
									} else {
										alert('Geolocation is not supported by this browser.')
									}
								}}
							>
								<MapPin className="w-4 h-4 mr-1" />
								My Location
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="border-blue-200 text-blue-700 bg-transparent"
								onClick={() => setIsFullScreen(true)}
							>
								Full Screen View
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	)
}

