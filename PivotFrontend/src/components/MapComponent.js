import React, { useEffect, useRef } from 'react';

const MapComponent = () => {
  const mapRef = useRef(null);

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
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 14.5995, lng: 120.9842 }, // Manila, Philippines
            zoom: 10,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
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
