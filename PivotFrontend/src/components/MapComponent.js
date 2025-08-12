import React, { useEffect, useRef } from 'react';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Get API key from environment variable
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not found. Add REACT_APP_GOOGLE_MAPS_API_KEY to .env.local');
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (mapRef.current && window.google) {
          // Define Iloilo City boundaries
          const iloiloBounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(10.65, 122.50), // Southwest corner
            new window.google.maps.LatLng(10.79, 122.62)  // Northeast corner
          );

          // Initialize map focused on Iloilo City
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: 10.7202, lng: 122.5621 }, // Iloilo City center
            zoom: 12,
            minZoom: 10,
            maxZoom: 16,
            restriction: {
              latLngBounds: iloiloBounds,
              strictBounds: true
            },
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.business",
                elementType: "all", 
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.attraction",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.government",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.medical",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.park",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.place_of_worship",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.school",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "poi.sports_complex",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              },
              {
                featureType: "transit",
                elementType: "all",
                stylers: [{ visibility: "off" }]
              }
            ]
          });


        }
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
      };

      document.head.appendChild(script);

      return () => {
        // Cleanup script when component unmounts
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    };

    loadGoogleMaps();
  }, []);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: '#e9ecef'
      }}
    />
  );
};

export default MapComponent;
