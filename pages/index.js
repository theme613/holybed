import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('emergency');
  const [mode, setMode] = useState('emergency'); // 'emergency' or 'normal'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfContent, setPdfContent] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [hospitalStats, setHospitalStats] = useState({
    hospitalsOnline: 28,
    availableBeds: 156,
    doctorsOnDuty: 42
  });
  const [hospitalData, setHospitalData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dataChanges, setDataChanges] = useState([]);
  const [previousStats, setPreviousStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Map related state
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch real-time hospital data
  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setIsRefreshing(true);
        setDataLoading(true);
        const response = await fetch('/api/moh-accurate-data');
        const result = await response.json();
        
        if (result.success) {
          console.log('Real-time hospital data loaded:', result.data);
          
          // Calculate realistic doctor numbers based on hospital capacity
          const totalBeds = result.data.stats.totalBeds || result.data.stats.availableBeds * 6;
          const baseDoctors = Math.floor(totalBeds / 15) + Math.floor(result.data.stats.totalHospitals * 12);
          // Add some realistic variation (±5% for shift changes, breaks, etc.)
          const variation = Math.floor(baseDoctors * (Math.random() - 0.5) * 0.1);
          const doctorsOnDuty = Math.max(Math.floor(baseDoctors * 0.85), baseDoctors + variation); // At least 85% staffed
          
          const newStats = {
            hospitalsOnline: result.data.stats.totalHospitals,
            availableBeds: result.data.stats.availableBeds,
            doctorsOnDuty: doctorsOnDuty
          };
          
          // Track changes for real-time proof
          if (previousStats && isRealtime) {
            const changes = [];
            if (previousStats.availableBeds !== newStats.availableBeds) {
              const diff = newStats.availableBeds - previousStats.availableBeds;
              changes.push({
                type: 'beds',
                message: `Available beds ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)}`,
                timestamp: new Date().toLocaleTimeString(),
                change: diff
              });
            }
            if (changes.length > 0) {
              setDataChanges(prev => [...changes, ...prev].slice(0, 10)); // Keep last 10 changes
            }
          }
          
          setPreviousStats(newStats);
          setHospitalStats(newStats);
          
          // Update hospital list
          setHospitalData(result.data.hospitals);
          setLastUpdated(result.data.lastUpdated);
          setNextUpdate(result.nextUpdate);
          setIsRealtime(result.realtime || false);
        } else {
          console.error('Failed to fetch hospital data:', result);
        }
      } catch (error) {
        console.error('Error fetching hospital data:', error);
      } finally {
        setDataLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchHospitalData();
    
    // Set up auto-refresh every 30 seconds for real-time MOH data
    const refreshInterval = setInterval(fetchHospitalData, 30 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Countdown timer to next update
  useEffect(() => {
    if (!nextUpdate || !isRealtime) {
      console.log('⏰ Countdown timer not starting:', { nextUpdate, isRealtime });
      return;
    }
    
    console.log('⏰ Starting countdown timer with nextUpdate:', nextUpdate);
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const nextUpdateTime = new Date(nextUpdate).getTime();
      const secondsLeft = Math.max(0, Math.floor((nextUpdateTime - now) / 1000));
      
      console.log('⏰ Countdown update:', {
        now: new Date(now).toLocaleTimeString(),
        nextUpdateTime: new Date(nextUpdateTime).toLocaleTimeString(),
        secondsLeft
      });
      
      setCountdown(secondsLeft);
      
      // If countdown reaches 0, trigger a refresh
      if (secondsLeft === 0) {
        console.log('⏰ Countdown reached 0, should refresh soon...');
      }
    };
    
    updateCountdown(); // Initial update
    const countdownInterval = setInterval(updateCountdown, 1000);
    
    return () => {
      console.log('⏰ Clearing countdown interval');
      clearInterval(countdownInterval);
    };
  }, [nextUpdate, isRealtime]);
  // Initialize map when Google Maps is ready
  useEffect(() => {
    if (window.google && window.google.maps) {
      initializeMap();
    }
  }, [hospitalData]);


  const allHospitals = [
    {
      name: 'KL General Hospital',
      lat: 3.1390, lng: 101.6869,
      availableBeds: 25, totalBeds: 50, waitTime: 5,
      departments: ['Emergency', 'Cardiology', 'Surgery'],
      status: 'Available', busyLevel: 'Low'
    },
    {
      name: 'Subang Jaya Medical Center',
      lat: 3.0738, lng: 101.5810,
      availableBeds: 8, totalBeds: 40, waitTime: 25,
      departments: ['Emergency', 'Orthopedics', 'Pediatrics'],
      status: 'Busy', busyLevel: 'High'
    },
    {
      name: 'Gleneagles Kuala Lumpur',
      lat: 3.1478, lng: 101.7017,
      availableBeds: 18, totalBeds: 35, waitTime: 12,
      departments: ['Emergency', 'Cardiology', 'Neurology'],
      status: 'Available', busyLevel: 'Medium'
    },
    {
      name: 'Pantai Hospital KL',
      lat: 3.1319, lng: 101.6841,
      availableBeds: 22, totalBeds: 45, waitTime: 8,
      departments: ['Emergency', 'Surgery', 'ICU'],
      status: 'Available', busyLevel: 'Low'
    },
    {
      name: 'Prince Court Medical Centre',
      lat: 3.1390, lng: 101.6869,
      availableBeds: 15, totalBeds: 30, waitTime: 15,
      departments: ['Emergency', 'Specialist Care'],
      status: 'Available', busyLevel: 'Medium'
    },
    {
      name: 'Tung Shin Hospital',
      lat: 3.1478, lng: 101.6953,
      availableBeds: 12, totalBeds: 25, waitTime: 18,
      status: 'Moderate', busyLevel: 'Medium'
    }
  ];

  const symptomTags = [
    'Fever', 'Headache', 'Chest Pain', 'Shortness of Breath', 'Stomach Pain', 'Dizziness',
    'Cough', 'Sore Throat', 'Weakness', 'Nausea', 'Fatigue', 'Back Pain'
  ];

  // Use real hospital data or fallback to mock data
  const displayHospitals = hospitalData.length > 0 
    ? hospitalData.map(hospital => ({
        name: hospital.name,
        status: `${hospital.availableBeds} beds available • ${hospital.waitTime} wait time • ${hospital.state}`,
        color: hospital.status === 'good' ? 'green' : hospital.status === 'medium' ? 'orange' : 'red',
        occupancyRate: hospital.occupancyRate,
        totalBeds: hospital.totalBeds
      }))
    : [
        {
          name: dataLoading ? 'Loading hospital data...' : 'KL General Hospital',
          status: dataLoading ? 'Fetching real-time data from Malaysia Open Data' : '20 beds available • 5 min wait time • 15 doctors on duty',
          color: 'green'
        },
        ...(dataLoading ? [] : [
          {
            name: 'Subang Jaya Medical Center',
            status: '5 beds left • 30 min wait time • 8 doctors on duty',
            color: 'orange'
          },
          {
            name: 'Gleneagles Kuala Lumpur',
            status: '12 beds available • 15 min wait time • 10 specialists available',
            color: 'green'
          }
        ])
      ];

  const commonSymptoms = [
    {
      symptoms: 'Fever + Cough',
      department: 'General Practice or Respiratory',
      urgency: 'Common'
    },
    {
      symptoms: 'Chest Pain',
      department: 'Emergency or Cardiology',
      urgency: 'Urgent'
    },
    {
      symptoms: 'Abdominal Pain',
      department: 'General Surgery or GI',
      urgency: 'Common'
    }
  ];

  const emergencyContacts = [
    {
      service: 'Ambulance',
      number: '999 or 991',
      color: 'red'
    },
    {
      service: 'Mental health',
      number: '03-76272929',
      color: 'orange'
    }
  ];

  const quickActions = [
    { name: 'Emergency Assistance', icon: 'fas fa-ambulance' },
    { name: 'Book Appointment', icon: 'fas fa-calendar-check' },
    { name: 'Get Directions', icon: 'fas fa-directions' },
    { name: 'Analytics Dashboard', icon: 'fas fa-chart-bar', action: () => router.push('/analytics') }
  ];  // Calculate distance between two coordinates (Haversine formula)
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
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#22c55e">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              <path d="M10 8h4v1h-1v4h-2V9h-1z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      // Create InfoWindow for each hospital
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 250px; padding: 12px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${hospital.name}</h3>
            <div style="margin-bottom: 8px;">
              <div style="color: #22c55e; font-weight: bold; font-size: 14px;">✅ Available</div>
              <div style="color: #6b7280; font-size: 13px;">
                ${hospital.availableBeds || 'N/A'} beds available
              </div>
              ${hospital.waitTime ? `<div style="color: #6b7280; font-size: 13px;">Wait time: ${hospital.waitTime} min</div>` : ''}
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: #22c55e; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">HOSPITAL</span>
              <span style="background: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">OPEN</span>
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

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        findNearbyHospitals(location);
      },
      (error) => {
        setLocationError('Location access denied. Using default KL area.');
        // Default to KL city center if location denied
        const defaultLocation = { lat: 3.1390, lng: 101.6869 };
        setUserLocation(defaultLocation);
        findNearbyHospitals(defaultLocation);
      }
    );
  };

  // Sort hospitals by distance and availability
  const findNearbyHospitals = (userLoc) => {
    const hospitalsWithDistance = allHospitals.map(hospital => {
      const distance = calculateDistance(
        userLoc.lat, userLoc.lng,
        hospital.lat, hospital.lng
      );
      
      // Calculate priority score (lower is better)
      // Distance weight: 40%, Availability weight: 35%, Wait time weight: 25%
      const availabilityRatio = hospital.availableBeds / hospital.totalBeds;
      const busyScore = hospital.busyLevel === 'Low' ? 1 : hospital.busyLevel === 'Medium' ? 2 : 3;
      
      const priorityScore = (distance * 0.4) + 
                           ((1 - availabilityRatio) * 10 * 0.35) + 
                           (hospital.waitTime * 0.25) +
                           (busyScore * 2);

      return {
        ...hospital,
        distance: distance.toFixed(1),
        priorityScore,
        availabilityRatio: (availabilityRatio * 100).toFixed(0)
      };
    });

    // Sort by priority score (closest + most available first)
    const sortedHospitals = hospitalsWithDistance.sort((a, b) => a.priorityScore - b.priorityScore);
    setNearbyHospitals(sortedHospitals);
  };


  const handleTagClick = (tag) => {
    if (selectedSymptoms.includes(tag)) {
      // Remove symptom if already selected
      const updatedSymptoms = selectedSymptoms.filter(symptom => symptom !== tag);
      setSelectedSymptoms(updatedSymptoms);
      setSymptoms(updatedSymptoms.join(', '));
    } else {
      // Add symptom if not selected
      const updatedSymptoms = [...selectedSymptoms, tag];
      setSelectedSymptoms(updatedSymptoms);
      setSymptoms(updatedSymptoms.join(', '));
    }
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setPdfFile(file);
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/simple-pdf-parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('PDF parsing response:', result);
      
      if (result.success && result.text) {
        setPdfContent(result.text);
        console.log('PDF content extracted using pdf-parse:', result.text.substring(0, Math.min(200, result.text.length)) + '...');
        console.log(`Extraction method: ${result.extractionMethod}, Pages: ${result.numPages}, File: ${result.fileName}`);
      } else {
        const errorMessage = result.message || 'Unknown error occurred';
        console.error('PDF extraction failed:', result);
        alert('Failed to extract text from PDF: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim() && !pdfContent) {
      alert('Please describe your symptoms or upload a medical document');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          description: '', // No separate description field now
          pdfContent: pdfContent,
          mode: mode
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.analysis);
        
        // Store the analysis result and search data in localStorage
        localStorage.setItem('latestAnalysis', JSON.stringify(result.analysis));
        localStorage.setItem('searchData', JSON.stringify({
          symptoms: symptoms.trim(),
          mode: mode,
          pdfContent: pdfContent,
          timestamp: new Date().toISOString()
        }));
        
        // Navigate to results page
        router.push('/result');
      } else {
        // Better error handling
        if (result.error && result.error.includes('API key')) {
          alert('⚠️ OpenAI API key not configured properly. Please check your .env.local file and ensure OPENAI_API_KEY is set with your actual API key.');
        } else if (result.error && result.error.includes('insufficient_quota')) {
          alert('⚠️ OpenAI API quota exceeded. Please check your OpenAI account billing.');
        } else {
          alert('❌ Analysis failed: ' + (result.message || 'Unknown error'));
        }
        console.error('Analysis error:', result);
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      if (error.message.includes('Failed to fetch')) {
        alert('🔌 Network error: Unable to connect to analysis service. Please check your internet connection.');
      } else {
        alert('❌ Error analyzing symptoms: ' + error.message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

      const handleFindHelp = () => {
    if (mode === 'emergency') {
      router.push({ pathname: '/emergency', query: { symptoms: symptoms || '' } });
      return;
    }
    analyzeSymptoms();
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <>
      <Head>
        <title>Holy bed - Kuala Lumpur</title>
        <meta name="description" content="Find the right hospital based on your symptoms" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{background: 'var(--bg-primary)'}}>
        {/* Header */}
        <header>
          <div className="container">
            <div className="header-content">
              <div className="logo">
                <i className="fas fa-hospital"></i>
                <h1>Holy bed</h1>
              </div>
              
              <nav>
                <ul>
                  <li><a href="#" className="active">Home</a></li>
                  <li><a href="#">Hospitals</a></li>
                  <li><a href="#">Symptoms</a></li>
                  <li><a href="#">Emergency</a></li>
                  <li><a href="#">Health Tips</a></li>
                  <li>
                    <button 
                      onClick={() => router.push('/result')}
                      style={{
                        background: 'none',
                        border: '1px solid #007bff',
                        color: '#007bff',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fas fa-history"></i>
                      Results
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>

        {/* Mode Toggle */}
        <div className="mode-toggle-container">
          <div className="container">
            <div className="mode-toggle">
              <button 
                className={`mode-btn ${mode === 'emergency' ? 'active emergency' : ''}`}
                onClick={() => setMode('emergency')}
              >
                emergency
              </button>
              <button 
                className={`mode-btn ${mode === 'normal' ? 'active normal' : ''}`}
                onClick={() => setMode('normal')}
              >
                normal
              </button>
            </div>
          </div>
        </div>


        {/* Hero Section */}
        <section className={`hero ${mode === 'emergency' ? 'emergency-mode' : 'normal-mode'}`}>
          <div className="container">
            <h2>What symptoms are you experiencing?</h2>
            <p>{mode === 'emergency' ? 'URGENT: Describe your emergency symptoms for immediate medical attention' : 'Describe how you\'re feeling and we\'ll help you find the right hospital with available capacity'}</p>
            
            <div className="search-box" style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '900px',
              margin: '0 auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e9ecef'
            }}>
              <div className="input-with-button-container" style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                alignItems: 'flex-start'
              }}>
                <textarea 
                  placeholder={selectedSymptoms.length > 0 
                    ? `Selected symptoms: ${selectedSymptoms.join(', ')}. Add more details about your condition...`
                    : mode === 'emergency' 
                      ? "URGENT: Describe your emergency symptoms in detail (e.g., chest pain for 2 hours, difficulty breathing, medical history...)" 
                      : "Describe your symptoms and condition in detail (e.g., headache for 3 days, fever 101°F, took aspirin, medical history...)"}
                  value={symptoms}
                  onChange={(e) => {
                    setSymptoms(e.target.value);
                    // If user types manually, clear selected symptoms to avoid confusion
                    if (e.target.value !== selectedSymptoms.join(', ')) {
                      const typedSymptoms = e.target.value.split(', ').map(s => s.trim());
                      const validSelectedSymptoms = symptomTags.filter(tag => 
                        typedSymptoms.some(typed => typed.toLowerCase() === tag.toLowerCase())
                      );
                      setSelectedSymptoms(validSelectedSymptoms);
                    }
                  }}
                  style={{
                    flex: '1',
                    minHeight: '120px',
                    padding: '16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = mode === 'emergency' ? '#ff4444' : '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
                <button id="search-btn" onClick={handleFindHelp} disabled={isAnalyzing} style={{
                  minWidth: '120px',
                  height: '56px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  background: mode === 'emergency' ? '#ff4444' : '#007bff',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  opacity: isAnalyzing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  alignSelf: 'flex-start',
                  marginTop: '15px',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                  transform: isAnalyzing ? 'none' : 'translateY(0)',
                }}>
                  <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-search'}`} style={{fontSize: '14px'}}></i> 
                  <span>{isAnalyzing ? 'Analyzing...' : 'Find Help'}</span>
                </button>
              </div>
              
              <div className="symptom-suggestions" style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '28px',
                padding: '20px 0 0 0'
              }}>
                {symptomTags.map((tag) => {
                  const isSelected = selectedSymptoms.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      className="symptom-tag" 
                      onClick={() => handleTagClick(tag)} 
                      style={{
                        padding: '12px 20px',
                        backgroundColor: isSelected ? '#007bff' : '#f8fafc',
                        border: isSelected ? '1px solid #007bff' : '1px solid #e2e8f0',
                        borderRadius: '28px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        color: isSelected ? 'white' : '#475569',
                        fontWeight: '500',
                        boxShadow: isSelected 
                          ? '0 4px 12px rgba(0, 123, 255, 0.3)' 
                          : '0 2px 4px rgba(0, 0, 0, 0.06)',
                        minWidth: '100px',
                        textAlign: 'center',
                        transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                        position: 'relative'
                      }}
                    >
                      {isSelected && (
                        <i className="fas fa-check" style={{
                          marginRight: '6px',
                          fontSize: '12px'
                        }}></i>
                      )}
                      {tag}
                    </button>
                  );
                })}
              </div>
              
              {selectedSymptoms.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '-12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? 's' : ''} selected
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedSymptoms([]);
                      setSymptoms('');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '16px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: '#475569',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e2e8f0';
                      e.target.style.color = '#334155';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.color = '#475569';
                    }}
                  >
                    <i className="fas fa-times" style={{marginRight: '4px', fontSize: '10px'}}></i>
                    Clear All
                  </button>
                </div>
              )}
                
              {mode === 'normal' && (
                <div className="file-upload-section" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  borderTop: '1px solid #e9ecef',
                  paddingTop: '24px'
                }}>
                  <label htmlFor="pdf-upload" style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '700px',
                    padding: '24px 28px',
                    background: '#f8fafc',
                    border: '2px dashed #3b82f6',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    color: '#1e40af',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    fontWeight: '500',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <i className="fas fa-file-pdf" style={{marginRight: '12px', fontSize: '20px'}}></i>
                    Upload Medical Documents (Lab Results, Reports, etc.)
                  </label>
                  <input 
                    type="file" 
                    id="pdf-upload"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    style={{display: 'none'}}
                  />
                  
                  {pdfFile && (
                    <div style={{
                      fontSize: '14px', 
                      color: '#16a34a',
                      background: '#f0fdf4',
                      padding: '12px 24px',
                      borderRadius: '32px',
                      border: '1px solid #22c55e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)',
                      fontWeight: '500'
                    }}>
                      <i className="fas fa-check-circle" style={{color: '#22c55e', fontSize: '16px'}}></i>
                      {pdfFile.name} uploaded successfully
                    </div>
                  )}
                  
                  <div style={{
                    textAlign: 'center',
                    maxWidth: '700px',
                    marginTop: '16px',
                    padding: '0 20px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
                      fontStyle: 'italic',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      lineHeight: '1.5'
                    }}>
                      <i className="fas fa-info-circle" style={{color: '#3b82f6'}}></i>
                      Upload lab results, medical reports, or prescription details for more accurate analysis
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '16px',
                      lineHeight: '1.4'
                    }}>
<span style={{
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>📋 Blood tests</span>
                      <span style={{
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>🩺 Doctor reports</span>
                      <span style={{
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>💊 Prescriptions</span>
                      <span style={{
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>🔬 Lab results</span>
                      <span style={{
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>📊 Medical charts</span>

                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Analysis Results */}
        {analysisResult && (
          <div className="container" style={{marginTop: '20px'}}>
            <div className={`analysis-results card ${analysisResult.severity}`} style={{
              padding: '20px',
              marginBottom: '20px',
              borderLeft: `5px solid ${
                analysisResult.severity === 'emergency' ? '#ff4444' :
                analysisResult.severity === 'urgent' ? '#ff8800' :
                analysisResult.severity === 'moderate' ? '#ffaa00' : '#4CAF50'
              }`
            }}>
              <h2 style={{
                color: analysisResult.severity === 'emergency' ? '#ff4444' :
                       analysisResult.severity === 'urgent' ? '#ff8800' :
                       analysisResult.severity === 'moderate' ? '#ffaa00' : '#4CAF50',
                marginBottom: '15px'
              }}>
                <i className={`fas ${
                  analysisResult.severity === 'emergency' ? 'fa-exclamation-triangle' :
                  analysisResult.severity === 'urgent' ? 'fa-clock' :
                  analysisResult.severity === 'moderate' ? 'fa-info-circle' : 'fa-check-circle'
                }`}></i>
                {' '}Analysis Results - {analysisResult.severity.toUpperCase()} Priority
              </h2>
              
              <div className="analysis-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px'}}>
                <div>
                  <h4>Category:</h4>
                  <p>{analysisResult.category}</p>
                </div>
                <div>
                  <h4>Recommended Department:</h4>
                  <p>{analysisResult.recommendedDepartment}</p>
                </div>
                <div>
                  <h4>Estimated Wait Time:</h4>
                  <p>{analysisResult.estimatedWaitTime}</p>
                </div>
                <div>
                  <h4>Urgency Level:</h4>
                  <p style={{
                    color: analysisResult.severity === 'emergency' ? '#ff4444' :
                           analysisResult.severity === 'urgent' ? '#ff8800' :
                           analysisResult.severity === 'moderate' ? '#ffaa00' : '#4CAF50',
                    fontWeight: 'bold'
                  }}>{analysisResult.severity}</p>
                </div>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <h4>Recommended Action:</h4>
                <p>{analysisResult.recommendedAction}</p>
              </div>
              
              <div>
                <h4>Explanation:</h4>
                <p>{analysisResult.urgencyExplanation}</p>
              </div>
              
              {analysisResult.severity === 'emergency' && (
                <div className="emergency-warning" style={{
                  background: '#ffebee',
                  border: '2px solid #ff4444',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '15px'
                }}>
                  <h4 style={{color: '#ff4444', marginBottom: '10px'}}>
                    <i className="fas fa-ambulance"></i> EMERGENCY ALERT
                  </h4>
                  <p style={{color: '#d32f2f'}}>
                    This appears to be a medical emergency. Please call 999 immediately or go to the nearest emergency room.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container">
          <div className="main-content">
            {/* Left Column */}
            <div className="left-column">
              {/* Real-time Data Status */}
              {!dataLoading && isRealtime && lastUpdated && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#0369a1'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: isRefreshing ? '#f59e0b' : '#22c55e',
                      borderRadius: '50%',
                      animation: isRefreshing ? 'pulse 0.5s infinite' : 'pulse 2s infinite'
                    }}></div>
                    <strong>Real-Time Hospital Data Active</strong>
                    {isRefreshing && (
                      <span style={{
                        fontSize: '10px',
                        color: '#f59e0b',
                        fontWeight: 'bold',
                        marginLeft: '8px'
                      }}>
                        🔄 Refreshing...
                      </span>
                    )}
                  </div>
                  
                  {/* MOH Data Source Links */}
                  <div style={{
                    borderTop: '1px solid #bae6fd',
                    paddingTop: '8px',
                    marginTop: '8px'
                  }}>
                    <div style={{fontWeight: 'bold', marginBottom: '6px', fontSize: '11px'}}>
                      📊 Official MOH Data Sources:
                    </div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                      <a 
                        href="https://data.moh.gov.my/dashboard/hospital-bed-utilisation/Hospital%20Kuala%20Lumpur"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '10px',
                          color: '#0369a1',
                          textDecoration: 'none',
                          padding: '2px 6px',
                          background: '#e0f2fe',
                          borderRadius: '3px',
                          border: '1px solid #0ea5e9'
                        }}
                      >
                        🏥 Hospital KL Dashboard
                      </a>
                      <a 
                        href="https://data.moh.gov.my/dashboard/hospital-bed-utilisation"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '10px',
                          color: '#0369a1',
                          textDecoration: 'none',
                          padding: '2px 6px',
                          background: '#e0f2fe',
                          borderRadius: '3px',
                          border: '1px solid #0ea5e9'
                        }}
                      >
                        📈 National Overview
                      </a>
                      <a 
                        href="https://data.gov.my"
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '10px',
                          color: '#0369a1',
                          textDecoration: 'none',
                          padding: '2px 6px',
                          background: '#e0f2fe',
                          borderRadius: '3px',
                          border: '1px solid #0ea5e9'
                        }}
                      >
                        🇲🇾 Data.gov.my
                      </a>
                    </div>
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px'}}>
                    <div>
                      <div>Last Updated: {new Date(lastUpdated).toLocaleTimeString()}</div>
                      <div>Auto-refresh: Every 30 seconds</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      {countdown > 0 ? (
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                          {/* Enhanced Countdown Display */}
                          <div style={{
                            background: '#22c55e',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            border: '1px solid #16a34a',
                            minWidth: '160px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}>
                            <div style={{fontSize: '18px', fontFamily: 'monospace'}}>
                              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </div>
                            <div style={{fontSize: '10px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                              Next Update
                            </div>
                          </div>
                          
                          {/* Progress Bar for Countdown */}
                          <div style={{
                            width: '160px',
                            height: '4px',
                            background: '#e5e7eb',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${((30 - countdown) / 30) * 100}%`, // 30 seconds
                              height: '100%',
                              background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                              borderRadius: '2px',
                              transition: 'width 1s ease'
                            }}></div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setDataLoading(true);
                              setIsRefreshing(true);
                              fetch('/api/moh-accurate-data?force=true')
                                .then(res => res.json())
                                .then(result => {
                                  if (result.success) {
                                    // Calculate realistic doctor numbers  
                                    const totalBeds = result.data.stats.totalBeds || result.data.stats.availableBeds * 6;
                                    const baseDoctors = Math.floor(totalBeds / 15) + Math.floor(result.data.stats.totalHospitals * 12);
                                    const variation = Math.floor(baseDoctors * (Math.random() - 0.5) * 0.1);
                                    const doctorsOnDuty = Math.max(Math.floor(baseDoctors * 0.85), baseDoctors + variation);
                                    
                                    const newStats = {
                                      hospitalsOnline: result.data.stats.totalHospitals,
                                      availableBeds: result.data.stats.availableBeds,
                                      doctorsOnDuty: doctorsOnDuty
                                    };
                                    
                                    if (previousStats) {
                                      const changes = [];
                                      if (previousStats.availableBeds !== newStats.availableBeds) {
                                        const diff = newStats.availableBeds - previousStats.availableBeds;
                                        changes.push({
                                          type: 'manual',
                                          message: `Manual refresh: Available beds ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)}`,
                                          timestamp: new Date().toLocaleTimeString(),
                                          change: diff
                                        });
                                      }
                                      if (changes.length > 0) {
                                        setDataChanges(prev => [...changes, ...prev].slice(0, 10));
                                      }
                                    }
                                    
                                    setPreviousStats(newStats);
                                    setHospitalStats(newStats);
                                    setHospitalData(result.data.hospitals);
                                    setLastUpdated(result.data.lastUpdated);
                                    setNextUpdate(result.nextUpdate);
                                    
                                    // Show refresh success notification
                                    const notification = document.createElement('div');
                                    notification.style.cssText = `
                                      position: fixed;
                                      top: 20px;
                                      right: 20px;
                                      background: #22c55e;
                                      color: white;
                                      padding: 12px 20px;
                                      border-radius: 8px;
                                      font-size: 14px;
                                      font-weight: bold;
                                      z-index: 10000;
                                      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
                                    `;
                                    notification.textContent = '✅ Data refreshed successfully!';
                                    document.body.appendChild(notification);
                                    setTimeout(() => document.body.removeChild(notification), 3000);
                                  }
                                })
                                .finally(() => {
                                  setDataLoading(false);
                                  setIsRefreshing(false);
                                });
                            }}
                            disabled={isRefreshing}
                            style={{
                              background: isRefreshing ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              cursor: isRefreshing ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              boxShadow: isRefreshing ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.3)',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{
                              display: 'inline-block',
                              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                            }}>
                              🔄
                            </span>
                            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          color: '#f59e0b', 
                          fontWeight: 'bold',
                          fontSize: '13px',
                          padding: '8px 12px',
                          background: '#fef3c7',
                          borderRadius: '6px',
                          border: '1px solid #f59e0b'
                        }}>
                          🔄 Updating now...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Data Changes Log */}
                  {dataChanges.length > 0 && (
                    <div style={{
                      borderTop: '1px solid #bae6fd',
                      paddingTop: '8px',
                      maxHeight: '100px',
                      overflowY: 'auto'
                    }}>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>Recent Changes:</div>
                      {dataChanges.slice(0, 3).map((change, index) => (
                        <div key={index} style={{
                          fontSize: '10px',
                          padding: '2px 0',
                          color: change.change > 0 ? '#059669' : '#dc2626'
                        }}>
                          <span style={{color: '#6b7280'}}>{change.timestamp}</span> - {change.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stats Overview */}
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{dataLoading ? '...' : hospitalStats.hospitalsOnline}</h3>
                  <p>Hospitals Online</p>
                  {!dataLoading && (
                    <small style={{color: isRealtime ? '#22c55e' : '#666', fontSize: '10px'}}>
                      {isRealtime ? '🟢 LIVE' : 'Gov Data 2022'}
                    </small>
                  )}
                </div>
                <div className="stat-card">
                  <h3>{dataLoading ? '...' : hospitalStats.availableBeds}</h3>
                  <p>Available Beds</p>
                  {!dataLoading && (
                    <small style={{color: isRealtime ? '#22c55e' : '#666', fontSize: '10px'}}>
                      {isRealtime ? '🟢 REAL-TIME' : 'Estimated'}
                    </small>
                  )}
                </div>
                <div className="stat-card">
                  <h3>{dataLoading ? '...' : hospitalStats.doctorsOnDuty}</h3>
                  <p>Doctors On Duty</p>
                  {!dataLoading && <small style={{color: '#666', fontSize: '10px'}}>Estimated</small>}
                </div>
              </div>
              
              {/* Recommended Hospitals */}
              <div className="section-header">
                <h2 id="recommendation-title">Recommended Hospitals</h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  {!dataLoading && (
                    <small style={{
                      background: isRealtime ? '#dcfce7' : '#fff3cd',
                      color: isRealtime ? '#166534' : '#856404',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {isRealtime ? '🟢 MOH REAL-TIME DATA (Daily Updates)' : '🇲🇾 MINISTRY OF HEALTH DATA'}
                    </small>
                  )}
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <a 
                      href="https://data.moh.gov.my/dashboard/hospital-bed-utilisation/Hospital%20Kuala%20Lumpur" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '11px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        padding: '4px 8px',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        background: '#f8faff',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#3b82f6';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#f8faff';
                        e.target.style.color = '#3b82f6';
                      }}
                    >
                      🏥 Official MOH Dashboard
                    </a>
                    <a href="#" className="view-all">View All Hospitals</a>
                  </div>
                </div>
              </div>
              
              {displayHospitals.slice(0, 4).map((hospital, index) => {
                const hasRecentUpdate = hospital.lastUpdated && 
                  new Date() - new Date(hospital.lastUpdated) < 5 * 60 * 1000; // Within 5 minutes
                
                return (
                  <div key={hospital.id || index} className={`status-item ${hospital.color === 'orange' ? 'medium' : ''}`}
                       style={{position: 'relative'}}>
                    {/* Real-time update indicator */}
                    {hasRecentUpdate && isRealtime && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#22c55e',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }}></div>
                    )}
                    
                    <div className={`status-icon ${hospital.color}`}>
                      <i className="fas fa-hospital"></i>
                    </div>
                    <div className="status-info">
                      <h3>
                        {hospital.name}
                        {isRealtime && (
                          <span style={{
                            fontSize: '10px',
                            color: '#22c55e',
                            marginLeft: '6px',
                            fontWeight: 'normal'
                          }}>
                            🟢 LIVE
                          </span>
                        )}
                      </h3>
                      <p>{hospital.status}</p>
                      <div className="progress-bar">
                        <div className={`progress-fill ${hospital.color}`}></div>
                      </div>
                      {hospital.lastUpdated && isRealtime && (
                        <small style={{
                          fontSize: '9px',
                          color: '#6b7280',
                          display: 'block',
                          marginTop: '4px'
                        }}>
                          Updated: {new Date(hospital.lastUpdated).toLocaleTimeString()}
                        </small>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Department Availability */}
              <div className="card">
                <div className="department-tabs">
                  <button 
                    className={`tab ${activeTab === 'emergency' ? 'active' : ''}`} 
                    onClick={() => handleTabClick('emergency')}
                  >
                    Emergency
                  </button>
                  <button 
                    className={`tab ${activeTab === 'specialist' ? 'active' : ''}`} 
                    onClick={() => handleTabClick('specialist')}
                  >
                    Specialist
                  </button>
                  <button 
                    className={`tab ${activeTab === 'surgery' ? 'active' : ''}`} 
                    onClick={() => handleTabClick('surgery')}
                  >
                    Surgery
                  </button>
                </div>
                
                <div className={`tab-content ${activeTab === 'emergency' ? 'active' : ''}`} id="emergency">
                  <div className="department-list">
                    <div className="department-item">
                      <div className="department-icon green">
                        <i className="fas fa-heartbeat"></i>
                      </div>
                      <div className="department-info">
                        <h4>Emergency Department - KL General</h4>
                        <p>8 beds available â€¢ 2 doctors on duty</p>
                      </div>
                    </div>
                    
                    <div className="department-item">
                      <div className="department-icon orange">
                        <i className="fas fa-ambulance"></i>
                      </div>
                      <div className="department-info">
                        <h4>Trauma Center - Subang Jaya</h4>
                        <p>2 beds available â€¢ High demand</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`tab-content ${activeTab === 'specialist' ? 'active' : ''}`} id="specialist">
                  <div className="department-list">
                    <div className="department-item">
                      <div className="department-icon green">
                        <i className="fas fa-stethoscope"></i>
                      </div>
                      <div className="department-info">
                        <h4>Cardiology - Gleneagles</h4>
                        <p>4 specialists available â€¢ 30 min wait</p>
                      </div>
                    </div>
                    
                    <div className="department-item">
                      <div className="department-icon green">
                        <i className="fas fa-brain"></i>
                      </div>
                      <div className="department-info">
                        <h4>Neurology - KL General</h4>
                        <p>3 specialists available â€¢ 45 min wait</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`tab-content ${activeTab === 'surgery' ? 'active' : ''}`} id="surgery">
                  <div className="department-list">
                    <div className="department-item">
                      <div className="department-icon orange">
                        <i className="fas fa-syringe"></i>
                      </div>
                      <div className="department-info">
                        <h4>Operating Theaters - Subang Jaya</h4>
                        <p>2 theaters available â€¢ 1 hr wait</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Sidebar */}
            <div className="sidebar">
              <div className="card sidebar-card">
                <h3>Common Symptoms Guide</h3>
                
                {commonSymptoms.map((symptom, index) => (
                  <div key={index} className="favorite-item">
                    <div className="favorite-info">
                      <h4>{symptom.symptoms}</h4>
                      <p>{symptom.department}</p>
                    </div>
                    <div className={`favorite-status ${symptom.urgency === 'Urgent' ? 'urgent' : ''}`}>
                      {symptom.urgency}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="card sidebar-card">
                <h3>Emergency Contacts</h3>
                
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="status-item">
                    <div className={`status-icon ${contact.color}`}>
                      <i className={contact.service === 'Ambulance' ? 'fas fa-ambulance' : 'fas fa-brain'}></i>
                    </div>
                    <div className="status-info">
                      <h3>{contact.service}</h3>
                      <p>{contact.number}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="card sidebar-card">
                <h3>Quick Actions</h3>
                
                <div className="department-list">
                  {quickActions.map((action, index) => (
                    <div 
                      key={index} 
                      className="department-item"
                      onClick={action.action}
                      style={{ cursor: action.action ? 'pointer' : 'default' }}
                    >
                      <i className={action.icon} style={{color: 'var(--accent)'}}></i>
                      <div className="department-info">
                        <h4>{action.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer>
          <div className="container">
            <div className="footer-content">
              <div className="footer-column">
                <h3>Holy bed</h3>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h3>Hospital Resources</h3>
                <ul>
                  <li><a href="#">Emergency Contacts</a></li>
                  <li><a href="#">Medical Specialists</a></li>
                  <li><a href="#">Pharmacy Locator</a></li>
                  <li><a href="#">Health Tips</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h3>Support</h3>
                <ul>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Report Issue</a></li>
                  <li><a href="#">Feedback</a></li>
                  <li><a href="#">API Access</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h3>Connect</h3>
                <ul>
                  <li><a href="#">Twitter</a></li>
                  <li><a href="#">Facebook</a></li>
                  <li><a href="#">Instagram</a></li>
                  <li><a href="#">LinkedIn</a></li>
                </ul>
              </div>
            </div>
            
            <div className="copyright">
              <p>&copy; 2025 Holy bed. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

