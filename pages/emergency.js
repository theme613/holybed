import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Haversine formula to calculate distance between two lat/lng points
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Using only real Places API data - no mock data

// Function to fetch hospital data using Places Service (legacy but stable API)
const fetchNearbyHospitals = async (userLocation) => {
  console.log('🏥 Starting hospital search for location:', userLocation);

  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('❌ Google Maps API not ready');
    return [];
  }

  return new Promise((resolve) => {
    try {
      console.log('🔍 Initializing Places Service...');
      
      // Create a temporary map element for PlacesService
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);

      const request = {
        location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: 20000, // Increased to 20km for better coverage
        type: 'hospital',
        fields: ['place_id', 'name', 'geometry', 'formatted_address', 'vicinity', 'rating', 'user_ratings_total', 'business_status', 'opening_hours', 'types', 'international_phone_number']
      };

      // Note: Google Places API has a limit of 20 results per request
      // To get more results, we need to use pagination with nextPageToken

      console.log('📡 Sending nearbySearch request:', request);

      let allResults = [];
      let pageCount = 0;
      const maxPages = 3; // Get up to 60 results (20 per page)

      const searchPage = (pageToken = null) => {
        const pageRequest = { ...request };
        if (pageToken) {
          pageRequest.pageToken = pageToken;
        }

        service.nearbySearch(pageRequest, (results, status, pagination) => {
          pageCount++;
          console.log(`📥 Page ${pageCount} - Status: ${status}, Results: ${results ? results.length : 0}`);

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            allResults = allResults.concat(results);
            console.log(`📊 Total results so far: ${allResults.length}`);

            // Check if there are more pages and we haven't hit our limit
            if (pagination && pagination.hasNextPage && pageCount < maxPages) {
              console.log('📄 Getting next page of results...');
              // Small delay required by Google Places API
              setTimeout(() => {
                pagination.nextPage();
              }, 2000);
            } else {
              // Process all results
              console.log(`✅ Finished fetching ${allResults.length} total places`);
              console.log('🗂️ All places found by Google:', allResults.map(p => `${p.name} (${p.types?.join(', ') || 'no types'})`));
              
              const hospitals = allResults.map((place, index) => {
                console.log(`🏥 Processing hospital ${index + 1}:`, place.name);
                
                // Calculate distance first
                const distance = haversine(
                  userLocation.lat, 
                  userLocation.lng, 
                  place.geometry.location.lat(), 
                  place.geometry.location.lng()
                );
                
                let isOpen = true;
                if (place.opening_hours) {
                  isOpen = place.opening_hours.isOpen();
                  console.log(`⏰ ${place.name} is ${isOpen ? 'OPEN' : 'CLOSED'}`);
                } else {
                  console.log(`⏰ ${place.name} - No opening hours data (assuming OPEN)`);
                }

                // Check operational status but be more lenient
                const isOperational = !place.business_status || place.business_status === 'OPERATIONAL';
                console.log(`🏢 ${place.name} business status:`, place.business_status || 'OPERATIONAL');
                console.log(`📏 ${place.name} distance:`, distance.toFixed(1) + 'km');

                // For emergency situations, include operational hospitals even if closed
                // (Emergency departments often operate 24/7 even when main hospital is "closed")
                let shouldInclude = isOperational;
                let exclusionReason = '';

                if (!isOperational) {
                  exclusionReason = 'not operational';
                  shouldInclude = false;
                }

                if (!shouldInclude) {
                  console.log(`❌ Excluding ${place.name} - ${exclusionReason}`);
                  return null;
                }

                // Note if hospital appears closed but include it anyway for emergency
                if (!isOpen) {
                  console.log(`⚠️ Including ${place.name} despite appearing closed (emergency departments may still be open)`);
                }

                // Get the best available address
                let address = 'Address not available';
                if (place.formatted_address) {
                  address = place.formatted_address;
                  console.log(`📍 ${place.name} - Using formatted_address: ${address}`);
                } else if (place.vicinity) {
                  address = place.vicinity;
                  console.log(`📍 ${place.name} - Using vicinity: ${address}`);
                } else {
                  // Fallback: try to get address from reverse geocoding
                  console.log(`📍 ${place.name} - No address available, will use reverse geocoding`);
                  address = 'Getting address...';
                  
                  // We'll update this with reverse geocoding later
                  // For now, use coordinates as ultimate fallback
                  const coords = `${place.geometry.location.lat().toFixed(4)}, ${place.geometry.location.lng().toFixed(4)}`;
                  address = `Near ${coords}`;
                  console.log(`📍 ${place.name} - Using coordinates fallback: ${address}`);
                }

                const hospital = {
                  name: place.name,
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  address: address,
                  rating: place.rating || 0,
                  userRatingsTotal: place.user_ratings_total || 0,
                  isOpen: isOpen,
                  businessStatus: place.business_status || 'OPERATIONAL',
                  placeId: place.place_id,
                  distance: parseFloat(distance.toFixed(1))
                };

                console.log(`✅ Added hospital:`, hospital.name, `(${hospital.distance}km)`);
                return hospital;
              }).filter(h => h !== null);

              console.log(`🎯 Final result: ${hospitals.length} open hospitals found`);
              resolve(hospitals);
            }
          } else {
            console.error('❌ Places API error:', status);
            resolve([]);
          }
        });
      };

      // Start the search
      searchPage();

    } catch (error) {
      console.error('💥 Exception in fetchNearbyHospitals:', error);
      resolve([]);
    }
  });
};

export default function EmergencyPage() {
  const [symptoms, setSymptoms] = useState('');
  const [userLoc, setUserLoc] = useState(null); // {lat, lng}
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    emergencyOnly: false,
    surgeryAvailable: false,
    maxDistance: 20, // km
    notBusy: false
  });
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const router = useRouter();

  // 1. Get User Location using browser geolocation API
  const getUserLocation = () => {
    setLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLoc(location);
        console.log('User location obtained:', location);
        searchNearbyHospitals(location);
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error occurred.';
        }
        setLocationError(errorMessage);
        setLoading(false);
        
        // Fallback to KL center
        const fallbackLocation = { lat: 3.1390, lng: 101.6869 };
        setUserLoc(fallbackLocation);
        searchNearbyHospitals(fallbackLocation);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // 2. Search for Nearby Hospitals
  const searchNearbyHospitals = async (location) => {
    try {
      const hospitalData = await fetchNearbyHospitals(location);
      const rankedHospitals = rankHospitals(hospitalData, location);
      setHospitals(rankedHospitals);
      
      // Save user interaction to database
      await saveUserInteraction(location, rankedHospitals);
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching hospitals:', error);
      setLocationError('Failed to find nearby hospitals.');
      setLoading(false);
    }
  };

  // Save user interaction to MySQL database
  const saveUserInteraction = async (userLocation, hospitalRecommendations) => {
    try {
      const interactionData = {
        symptoms: symptoms || 'Emergency hospital search',
        mode: 'emergency',
        uploadedFiles: [],
        userLocation: userLocation,
        analysisResult: {
          category: 'Emergency',
          severity: 'emergency',
          recommendedDepartment: 'Emergency Department',
          recommendedAction: 'Seek immediate medical attention at the nearest hospital',
          urgencyExplanation: 'Emergency hospital search initiated',
          estimatedWaitTime: 'Varies by hospital',
          confidenceScore: 1.0
        },
        hospitalRecommendations: hospitalRecommendations
      };

      const response = await fetch('/api/save-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      if (response.ok) {
        console.log('✅ User interaction saved to database');
      } else {
        console.log('⚠️ Failed to save interaction to database');
      }
    } catch (error) {
      console.error('❌ Error saving interaction:', error);
      // Don't block the user experience if database save fails
    }
  };

  // 3. Rank hospitals by distance and rating only (real data)
  const rankHospitals = (hospitalList, userLocation) => {
    return hospitalList.map(hospital => {
      const distance = hospital.distance || haversine(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng);
      
      // Simple scoring based on real data: Distance 70%, Rating 30%
      const distanceScore = distance * 2; // Lower is better
      const ratingBonus = hospital.rating > 0 ? (5 - hospital.rating) * 2 : 5; // Lower is better
      
      const priorityScore = (distanceScore * 0.7) + (ratingBonus * 0.3);
      
      return {
        ...hospital,
        distance: parseFloat(distance.toFixed(1)),
        priorityScore: parseFloat(priorityScore.toFixed(2))
      };
    }).sort((a, b) => a.priorityScore - b.priorityScore); // Sort by lowest score (best)
  };

  // 4. Filter hospitals (no filters needed since we removed filter UI)
  const getFilteredHospitals = () => {
    return hospitals; // Return all hospitals since filters are removed
  };

  // 5. Initialize Google Maps when user location is available
  const initializeMap = () => {
    if (!userLoc || !mapRef.current) return;

    // Initialize Google Map
    const map = new window.google.maps.Map(mapRef.current, {
      center: userLoc,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapInstanceRef.current = map;
    
    // Initialize directions service and renderer
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      draggable: true
    });
    directionsRendererRef.current.setMap(map);

    // Add markers for hospitals
    addHospitalMarkers(map);
  };

  // 6. Add markers for hospitals with InfoWindows
  const addHospitalMarkers = (map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const filteredHospitals = getFilteredHospitals();

    // Add user location marker
    if (userLoc) {
      const userMarker = new window.google.maps.Marker({
        position: userLoc,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24)
        }
      });
      markersRef.current.push(userMarker);
    }

    // Add hospital markers
    filteredHospitals.forEach((hospital, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: hospital.lat, lng: hospital.lng },
        map: map,
        title: hospital.name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#DC2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <path d="M10 8h4v1h-1v4h-2V9h-1z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Create InfoWindow for each hospital
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(hospital, index + 1)
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(map, marker);
        setSelectedHospital(hospital);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  };

  // 7. Create InfoWindow content for hospitals
  const createInfoWindowContent = (hospital, rank) => {
    return `
      <div style="max-width: 300px; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">
          #${rank} ${hospital.name}
        </h3>
        <div style="margin-bottom: 8px;">
          <div style="color: #6b7280; font-size: 14px;">${hospital.address}</div>
          ${hospital.rating > 0 ? `<div style="color: #f59e0b; font-size: 12px;">⭐ ${hospital.rating} (${hospital.userRatingsTotal} reviews)</div>` : ''}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
          <div><strong>Distance:</strong> ${hospital.distance} km</div>
          <div><strong>Status:</strong> ${hospital.isOpen ? 'Open' : 'Emergency Available'}</div>
        </div>
        <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
          <span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">HOSPITAL</span>
          ${hospital.businessStatus === 'OPERATIONAL' ? '<span style="background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">OPERATIONAL</span>' : ''}
          ${hospital.isOpen ? '<span style="background: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">OPEN</span>' : '<span style="background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">EMERGENCY ONLY</span>'}
        </div>
        <div style="margin-top: 8px;">
          <button onclick="window.navigateToHospital('${hospital.name}')" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Get Directions
          </button>
        </div>
      </div>
    `;
  };

  // 8. Navigation using Directions API
  const navigateToHospital = (hospital) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !userLoc) return;

    const request = {
      origin: userLoc,
      destination: { lat: hospital.lat, lng: hospital.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);
        
        // Update hospital info with route details
        const route = result.routes[0];
        const leg = route.legs[0];
        console.log(`Route to ${hospital.name}:`, {
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.length
        });
      } else {
        console.error('Directions request failed:', status);
        alert('Unable to get directions to this hospital. Please try again.');
      }
    });
  };

  // Make navigation function globally available for InfoWindow buttons
  if (typeof window !== 'undefined') {
    window.navigateToHospital = (hospitalName) => {
      const hospital = hospitals.find(h => h.name === hospitalName);
      if (hospital) {
        navigateToHospital(hospital);
      }
    };
  }

  // Auto-get location on page load
  useEffect(() => {
    getUserLocation();
  }, []);

  // Initialize map when location and Google Maps are ready
  useEffect(() => {
    if (userLoc && window.google && window.google.maps) {
      initializeMap();
    }
  }, [userLoc, hospitals]);

  // Update markers when hospitals or filters change
  useEffect(() => {
    if (mapInstanceRef.current) {
      addHospitalMarkers(mapInstanceRef.current);
    }
  }, [hospitals, filters]);

  // Prefill symptoms from query string if available
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query?.symptoms;
    if (typeof q === 'string' && q.trim()) {
      setSymptoms(q);
    }
  }, [router.isReady, router.query]);

  const filteredHospitals = getFilteredHospitals();

  return (
    <>
      <Head>
        <title>Emergency Hospital Finder - HolyBed</title>
        <script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&v=weekly&loading=async&callback=initMap`}
          async
          defer
        ></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.initMap = function() {
              console.log('Google Maps API loaded successfully');
              window.googleMapsLoaded = true;
            }
          `
        }}></script>
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Go Back Button */}
        <button 
          onClick={() => router.push('/')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'white',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#dc2626';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#dc2626';
          }}
        >
          ← Go Back
        </button>

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32, marginTop: 20 }}>
            <h1 style={{ 
              fontSize: 36, 
              fontWeight: 800, 
              color: '#dc2626', 
              marginBottom: 8,
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              🚨 Emergency Hospital Finder
            </h1>
            <p style={{ fontSize: 18, color: '#7f1d1d', maxWidth: 600, margin: '0 auto' }}>
              Find the nearest available hospitals for emergency care. Get real-time information about bed availability, wait times, and directions.
            </p>
          </div>

          {/* Emergency Form */}
          <form onSubmit={(e) => { e.preventDefault(); getUserLocation(); }} style={{
            background: 'white',
            padding: 24,
            borderRadius: 16,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            marginBottom: 24,
            border: '2px solid #fca5a5'
          }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#dc2626' }}>
              Describe your emergency symptoms:
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Chest pain, difficulty breathing, severe injury, etc."
                style={{
                  flex: 1,
                  height: 56,
                  minHeight: 56,
                  resize: 'none',
                  padding: '14px 16px',
                  border: '2px solid #fca5a5',
                  borderRadius: 12,
                  outline: 'none',
                  fontSize: 16,
                  lineHeight: 1.5
                }}
              />
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  minWidth: 140,
                  height: 56,
                  alignSelf: 'stretch',
                  background: loading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  padding: '0 16px',
                  fontSize: 16
                }}
              >
                {loading ? '🔍 Searching...' : '🚨 Find Hospitals'}
              </button>
            </div>
          </form>


          {/* Error Message */}
          {locationError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              color: '#dc2626'
            }}>
              ⚠️ {locationError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
            {/* Hospital List - Top Left */}
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              height: 500,
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>
                Nearby Hospitals ({filteredHospitals.length})
              </h3>
              
              {filteredHospitals.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>
                  {loading ? '🔍 Searching for hospitals...' : 'No hospitals found. Try searching again.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredHospitals.map((hospital, index) => (
                    <div
                      key={hospital.name}
                      onClick={() => setSelectedHospital(hospital)}
                      style={{
                        padding: 16,
                        border: selectedHospital?.name === hospital.name ? '2px solid #dc2626' : '1px solid #e5e7eb',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedHospital?.name === hospital.name ? '#fef2f2' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#1f2937', fontSize: 16, fontWeight: 600 }}>
                            #{index + 1} {hospital.name}
                          </h4>
                          <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>
                            {hospital.address}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: '#dc2626' }}>{hospital.distance} km</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {hospital.isOpen ? '✅ Open' : '🏥 Emergency Available'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span style={{ 
                          background: '#22c55e', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: 10 
                        }}>
                          HOSPITAL
                        </span>
                        {hospital.businessStatus === 'OPERATIONAL' && (
                          <span style={{ background: '#059669', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                            OPERATIONAL
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#6b7280' }}>
                        <div>Distance: {hospital.distance} km</div>
                        <div>Rating: {hospital.rating > 0 ? `⭐ ${hospital.rating.toFixed(1)}` : 'No rating'}</div>
                      </div>
                      
                      {hospital.userRatingsTotal > 0 && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                          {hospital.userRatingsTotal} reviews
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map - Right Side */}
            <div style={{
              background: 'white',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              height: 500
            }}>
              <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
