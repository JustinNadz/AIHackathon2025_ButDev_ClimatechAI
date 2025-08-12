import React, { useEffect, useRef, useState } from 'react';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Side Panel */}
      <div style={{
        width: sidebarCollapsed ? '0px' : '350px',
        height: '100%',
        backgroundColor: '#f7f9fc',
        borderRight: sidebarCollapsed ? 'none' : '1px solid #e3e8ef',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease-in-out'
      }}>
        {/* ClimaTech AI Header */}
        <div style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e3e8ef',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#ffc107',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '20px'
          }}>
            🛡️
          </div>
          <div>
            <h1 style={{
              margin: '0',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1a202c'
            }}>
              ClimaTech AI
            </h1>
            <p style={{
              margin: '0',
              fontSize: '14px',
              color: '#4299e1'
            }}>
              Disaster Management
            </p>
          </div>
        </div>

        {/* Main Navigation Header */}
        <div style={{
          padding: '16px 20px 12px 20px',
          backgroundColor: '#f7f9fc'
        }}>
          <h3 style={{
            margin: '0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#4299e1',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Main Navigation
          </h3>
        </div>

        {/* Navigation Items */}
        <div style={{
          flex: '1',
          backgroundColor: '#f7f9fc'
        }}>
          {/* Emergency Response */}
          <div style={{
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '12px', fontSize: '16px' }}>🚨</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Emergency Response
            </span>
          </div>

          {/* Emergency Reports */}
          <div style={{
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '12px', fontSize: '16px' }}>📋</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Emergency Reports
            </span>
          </div>

          {/* Additional Navigation Items */}
          <div style={{
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '12px', fontSize: '16px' }}>⚙️</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              System Management
            </span>
          </div>

          <div style={{
            padding: '12px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '12px', fontSize: '16px' }}>❓</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Help & Support
            </span>
          </div>
        </div>


      </div>

      {/* Map Container */}
      <div style={{ 
        flex: '1', 
        height: '100%',
        position: 'relative'
      }}>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '20px',
            left: sidebarCollapsed ? '20px' : '20px',
            zIndex: 1000,
            width: '44px',
            height: '44px',
            backgroundColor: '#ffffff',
            border: '1px solid #e3e8ef',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '18px',
            color: '#4299e1',
            transition: 'all 0.2s ease',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f7f9fc';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.transform = 'scale(1)';
          }}
          title={sidebarCollapsed ? 'Show ClimaTech AI Panel' : 'Hide ClimaTech AI Panel'}
        >
          {sidebarCollapsed ? '☰' : '✕'}
        </button>

        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: '#e9ecef'
          }}
        />
      </div>
    </div>
  );
};

export default MapComponent;
