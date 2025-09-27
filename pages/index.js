import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [symptoms, setSymptoms] = useState('');
  const [activeTab, setActiveTab] = useState('emergency');
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

  const handleFindHelp = () => {
    const searchQuery = symptoms.trim();
    if (searchQuery !== '') {
      console.log('Searching for help with:', searchQuery);
      alert(`Searching for hospitals that can help with: ${searchQuery}`);
    }
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

        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <h2>What symptoms are you experiencing?</h2>
            <p>Describe how you're feeling and we'll help you find the right hospital with available capacity</p>
            
            <div className="search-box">
              <div className="search-input-container">
                <input 
                  type="text" 
                  id="symptom-input" 
                  placeholder="Describe your symptoms (e.g., headache, fever, chest pain...)"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <button id="search-btn" onClick={handleFindHelp}>
                  <i className="fas fa-search"></i> Find Help
                </button>
              </div>
              <div className="symptom-suggestions">
                {symptomTags.map((tag) => (
                  <button key={tag} className="symptom-tag" onClick={() => handleTagClick(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

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