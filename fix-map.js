// Script to fix the map in index.js
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'pages', 'index.js');

console.log('🗺️ Fixing KL Hospital Map...');

try {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // 1. Add useRef to imports
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';"
  );
  
  // 2. Add map state variables after existing state
  const mapStateToAdd = `
  // Map related state
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);`;
  
  content = content.replace(
    'const markersRef = useRef([]);',
    'const markersRef = useRef([]);'
  );
  
  if (!content.includes('const mapRef = useRef(null);')) {
    content = content.replace(
      'const [isRefreshing, setIsRefreshing] = useState(false);',
      `const [isRefreshing, setIsRefreshing] = useState(false);${mapStateToAdd}`
    );
  }
  
  // 3. Replace map placeholder with actual map div
  const mapPlaceholder = `                <div className="hospital-map">
                  <div className="map-placeholder">
                    <i className="fas fa-map-marker-alt"></i>
                    <p>Interactive Hospital Location Map</p>
                    <small>Showing hospitals with available capacity in green</small>
                  </div>
                </div>`;
                
  const actualMap = `                <div className="hospital-map">
                  <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '8px', border: '1px solid #e5e7eb' }}></div>
                </div>`;
  
  content = content.replace(mapPlaceholder, actualMap);
  
  // 4. Add map functions before getUserLocation
  const mapFunctions = `
  // Initialize Google Maps
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const klCenter = { lat: 3.1390, lng: 101.6869 }; // KL center
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: klCenter,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi.medical',
          elementType: 'geometry',
          stylers: [{ color: '#22c55e' }]
        }
      ]
    });

    mapInstanceRef.current = map;
    addHospitalMarkers(map);
  };

  // Add hospital markers to the map
  const addHospitalMarkers = (map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Use real hospital data if available, otherwise use mock data
    const hospitalsToShow = hospitalData.length > 0 ? hospitalData : allHospitals;

    hospitalsToShow.forEach((hospital, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: hospital.lat, lng: hospital.lng },
        map: map,
        title: hospital.name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(\`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#22c55e">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <path d="M10 8h4v1h-1v4h-2V9h-1z" fill="white"/>
            </svg>
          \`),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Create InfoWindow for each hospital
      const infoWindow = new window.google.maps.InfoWindow({
        content: \`
          <div style="max-width: 250px; padding: 12px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">\${hospital.name}</h3>
            <div style="margin-bottom: 8px;">
              <div style="color: #22c55e; font-weight: bold; font-size: 14px;">✅ Available</div>
              <div style="color: #6b7280; font-size: 13px;">
                \${hospital.availableBeds || 'N/A'} beds available
              </div>
              \${hospital.waitTime ? \`<div style="color: #6b7280; font-size: 13px;">Wait time: \${hospital.waitTime} min</div>\` : ''}
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: #22c55e; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">HOSPITAL</span>
              <span style="background: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">OPEN</span>
            </div>
          </div>
        \`
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(map, marker);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  };

`;

  // Insert map functions before getUserLocation
  content = content.replace(
    '  // Get user\'s current location',
    mapFunctions + '  // Get user\'s current location'
  );
  
  // 5. Add useEffect for map initialization
  const mapUseEffect = `
  // Initialize map when Google Maps is ready
  useEffect(() => {
    if (window.google && window.google.maps) {
      initializeMap();
    }
  }, [hospitalData]);
`;

  // Add after existing useEffect hooks
  content = content.replace(
    '  }, [nextUpdate, isRealtime]);',
    `  }, [nextUpdate, isRealtime]);${mapUseEffect}`
  );
  
  // Write the updated content back
  fs.writeFileSync(indexPath, content, 'utf8');
  
  console.log('✅ Map has been successfully fixed!');
  console.log('🗺️ The KL Hospital Map should now display interactive Google Maps with hospital markers');
  console.log('📍 Features added:');
  console.log('   - Interactive Google Maps');
  console.log('   - Hospital markers with custom icons');
  console.log('   - Clickable info windows');
  console.log('   - Real-time hospital data integration');
  
} catch (error) {
  console.error('❌ Error fixing map:', error.message);
}
