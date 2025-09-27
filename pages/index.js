import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [symptoms, setSymptoms] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState('emergency');
  const [mode, setMode] = useState('emergency'); // 'emergency' or 'normal'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfContent, setPdfContent] = useState('');
  const [hospitalStats] = useState({
    hospitalsOnline: 28,
    availableBeds: 156,
    doctorsOnDuty: 42
  });

  const symptomTags = [
    'Fever', 'Headache', 'Chest Pain', 'Shortness of Breath', 'Stomach Pain', 'Dizziness'
  ];

  const recommendedHospitals = [
    {
      name: 'KL General Hospital',
      status: '20 beds available • 5 min wait time • 15 doctors on duty',
      color: 'green'
    },
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
      number: '999 • 991 • 994',
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
  ];

  const handleTagClick = (tag) => {
    setSymptoms(tag);
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
      } else {
        alert('Analysis failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      alert('Error analyzing symptoms');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFindHelp = () => {
    analyzeSymptoms();
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <>
      <Head>
        <title>Symptom-Based Hospital Finder - Kuala Lumpur</title>
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
                <h1>Symptom <span>Finder</span></h1>
              </div>
              
              <nav>
                <ul>
                  <li><a href="#" className="active">Home</a></li>
                  <li><a href="#">Hospitals</a></li>
                  <li><a href="#">Symptoms</a></li>
                  <li><a href="#">Emergency</a></li>
                  <li><a href="#">Health Tips</a></li>
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
            
            <div className="search-box">
              <div className="input-with-button-container" style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                alignItems: 'flex-start'
              }}>
                <textarea 
                  placeholder={mode === 'emergency' 
                    ? "URGENT: Describe your emergency symptoms in detail (e.g., chest pain for 2 hours, difficulty breathing, medical history...)" 
                    : "Describe your symptoms and condition in detail (e.g., headache for 3 days, fever 101°F, took aspirin, medical history...)"}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  style={{
                    flex: '1',
                    minHeight: '120px',
                    padding: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
                <button id="search-btn" onClick={handleFindHelp} disabled={isAnalyzing} style={{
                  minWidth: '100px',
                  height: '56px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  background: mode === 'emergency' ? '#ff4444' : '#007bff',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  opacity: isAnalyzing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  alignSelf: 'flex-start',
                  marginTop: '15px'
                }}>
                  <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-search'}`} style={{fontSize: '14px'}}></i> 
                  <span>{isAnalyzing ? 'Analyzing...' : 'Find Help'}</span>
                </button>
              </div>
              
              <div className="symptom-suggestions" style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '25px',
                padding: '0 20px'
              }}>
                {symptomTags.map((tag) => (
                  <button key={tag} className="symptom-tag" onClick={() => handleTagClick(tag)} style={{
                    padding: '10px 18px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '24px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#475569',
                    fontWeight: '500',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}>
                    {tag}
                  </button>
                ))}
              </div>
                
              <div className="file-upload-section" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}>
                <label htmlFor="pdf-upload" style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '600px',
                  padding: '20px 24px',
                  background: mode === 'emergency' ? '#fef2f2' : '#f8fafc',
                  border: mode === 'emergency' ? '2px dashed #f87171' : '2px dashed #3b82f6',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: mode === 'emergency' ? '#dc2626' : '#1e40af',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  fontWeight: '500',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <i className="fas fa-file-pdf" style={{marginRight: '10px', fontSize: '18px'}}></i>
                  {mode === 'emergency' 
                    ? 'Upload Emergency Medical Records' 
                    : 'Upload Medical Documents (Lab Results, Reports, etc.)'}
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
                    padding: '10px 20px',
                    borderRadius: '30px',
                    border: '1px solid #22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}>
                    <i className="fas fa-check-circle" style={{color: '#22c55e'}}></i>
                    {pdfFile.name} uploaded successfully
                  </div>
                )}
                
                {mode === 'normal' && (
                  <div style={{
                    textAlign: 'center',
                    maxWidth: '600px',
                    marginTop: '12px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
                      fontStyle: 'italic',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <i className="fas fa-info-circle"></i>
                      Upload lab results, medical reports, or prescription details for more accurate analysis
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <span>📋 Blood tests</span>
                      <span>🩺 Doctor reports</span>
                      <span>💊 Prescriptions</span>
                      <span>🔬 Lab results</span>
                      <span>📊 Medical charts</span>
                    </div>
                  </div>
                )}
              </div>
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
                        <p>8 beds available • 2 doctors on duty</p>
                      </div>
                    </div>
                    
                    <div className="department-item">
                      <div className="department-icon orange">
                        <i className="fas fa-ambulance"></i>
                      </div>
                      <div className="department-info">
                        <h4>Trauma Center - Subang Jaya</h4>
                        <p>2 beds available • High demand</p>
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
                        <p>4 specialists available • 30 min wait</p>
                      </div>
                    </div>
                    
                    <div className="department-item">
                      <div className="department-icon green">
                        <i className="fas fa-brain"></i>
                      </div>
                      <div className="department-info">
                        <h4>Neurology - KL General</h4>
                        <p>3 specialists available • 45 min wait</p>
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
                        <p>2 theaters available • 1 hr wait</p>
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
                <h3>Symptom Finder</h3>
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
              <p>&copy; 2023 Symptom-Based Hospital Finder. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}