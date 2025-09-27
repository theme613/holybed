import React, { useState, useEffect } from 'react';
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
  const [hospitalStats] = useState({
    hospitalsOnline: 28,
    availableBeds: 156,
    doctorsOnDuty: 42
  });  const allHospitals = [
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
      departments: ['Emergency', 'Traditional Medicine'],
      status: 'Moderate', busyLevel: 'Medium'
    }
  ];


  const symptomTags = [
    'Fever', 'Headache', 'Chest Pain', 'Shortness of Breath', 'Stomach Pain', 'Dizziness'
  ];

  const recommendedHospitals = [
    {
      name: 'KL General Hospital',
      status: '20 beds available â€¢ 5 min wait time â€¢ 15 doctors on duty',
      color: 'green'
    },
    {
      name: 'Subang Jaya Medical Center',
      status: '5 beds left â€¢ 30 min wait time â€¢ 8 doctors on duty',
      color: 'orange'
    },
    {
      name: 'Gleneagles Kuala Lumpur',
      status: '12 beds available â€¢ 15 min wait time â€¢ 10 specialists available',
      color: 'green'
    }
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
      number: '999 â€¢ 991 â€¢ 994',
      color: 'red'
    },
    {
      service: 'Poison Control',
      number: '1-800-88-8099',
      color: 'orange'
    }
  ];

  const quickActions = [
    { name: 'Emergency Assistance', icon: 'fas fa-ambulance' },
    { name: 'Book Appointment', icon: 'fas fa-calendar-check' },
    { name: 'Get Directions', icon: 'fas fa-directions' }
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
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setPdfContent(result.text);
        console.log('PDF content extracted:', result.text.substring(0, 200) + '...');
      } else {
        alert('Failed to extract text from PDF: ' + result.message);
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
              {/* Stats Overview */}
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{hospitalStats.hospitalsOnline}</h3>
                  <p>Hospitals Online</p>
                </div>
                <div className="stat-card">
                  <h3>{hospitalStats.availableBeds}</h3>
                  <p>Available Beds</p>
                </div>
                <div className="stat-card">
                  <h3>{hospitalStats.doctorsOnDuty}</h3>
                  <p>Doctors On Duty</p>
                </div>
              </div>
              
              {/* Recommended Hospitals */}
              <div className="section-header">
                <h2 id="recommendation-title">Recommended Hospitals</h2>
                <a href="#" className="view-all">View All Hospitals</a>
              </div>
              
              {recommendedHospitals.map((hospital, index) => (
                <div key={index} className={`status-item ${hospital.color === 'orange' ? 'medium' : ''}`}>
                  <div className={`status-icon ${hospital.color}`}>
                    <i className="fas fa-hospital"></i>
                  </div>
                  <div className="status-info">
                    <h3>{hospital.name}</h3>
                    <p>{hospital.status}</p>
                    <div className="progress-bar">
                      <div className={`progress-fill ${hospital.color}`}></div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Hospital Map */}
              <div className="card">
                <div className="section-header">
                  <h2>KL Hospital Map</h2>
                </div>
                
                <div className="hospital-map">
                  <div className="map-placeholder">
                    <i className="fas fa-map-marker-alt"></i>
                    <p>Interactive Hospital Location Map</p>
                    <small>Showing hospitals with available capacity in green</small>
                  </div>
                </div>
              </div>
              
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
                      <i className={contact.service === 'Ambulance' ? 'fas fa-ambulance' : 'fas fa-phone'}></i>
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
                    <div key={index} className="department-item">
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
              <p>&copy; 2023 Holy bed. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

