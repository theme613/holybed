import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Result() {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedResults, setSavedResults] = useState([]);
  const [recommendedHospitals, setRecommendedHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [preventiveAnalysis, setPreventiveAnalysis] = useState(null);
  
  // Map related state
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Get analysis result from localStorage or router query
    const storedResult = localStorage.getItem('latestAnalysis');
    const storedSearchData = localStorage.getItem('searchData');
    
    if (storedResult) {
      setAnalysisResult(JSON.parse(storedResult));
    }
    
    if (storedSearchData) {
      setSearchData(JSON.parse(storedSearchData));
    }
    
    // Load saved results history
    const savedResultsData = localStorage.getItem('savedAnalysisResults');
    if (savedResultsData) {
      setSavedResults(JSON.parse(savedResultsData));
    }
    
    // Load preventive analysis if available
    const storedPreventiveAnalysis = localStorage.getItem('preventiveAnalysis');
    if (storedPreventiveAnalysis) {
      setPreventiveAnalysis(JSON.parse(storedPreventiveAnalysis));
    }
    
    setLoading(false);
  }, []);

  // Get user location and fetch hospitals when analysis result is available
  useEffect(() => {
    if (analysisResult) {
      getUserLocationAndFetchHospitals();
    }
  }, [analysisResult]);

  // Save user interaction when hospitals are loaded
  useEffect(() => {
    if (analysisResult && recommendedHospitals.length > 0 && userLocation) {
      saveUserInteractionToDatabase();
    }
  }, [analysisResult, recommendedHospitals, userLocation]);

  // Initialize map when hospitals are loaded
  useEffect(() => {
    if (recommendedHospitals.length > 0 && window.google && window.google.maps) {
      initializeMap();
    }
  }, [recommendedHospitals]);

  // Listen for Google Maps API load
  useEffect(() => {
    const handleGoogleMapsLoad = () => {
      if (recommendedHospitals.length > 0) {
        initializeMap();
      }
    };

    window.addEventListener('google-maps-loaded', handleGoogleMapsLoad);
    
    return () => {
      window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad);
    };
  }, [recommendedHospitals]);

  const getUserLocationAndFetchHospitals = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          fetchRecommendedHospitals(analysisResult.category, analysisResult.recommendedDepartment, location);
        },
        (error) => {
          console.log('Location access denied, using default KL location');
          const defaultLocation = { lat: 3.1390, lng: 101.6869 }; // KL center
          setUserLocation(defaultLocation);
          fetchRecommendedHospitals(analysisResult.category, analysisResult.recommendedDepartment, defaultLocation);
        }
      );
    } else {
      const defaultLocation = { lat: 3.1390, lng: 101.6869 };
      setUserLocation(defaultLocation);
      fetchRecommendedHospitals(analysisResult.category, analysisResult.recommendedDepartment, defaultLocation);
    }
  };

  const fetchRecommendedHospitals = async (category, department, location) => {
    setHospitalsLoading(true);
    console.log(`🏥 Starting hospital search for ${category} near location:`, location);

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('❌ Google Maps API not ready');
      setHospitalsLoading(false);
      return;
    }

    try {
      // Use Google Places API directly (same as emergency.js)
      const hospitals = await searchHospitalsWithPlacesAPI(location, category, department);
      setRecommendedHospitals(hospitals);
      console.log(`✅ Found ${hospitals.length} hospitals for ${category}`);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setHospitalsLoading(false);
    }
  };

  // Function to search hospitals using Google Places API (same approach as emergency.js)
  const searchHospitalsWithPlacesAPI = async (userLocation, category, department) => {
    return new Promise((resolve) => {
      try {
        console.log('🔍 Initializing Places Service...');
        
        // Create a temporary map element for PlacesService
        const mapDiv = document.createElement('div');
        const map = new window.google.maps.Map(mapDiv);
        const service = new window.google.maps.places.PlacesService(map);

        // Create search query based on medical category
        const categorySearchTerms = {
          'Cardiovascular': 'cardiovascular hospital',
          'Cardiology': 'cardiology hospital',
          'Cardiac': 'cardiac hospital',
          'Heart': 'heart hospital',
          'Neurology': 'neurology hospital',
          'Neurological': 'neurological hospital',
          'Brain': 'brain hospital',
          'Orthopedics': 'orthopedic hospital',
          'Orthopedic': 'orthopedic hospital',
          'Bone': 'orthopedic hospital',
          'Surgery': 'surgery hospital',
          'Surgical': 'surgical hospital',
          'Emergency': 'emergency hospital',
          'Urgent': 'emergency hospital',
          'Oncology': 'oncology hospital',
          'Cancer': 'cancer hospital',
          'Pediatrics': 'pediatric hospital',
          'Pediatric': 'pediatric hospital',
          'Children': 'children hospital',
          'Internal Medicine': 'internal medicine hospital',
          'General': 'general hospital',
          'Obstetrics': 'maternity hospital',
          'Gynecology': 'gynecology hospital',
          'Women': 'women hospital'
        };

        const searchQuery = categorySearchTerms[category] || 'hospital';
        console.log(`🔍 Searching for: "${searchQuery}" near user location`);

        const request = {
          location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          radius: 15000, // 15km
          query: searchQuery // Use specific medical category search
        };

        console.log(`📡 Sending textSearch request for: "${searchQuery}"...`);

        let allResults = [];
        let pageCount = 0;
        const maxPages = 3; // Get up to 60 results (20 per page)

        const searchPage = (pageToken = null) => {
          const pageRequest = { ...request };
          if (pageToken) {
            pageRequest.pageToken = pageToken;
          }

          service.textSearch(pageRequest, (results, status, pagination) => {
            pageCount++;
            console.log(`📥 Page ${pageCount} - Status: ${status}, Results: ${results ? results.length : 0}`);

            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              allResults = allResults.concat(results);
              console.log(`📊 Total results so far: ${allResults.length}`);

              // Check if there are more pages and we haven't hit our limit
              if (pagination && pagination.hasNextPage && pageCount < maxPages) {
                console.log('📄 Getting next page of results...');
                setTimeout(() => {
                  pagination.nextPage();
                }, 2000);
              } else {
                // Process all results
                console.log(`✅ Finished fetching ${allResults.length} total places`);
                processHospitalResults(allResults, userLocation, category, department, resolve);
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
        console.error('💥 Exception in searchHospitalsWithPlacesAPI:', error);
        resolve([]);
      }
    });
  };

  // Process and filter hospital results based on category
  const processHospitalResults = (places, userLocation, category, department, resolve) => {
    console.log(`🏥 Processing ${places.length} hospitals for category: ${category}`);

    // Calculate distance helper function
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Category matching keywords
    const categoryKeywords = {
      'Cardiology': ['cardiology', 'heart', 'cardiac', 'cardiovascular'],
      'Cardiac': ['cardiology', 'heart', 'cardiac', 'cardiovascular'],
      'Heart': ['cardiology', 'heart', 'cardiac', 'cardiovascular'],
      'Neurology': ['neurology', 'neurological', 'brain', 'neuro', 'stroke'],
      'Neurological': ['neurology', 'neurological', 'brain', 'neuro', 'stroke'],
      'Brain': ['neurology', 'neurological', 'brain', 'neuro', 'stroke'],
      'Orthopedics': ['orthopedic', 'orthopedics', 'bone', 'joint', 'spine'],
      'Orthopedic': ['orthopedic', 'orthopedics', 'bone', 'joint', 'spine'],
      'Bone': ['orthopedic', 'orthopedics', 'bone', 'joint', 'spine'],
      'Surgery': ['surgery', 'surgical'],
      'Surgical': ['surgery', 'surgical'],
      'Emergency': ['emergency', 'urgent', 'trauma', 'general'],
      'Urgent': ['emergency', 'urgent', 'trauma', 'general'],
      'Oncology': ['oncology', 'cancer', 'tumor'],
      'Cancer': ['oncology', 'cancer', 'tumor'],
      'Pediatrics': ['pediatric', 'pediatrics', 'children', 'child'],
      'Pediatric': ['pediatric', 'pediatrics', 'children', 'child'],
      'Children': ['pediatric', 'pediatrics', 'children', 'child'],
      'Internal Medicine': ['internal', 'medicine', 'general'],
      'General': ['internal', 'medicine', 'general'],
      'Obstetrics': ['obstetric', 'obstetrics', 'gynecology', 'women', 'maternity'],
      'Gynecology': ['obstetric', 'obstetrics', 'gynecology', 'women', 'maternity'],
      'Women': ['obstetric', 'obstetrics', 'gynecology', 'women', 'maternity']
    };

    const processedHospitals = places.map((place, index) => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        place.geometry.location.lat(), 
        place.geometry.location.lng()
      );

      const hospitalName = place.name.toLowerCase();
      
      // Determine specialties based on hospital name and category
      let matchedSpecialties = [category]; // Primary specialty from search
      let specialtyScore = 3; // High score since Google found it for this category

      // Check if it's a general hospital (lower specialty score)
      if (hospitalName.includes('general') && !hospitalName.includes(category.toLowerCase())) {
        specialtyScore = 2;
      }

      // Determine if government or private based on name patterns
      const isGovernment = hospitalName.includes('hospital') && 
                          (hospitalName.includes('kuala lumpur') || 
                           hospitalName.includes('general') || 
                           hospitalName.includes('government') ||
                           hospitalName.includes('university') ||
                           hospitalName.includes('kementerian'));

      return {
        id: place.place_id || `place_${index}`,
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.vicinity || 'Address not available',
        phone: place.formatted_phone_number || 'Phone not available',
        rating: place.rating || 0,
        availableBeds: 'Contact hospital', // Real hospitals don't expose this via API
        waitTime: 'Contact hospital', // Real hospitals don't expose this via API
        isGovernment: isGovernment,
        distance: parseFloat(distance.toFixed(1)),
        matchedSpecialties: matchedSpecialties,
        specialtyScore: specialtyScore,
        recommendationScore: Math.max(95 - (index * 2), 70),
        placeId: place.place_id,
        businessStatus: place.business_status,
        priceLevel: place.price_level,
        userRatingsTotal: place.user_ratings_total || 0
      };
    });

    // Sort by specialty match first, then by distance
    const sortedHospitals = processedHospitals.sort((a, b) => {
      if (a.specialtyScore !== b.specialtyScore) {
        return b.specialtyScore - a.specialtyScore; // Higher specialty score first
      }
      return a.distance - b.distance; // Then by distance
    });

    // Limit to top 10 results
    const finalResults = sortedHospitals.slice(0, 10);
    
    console.log(`🎯 Final results: ${finalResults.length} hospitals, top 3 specialized for ${category}`);
    resolve(finalResults);
  };

  // Initialize Google Maps
  const initializeMap = () => {
    if (!mapRef.current || !window.google || recommendedHospitals.length === 0) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: userLocation || { lat: 3.1390, lng: 101.6869 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapInstanceRef.current = map;
    addHospitalMarkers(map);
  };

  // Add hospital markers to the map
  // Save user interaction to MySQL database
  const saveUserInteractionToDatabase = async () => {
    try {
      const interactionData = {
        symptoms: searchData?.symptoms || 'Symptom analysis',
        mode: 'normal',
        uploadedFiles: searchData?.uploadedFiles || [],
        userLocation: userLocation,
        analysisResult: analysisResult,
        hospitalRecommendations: recommendedHospitals
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

  const addHospitalMarkers = (map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker if available
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2196f3">
              <circle cx="12" cy="12" r="8" fill="#2196f3" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24)
        }
      });
      markersRef.current.push(userMarker);
    }

    // Add hospital markers
    recommendedHospitals.forEach((hospital, index) => {
      const isTopRecommended = index < 3;
      const marker = new window.google.maps.Marker({
        position: { lat: hospital.lat, lng: hospital.lng },
        map: map,
        title: hospital.name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${isTopRecommended ? '#ff4444' : '#22c55e'}">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <path d="M10 8h4v1h-1v4h-2V9h-1z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Create InfoWindow
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 280px; padding: 12px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${hospital.name}</h3>
            ${isTopRecommended ? '<div style="background: #ff4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-bottom: 8px; display: inline-block;">TOP RECOMMENDED</div>' : ''}
            <div style="margin-bottom: 8px;">
              <div style="color: #22c55e; font-weight: bold; font-size: 14px;">⭐ ${hospital.rating}/5.0</div>
              <div style="color: #6b7280; font-size: 13px;">
                ${hospital.availableBeds} beds available • ${hospital.waitTime} wait
              </div>
              ${hospital.distance ? `<div style="color: #6b7280; font-size: 13px;">📍 ${hospital.distance.toFixed(1)} km away</div>` : ''}
            </div>
            <div style="margin-bottom: 8px;">
              <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Specialties:</div>
              <div style="font-size: 11px; color: #666;">
                ${hospital.matchedSpecialties.join(', ')}
              </div>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: #22c55e; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">AVAILABLE</span>
              ${hospital.isGovernment ? '<span style="background: #3b82f6; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">GOVERNMENT</span>' : '<span style="background: #8b5cf6; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">PRIVATE</span>'}
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <a href="tel:${hospital.phone}" style="color: #3b82f6; text-decoration: none; font-size: 12px;">📞 ${hospital.phone}</a>
            </div>
          </div>
        `
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

  const saveResult = () => {
    if (!analysisResult) return;
    
    const resultToSave = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      analysis: analysisResult,
      searchData: searchData,
      symptoms: searchData?.symptoms || '',
      mode: searchData?.mode || 'normal'
    };
    
    const existingSaved = JSON.parse(localStorage.getItem('savedAnalysisResults') || '[]');
    const updatedSaved = [resultToSave, ...existingSaved].slice(0, 10); // Keep last 10 results
    
    localStorage.setItem('savedAnalysisResults', JSON.stringify(updatedSaved));
    setSavedResults(updatedSaved);
    
    alert('✅ Result saved successfully!');
  };

  const deleteResult = (id) => {
    const updatedSaved = savedResults.filter(result => result.id !== id);
    localStorage.setItem('savedAnalysisResults', JSON.stringify(updatedSaved));
    setSavedResults(updatedSaved);
  };

  const goBack = () => {
    router.push('/');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'emergency': return '#ff4444';
      case 'urgent': return '#ff8800';
      case 'moderate': return '#ffaa00';
      case 'mild': return '#4CAF50';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'emergency': return 'fa-exclamation-triangle';
      case 'urgent': return 'fa-clock';
      case 'moderate': return 'fa-info-circle';
      case 'mild': return 'fa-check-circle';
      default: return 'fa-question-circle';
    }
  };

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <i className="fas fa-spinner fa-spin" style={{fontSize: '2rem', color: '#007bff'}}></i>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <>
        <Head>
          <title>No Results - Holy bed</title>
        </Head>
        <div style={{padding: '40px', textAlign: 'center'}}>
          <h2>No Analysis Results Found</h2>
          <p>Please go back and perform a symptom analysis first.</p>
          <button onClick={goBack} style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            Go Back to Search
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Analysis Results - Holy bed</title>
        <meta name="description" content="Your symptom analysis results" />
        <script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD-AGIwmIduMMKvK9xtfSyN55xUmqEBdEQ&libraries=places,marker,geometry&v=weekly&callback=initMap"
          async
          defer
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function initMap() {
                console.log('Google Maps API loaded successfully');
                window.dispatchEvent(new Event('google-maps-loaded'));
              }
            `,
          }}
        />
      </Head>

      <div style={{background: 'var(--bg-primary)', minHeight: '100vh'}}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '20px 0',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '0 20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <i className="fas fa-hospital" style={{fontSize: '1.8rem', color: '#007bff'}}></i>
                <h1 style={{fontSize: '1.5rem', fontWeight: '600', margin: 0}}>
                  Holy <span style={{color: '#007bff'}}>bed</span>
                </h1>
              </div>
              <button onClick={goBack} style={{
                padding: '10px 20px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-arrow-left"></i>
                Back to Search
              </button>
            </div>
          </div>
        </header>

        <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
          {/* Main Analysis Result */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderLeft: `6px solid ${getSeverityColor(analysisResult.severity)}`
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px'}}>
              <div>
                <h2 style={{
                  color: getSeverityColor(analysisResult.severity),
                  fontSize: '1.8rem',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className={`fas ${getSeverityIcon(analysisResult.severity)}`}></i>
                  {analysisResult.severity.toUpperCase()} Priority
                </h2>
                <p style={{color: '#666', fontSize: '14px', margin: 0}}>
                  Analysis completed at {new Date().toLocaleString()}
                </p>
              </div>
              <button onClick={saveResult} style={{
                padding: '10px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}>
                <i className="fas fa-save"></i>
                Save Result
              </button>
            </div>

            {/* Analysis Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '25px'
            }}>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{margin: '0 0 8px 0', color: '#495057'}}>Medical Category</h4>
                <p style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#212529'}}>
                  {analysisResult.category}
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{margin: '0 0 8px 0', color: '#495057'}}>Recommended Department</h4>
                <p style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#212529'}}>
                  {analysisResult.recommendedDepartment}
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{margin: '0 0 8px 0', color: '#495057'}}>Estimated Wait Time</h4>
                <p style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#212529'}}>
                  {analysisResult.estimatedWaitTime}
                </p>
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{marginBottom: '20px'}}>
              <h4 style={{marginBottom: '12px', color: '#495057'}}>Recommended Action:</h4>
              <div style={{
                background: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{margin: '0 0 16px 0', lineHeight: '1.6'}}>{analysisResult.recommendedAction}</p>
                
                {/* Top 3 Recommended Hospitals */}
                {hospitalsLoading ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#666'}}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Finding specialized hospitals for {analysisResult.category}...</span>
                  </div>
                ) : recommendedHospitals.length > 0 ? (
                  <div>
                    <h5 style={{margin: '0 0 12px 0', color: '#1976d2', fontSize: '14px', fontWeight: '600'}}>
                      🏥 Top 3 Recommended Hospitals for {analysisResult.category}:
                    </h5>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {recommendedHospitals.slice(0, 3).map((hospital, index) => (
                        <div key={hospital.id} style={{
                          background: 'white',
                          border: '1px solid #e3f2fd',
                          borderRadius: '6px',
                          padding: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{flex: 1}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                              <span style={{
                                background: index === 0 ? '#ff4444' : index === 1 ? '#ff8800' : '#ffaa00',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                #{index + 1}
                              </span>
                              <h6 style={{margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>
                                {hospital.name}
                              </h6>
                              <span style={{
                                background: '#22c55e',
                                color: 'white',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontSize: '9px',
                                fontWeight: 'bold'
                              }}>
                                ⭐ {hospital.rating}
                              </span>
                            </div>
                            <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>
                              📍 {hospital.distance ? `${hospital.distance.toFixed(1)} km away` : 'Distance calculating...'} • 
                              🛏️ {hospital.availableBeds} beds • ⏱️ {hospital.waitTime}
                            </div>
                            <div style={{fontSize: '11px', color: '#888'}}>
                              Specialties: {hospital.matchedSpecialties.join(', ')}
                            </div>
                          </div>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end'}}>
                            <a 
                              href={`tel:${hospital.phone}`}
                              style={{
                                background: '#22c55e',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              📞 Call Now
                            </a>
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              🗺️ Directions
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Explanation */}
            <div style={{marginBottom: '20px'}}>
              <h4 style={{marginBottom: '12px', color: '#495057'}}>Medical Explanation:</h4>
              <p style={{margin: 0, lineHeight: '1.6', color: '#666'}}>
                {analysisResult.urgencyExplanation}
              </p>
            </div>

            {/* Hospital Map */}
            {recommendedHospitals.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h4 style={{marginBottom: '12px', color: '#495057'}}>
                  🗺️ Specialized Hospitals Near You ({analysisResult.category})
                </h4>
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{marginBottom: '12px', fontSize: '14px', color: '#666'}}>
                    <span style={{color: '#2196f3'}}>🔵 Your Location</span> • 
                    <span style={{color: '#ff4444', marginLeft: '12px'}}>🔴 Top 3 Recommended</span> • 
                    <span style={{color: '#22c55e', marginLeft: '12px'}}>🟢 Other Specialized Hospitals</span>
                  </div>
                  <div 
                    ref={mapRef} 
                    style={{ 
                      width: '100%', 
                      height: '400px', 
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      background: '#f0f0f0'
                    }}
                  >
                    {!window.google && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#666',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <i className="fas fa-map-marker-alt" style={{fontSize: '2rem'}}></i>
                        <p>Loading Google Maps...</p>
                      </div>
                    )}
                  </div>
                  <div style={{marginTop: '12px', fontSize: '12px', color: '#888'}}>
                    Click on hospital markers to see details, ratings, and contact information.
                  </div>
                </div>
              </div>
            )}

            {/* Original Search Data */}
            {searchData && (
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '20px'
              }}>
                <h4 style={{marginBottom: '12px', color: '#495057'}}>Original Symptoms:</h4>
                <p style={{margin: 0, fontStyle: 'italic', color: '#666'}}>
                  "{searchData.symptoms}"
                </p>
                {searchData.pdfContent && (
                  <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#888'}}>
                    <i className="fas fa-file-pdf"></i> Medical document was also analyzed
                  </p>
                )}
              </div>
            )}

            {/* Emergency Alert */}
            {analysisResult.severity === 'emergency' && (
              <div style={{
                background: '#ffebee',
                border: '2px solid #ff4444',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px'
              }}>
                <h4 style={{color: '#ff4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <i className="fas fa-ambulance"></i>
                  EMERGENCY ALERT
                </h4>
                <p style={{color: '#d32f2f', margin: 0, fontWeight: '600'}}>
                  This appears to be a medical emergency. Please call 999 immediately or go to the nearest emergency room.
                </p>
              </div>
            )}
          </div>

          {/* Preventive Care Analysis Results */}
          {preventiveAnalysis && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
              borderRadius: '16px',
              padding: '30px',
              marginBottom: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderLeft: '6px solid #10b981'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px'}}>
                <div>
                  <h2 style={{
                    color: '#059669',
                    fontSize: '1.8rem',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="fas fa-shield-alt"></i>
                    Preventive Care Recommendations
                  </h2>
                  <p style={{color: '#666', fontSize: '14px', margin: 0}}>
                    Based on your healthcare document analysis
                  </p>
                </div>
                
                <div style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid #f59e0b'
                }}>
                  Prevention First
                </div>
              </div>
              
              <div style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
                <strong>Medical Disclaimer:</strong> These are general preventive care suggestions. Always consult with your healthcare provider before making significant changes.
              </div>

              {/* Risk Factors */}
              {preventiveAnalysis.riskFactors && preventiveAnalysis.riskFactors.length > 0 && (
                <div style={{marginBottom: '24px'}}>
                  <h3 style={{color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fas fa-exclamation-circle"></i>
                    Identified Risk Factors
                  </h3>
                  <div style={{display: 'grid', gap: '12px'}}>
                    {preventiveAnalysis.riskFactors.map((risk, index) => (
                      <div key={index} style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        border: `2px solid ${
                          risk.severity === 'high' ? '#f87171' :
                          risk.severity === 'moderate' ? '#fbbf24' : '#86efac'
                        }`,
                        borderLeft: `6px solid ${
                          risk.severity === 'high' ? '#ef4444' :
                          risk.severity === 'moderate' ? '#f59e0b' : '#22c55e'
                        }`
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                          <h4 style={{color: '#374151', margin: 0}}>{risk.factor}</h4>
                          <span style={{
                            background: risk.severity === 'high' ? '#fef2f2' :
                                       risk.severity === 'moderate' ? '#fefbf0' : '#f0fdf4',
                            color: risk.severity === 'high' ? '#dc2626' :
                                   risk.severity === 'moderate' ? '#d97706' : '#16a34a',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {risk.severity} Risk
                          </span>
                        </div>
                        <p style={{color: '#6b7280', fontSize: '14px', margin: 0}}>{risk.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventive Measures */}
              {preventiveAnalysis.preventiveMeasures && (
                <div style={{marginBottom: '24px'}}>
                  <h3 style={{color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fas fa-heart"></i>
                    Preventive Measures
                  </h3>

                  {/* Lifestyle Recommendations */}
                  {preventiveAnalysis.preventiveMeasures.lifestyle && preventiveAnalysis.preventiveMeasures.lifestyle.length > 0 && (
                    <div style={{marginBottom: '20px'}}>
                      <h4 style={{color: '#059669', marginBottom: '12px'}}>🌱 Lifestyle Recommendations</h4>
                      <div style={{display: 'grid', gap: '10px'}}>
                        {preventiveAnalysis.preventiveMeasures.lifestyle.map((lifestyle, index) => (
                          <div key={index} style={{
                            background: 'white',
                            padding: '14px',
                            borderRadius: '8px',
                            border: '1px solid #d1fae5',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                          }}>
                            <div style={{
                              background: lifestyle.priority === 'high' ? '#dc2626' :
                                         lifestyle.priority === 'medium' ? '#f59e0b' : '#22c55e',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              minWidth: '60px',
                              textAlign: 'center',
                              textTransform: 'uppercase'
                            }}>
                              {lifestyle.priority}
                            </div>
                            <div style={{flex: 1}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                                <span style={{
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {lifestyle.category}
                                </span>
                                <span style={{
                                  color: '#6b7280',
                                  fontSize: '12px'
                                }}>
                                  Timeline: {lifestyle.timeframe}
                                </span>
                              </div>
                              <p style={{margin: 0, color: '#374151', fontSize: '14px'}}>{lifestyle.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical Screenings */}
                  {preventiveAnalysis.preventiveMeasures.medicalScreenings && preventiveAnalysis.preventiveMeasures.medicalScreenings.length > 0 && (
                    <div style={{marginBottom: '20px'}}>
                      <h4 style={{color: '#059669', marginBottom: '12px'}}>🩺 Recommended Medical Screenings</h4>
                      <div style={{display: 'grid', gap: '10px'}}>
                        {preventiveAnalysis.preventiveMeasures.medicalScreenings.map((screening, index) => (
                          <div key={index} style={{
                            background: 'white',
                            padding: '14px',
                            borderRadius: '8px',
                            border: '1px solid #dbeafe'
                          }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                              <h5 style={{color: '#1f2937', margin: 0}}>{screening.screening}</h5>
                              <span style={{
                                background: screening.urgency === 'urgent' ? '#fef2f2' :
                                           screening.urgency === 'soon' ? '#fefbf0' : '#f0f9ff',
                                color: screening.urgency === 'urgent' ? '#dc2626' :
                                       screening.urgency === 'soon' ? '#d97706' : '#2563eb',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {screening.urgency}
                              </span>
                            </div>
                            <p style={{color: '#6b7280', fontSize: '13px', margin: '0 0 6px 0'}}>
                              <strong>Frequency:</strong> {screening.frequency}
                            </p>
                            <p style={{color: '#6b7280', fontSize: '13px', margin: 0}}>{screening.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supplementation */}
                  {preventiveAnalysis.preventiveMeasures.supplementation && preventiveAnalysis.preventiveMeasures.supplementation.length > 0 && (
                    <div style={{marginBottom: '20px'}}>
                      <h4 style={{color: '#059669', marginBottom: '12px'}}>💊 Supplementation Recommendations</h4>
                      <div style={{display: 'grid', gap: '10px'}}>
                        {preventiveAnalysis.preventiveMeasures.supplementation.map((supplement, index) => (
                          <div key={index} style={{
                            background: supplement.consultPhysician ? '#fefbf0' : 'white',
                            padding: '14px',
                            borderRadius: '8px',
                            border: supplement.consultPhysician ? '1px solid #f59e0b' : '1px solid #e5e7eb'
                          }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                              <h5 style={{color: '#1f2937', margin: 0}}>{supplement.supplement}</h5>
                              {supplement.consultPhysician && (
                                <span style={{
                                  background: '#fbbf24',
                                  color: 'white',
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  Consult Doctor
                                </span>
                              )}
                            </div>
                            <p style={{color: '#6b7280', fontSize: '13px', margin: '0 0 6px 0'}}>
                              <strong>Dosage:</strong> {supplement.dosage}
                            </p>
                            <p style={{color: '#6b7280', fontSize: '13px', margin: 0}}>{supplement.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Warning Signs */}
              {preventiveAnalysis.warningSignsToWatch && preventiveAnalysis.warningSignsToWatch.length > 0 && (
                <div style={{marginBottom: '24px'}}>
                  <h3 style={{color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fas fa-eye"></i>
                    Warning Signs to Watch
                  </h3>
                  <div style={{display: 'grid', gap: '10px'}}>
                    {preventiveAnalysis.warningSignsToWatch.map((warning, index) => (
                      <div key={index} style={{
                        background: warning.urgency === 'immediate' ? '#fef2f2' : 'white',
                        padding: '14px',
                        borderRadius: '8px',
                        border: `1px solid ${warning.urgency === 'immediate' ? '#fca5a5' : '#e5e7eb'}`,
                        borderLeft: `4px solid ${
                          warning.urgency === 'immediate' ? '#ef4444' :
                          warning.urgency === 'within_days' ? '#f59e0b' : '#22c55e'
                        }`
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                          <h5 style={{color: '#1f2937', margin: 0}}>{warning.symptom}</h5>
                          <span style={{
                            background: warning.urgency === 'immediate' ? '#dc2626' :
                                       warning.urgency === 'within_days' ? '#f59e0b' : '#22c55e',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {warning.urgency.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{color: '#6b7280', fontSize: '13px', margin: 0}}>{warning.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Recommendations */}
              {preventiveAnalysis.followUpRecommendations && (
                <div style={{marginBottom: '24px'}}>
                  <h3 style={{color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fas fa-calendar-check"></i>
                    Follow-up Recommendations
                  </h3>
                  <div style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {preventiveAnalysis.followUpRecommendations.nextCheckup && (
                      <p style={{margin: '0 0 8px 0', color: '#374151'}}>
                        <strong>Next Checkup:</strong> {preventiveAnalysis.followUpRecommendations.nextCheckup}
                      </p>
                    )}
                    {preventiveAnalysis.followUpRecommendations.specialistReferral && (
                      <p style={{margin: '0 0 8px 0', color: '#374151'}}>
                        <strong>Specialist Consultation:</strong> {preventiveAnalysis.followUpRecommendations.specialistReferral}
                      </p>
                    )}
                    {preventiveAnalysis.followUpRecommendations.labTestsToMonitor && preventiveAnalysis.followUpRecommendations.labTestsToMonitor.length > 0 && (
                      <div>
                        <strong style={{color: '#374151'}}>Lab Tests to Monitor:</strong>
                        <ul style={{margin: '4px 0 0 20px', color: '#6b7280'}}>
                          {preventiveAnalysis.followUpRecommendations.labTestsToMonitor.map((test, index) => (
                            <li key={index} style={{margin: '2px 0'}}>{test}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Health Goals */}
              {preventiveAnalysis.healthGoals && preventiveAnalysis.healthGoals.length > 0 && (
                <div style={{marginBottom: '16px'}}>
                  <h3 style={{color: '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fas fa-target"></i>
                    Health Goals
                  </h3>
                  <div style={{display: 'grid', gap: '10px'}}>
                    {preventiveAnalysis.healthGoals.map((goal, index) => (
                      <div key={index} style={{
                        background: 'white',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #d1fae5',
                        borderLeft: '4px solid #22c55e'
                      }}>
                        <h5 style={{color: '#1f2937', margin: '0 0 8px 0'}}>{goal.goal}</h5>
                        <div style={{display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280'}}>
                          <span><strong>Timeline:</strong> {goal.timeline}</span>
                          <span><strong>Success Metric:</strong> {goal.measurableTarget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved Results History */}
          {savedResults.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{marginBottom: '20px', color: '#495057'}}>
                <i className="fas fa-history" style={{marginRight: '8px'}}></i>
                Previous Analysis Results
              </h3>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {savedResults.map((result) => (
                  <div key={result.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    borderLeft: `4px solid ${getSeverityColor(result.analysis.severity)}`
                  }}>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                        <span style={{
                          color: getSeverityColor(result.analysis.severity),
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {result.analysis.severity.toUpperCase()}
                        </span>
                        <span style={{color: '#666', fontSize: '12px'}}>
                          {new Date(result.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{margin: 0, fontSize: '14px', color: '#666'}}>
                        {result.symptoms.substring(0, 100)}...
                      </p>
                    </div>
                    <button onClick={() => deleteResult(result.id)} style={{
                      padding: '6px 10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
