import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [symptoms, setSymptoms] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTab, setActiveTab] = useState('Emergency');
  const [hospitalStats] = useState({
    hospitalsOnline: 28,
    availableBeds: 156,
    doctorsOnDuty: 42
  });

  const symptomTags = [
    'Fever', 'Headache', 'Chest Pain', 'Shortness of Breath', 'Stomach Pain'
  ];

  const recommendedHospitals = [
    {
      name: 'KL General Hospital',
      status: 'Good availability - 5-10 min wait',
      icon: '🏥',
      color: 'green'
    },
    {
      name: 'Subang Jaya Medical Center',
      status: 'Full capacity - Redirecting patients',
      icon: '🏢',
      color: 'red'
    },
    {
      name: 'Gleneagles Kuala Lumpur',
      status: 'Limited availability - 20-30 min wait',
      icon: '🏢',
      color: 'orange'
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
      status: 'Limited availability - 20-30 min wait',
      icon: '🚑',
      color: 'orange'
    },
    {
      service: 'Poison Control',
      status: 'Full capacity - Redirecting patients',
      icon: '☎️',
      color: 'red'
    }
  ];

  const quickActions = [
    { name: 'Emergency Assistance', icon: '📋' },
    { name: 'Book Appointment', icon: '📅' },
    { name: 'Get Directions', icon: '📍' }
  ];

  const departmentTabs = ['Emergency', 'Specialist', 'Surgery'];

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFindHelp = () => {
    const searchQuery = symptoms || selectedTags.join(', ');
    console.log('Searching for help with:', searchQuery);
    // Here you would implement the actual search logic
    alert(`Searching for hospitals that can help with: ${searchQuery}`);
  };

  return (
    <>
      <Head>
        <title>Symptom Finder - Find the Right Hospital</title>
        <meta name="description" content="Find the right hospital based on your symptoms" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">🏥</div>
                <h1 className="text-2xl font-bold text-gray-900">Symptom Finder</h1>
        </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-blue-600 font-medium">Home</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Hospitals</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Symptoms</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Emergency</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Health Tips</a>
        </nav>
      </div>
    </div>
  </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Hero Section */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  What symptoms are you experiencing?
                </h2>
                <p className="text-gray-600 mb-6">
                  Describe how you're feeling and we'll help you find the right hospital with available capacity.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Describe your symptoms (e.g., headache, fever, chest pain)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleFindHelp}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Find Help
                  </button>
      </div>
      
                <div className="flex flex-wrap gap-2">
                  {symptomTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
        </div>
      </div>
      
              {/* Hospital Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-100 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-blue-800 mb-2">
                    {hospitalStats.hospitalsOnline}
        </div>
                  <div className="text-blue-600 font-medium">Hospitals Online</div>
      </div>
                <div className="bg-blue-100 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-blue-800 mb-2">
                    {hospitalStats.availableBeds}
    </div>
                  <div className="text-blue-600 font-medium">Available Beds</div>
          </div>
                <div className="bg-blue-100 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-blue-800 mb-2">
                    {hospitalStats.doctorsOnDuty}
          </div>
                  <div className="text-blue-600 font-medium">Doctors On Duty</div>
          </div>
        </div>
        
              {/* Recommended Hospitals */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Recommended Hospitals</h3>
                  <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                    View All Hospitals
                  </a>
        </div>
        
                <div className="space-y-4">
                  {recommendedHospitals.map((hospital, index) => (
                    <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl mr-4">{hospital.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{hospital.name}</div>
                        <div className={`text-sm ${
                          hospital.color === 'green' ? 'text-green-600' :
                          hospital.color === 'red' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {hospital.status}
            </div>
          </div>
        </div>
                  ))}
          </div>
        </div>
        
              {/* Hospital Map */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">KL Hospital Map</h3>
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <div className="text-gray-600">
                      Interactive Hospital Location Map
          </div>
                    <div className="text-sm text-gray-500">
                      Showing hospitals with available capacity in green
          </div>
        </div>
                </div>
              </div>
              
              {/* Department Tabs */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex space-x-1 mb-6">
                  {departmentTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl mr-4">❤️</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Emergency Department - KL General</div>
                      <div className="text-green-600 text-sm">6 beds available + 2 doctors on duty</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="text-2xl mr-4">❤️</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Trauma Center - Subang Jaya</div>
                      <div className="text-orange-600 text-sm">Limited availability - 1 doctor on duty</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          
            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Common Symptoms Guide */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Common Symptoms Guide</h3>
                <div className="space-y-4">
                  {commonSymptoms.map((symptom, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="font-semibold text-gray-900 mb-1">{symptom.symptoms}</div>
                      <div className="text-gray-600 text-sm mb-2">{symptom.department}</div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        symptom.urgency === 'Urgent' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {symptom.urgency}
                      </span>
                </div>
                  ))}
                </div>
              </div>
              
              {/* Emergency Contacts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Emergency Contacts</h3>
                <div className="space-y-4">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center">
                      <div className="text-xl mr-3">{contact.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{contact.service}</div>
                        <div className={`text-sm ${
                          contact.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {contact.status}
                        </div>
                      </div>
                </div>
                  ))}
            </div>
          </div>
          
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <a
                      key={index}
                      href="#"
                      className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="text-xl mr-3">{action.icon}</div>
                      <div className="font-medium text-blue-800">{action.name}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Symptom Finder</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white">About Us</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                </ul>
            </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Hospital Resources</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white">Emergency Contacts</a></li>
                  <li><a href="#" className="hover:text-white">Medical Specialists</a></li>
                  <li><a href="#" className="hover:text-white">Pharmacy Locator</a></li>
                  <li><a href="#" className="hover:text-white">Health Tips</a></li>
                </ul>
          </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Report Issue</a></li>
                  <li><a href="#" className="hover:text-white">Feedback</a></li>
                  <li><a href="#" className="hover:text-white">API Access</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Connect</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white">Twitter</a></li>
                  <li><a href="#" className="hover:text-white">Facebook</a></li>
                  <li><a href="#" className="hover:text-white">Instagram</a></li>
                  <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              © 2023 Symptom-Based Hospital Finder. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
