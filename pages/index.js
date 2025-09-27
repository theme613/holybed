import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [symptoms, setSymptoms] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTab, setActiveTab] = useState('Emergency');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState('normal'); // 'normal' or 'emergency'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        console.log('PDF uploaded and processed:', data.extractedText);
        console.log('Extraction method:', data.extractionMethod);
        // Store the extracted text for analysis
        setUploadedFile({ 
          ...file, 
          extractedText: data.extractedText,
          extractionMethod: data.extractionMethod 
        });
      } else {
        alert('Error uploading PDF: ' + data.message);
        setUploadedFile(null);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF. Please try again.');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFindHelp = async () => {
    const searchQuery = symptoms || selectedTags.join(', ');
    
    if (!searchQuery.trim() && !uploadedFile?.extractedText) {
      alert('Please describe your symptoms, select symptom tags, or upload a PDF document');
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
          symptoms: selectedTags.join(', '),
          description: symptoms,
          pdfContent: uploadedFile?.extractedText || '',
          mode: mode
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        alert('Error analyzing symptoms: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error analyzing symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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

        {/* Mode Toggle */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setMode('normal')}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                    mode === 'normal'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🏥</span>
                    <span>Normal Care</span>
        </div>
                </button>
                <button
                  onClick={() => setMode('emergency')}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                    mode === 'emergency'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🚨</span>
                    <span>Emergency Mode</span>
        </div>
                </button>
      </div>
    </div>
        </div>
      </div>
      
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Hero Section */}
              <div className={`rounded-lg shadow-md p-8 ${
                mode === 'emergency' ? 'bg-red-50 border-2 border-red-200' : 'bg-white'
              }`}>
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">
                    {mode === 'emergency' ? '🚨' : '🏥'}
        </div>
                  <div>
                    <h2 className={`text-3xl font-bold mb-2 ${
                      mode === 'emergency' ? 'text-red-800' : 'text-gray-900'
                    }`}>
                      {mode === 'emergency' ? 'EMERGENCY SYMPTOMS' : 'What symptoms are you experiencing?'}
                    </h2>
                    <p className={`text-sm font-medium ${
                      mode === 'emergency' ? 'text-red-700' : 'text-gray-600'
                    }`}>
                      {mode === 'emergency' ? 'URGENT MEDICAL ATTENTION REQUIRED' : 'Describe how you\'re feeling and we\'ll help you find the right hospital with available capacity.'}
                    </p>
        </div>
      </div>
      
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Describe your symptoms (e.g., headache, fever, chest pain)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                  <button
                    onClick={handleFindHelp}
                    disabled={isAnalyzing}
                    className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      mode === 'emergency'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isAnalyzing ? 'Analyzing...' : 
                     mode === 'emergency' ? '🚨 EMERGENCY SEARCH' : 'Find Help'}
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
        
                {/* PDF Upload Section - Only for Normal Mode */}
                {mode === 'normal' && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📄</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Upload Medical Documents
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Upload lab reports, medical records, or test results for better analysis
                      </p>
                      
                      <div className="flex flex-col items-center space-y-3">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="pdf-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="pdf-upload"
                          className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                            isUploading
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isUploading ? 'Uploading...' : '📄 Choose PDF File'}
                        </label>
                        
                        {uploadedFile && (
                          <div className="flex flex-col space-y-2 text-green-600">
                            <div className="flex items-center space-x-2">
                              <span>✅</span>
                              <span className="text-sm font-medium">
                                {uploadedFile.name} uploaded successfully
                              </span>
                              <button
                                onClick={() => setUploadedFile(null)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                            {uploadedFile.extractionMethod && (
                              <div className="text-xs text-gray-500 ml-6">
                                Processed with: {uploadedFile.extractionMethod === 'google-cloud-vision' ? '🔍 Google Cloud Vision' : '📄 PDF Parse'}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Maximum file size: 10MB • PDF files only
                        </p>
          </div>
            </div>
          </div>
                )}

                {/* Analysis Results */}
                {analysisResult && (
                  <div className="mt-6 p-6 bg-white border-2 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                      <div className={`text-2xl mr-3 ${
                        analysisResult.severity === 'emergency' ? 'text-red-600' :
                        analysisResult.severity === 'urgent' ? 'text-orange-600' :
                        analysisResult.severity === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {analysisResult.severity === 'emergency' ? '🚨' :
                         analysisResult.severity === 'urgent' ? '⚠️' :
                         analysisResult.severity === 'moderate' ? '⚠️' : '✅'}
          </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {analysisResult.severity === 'emergency' ? 'EMERGENCY' :
                           analysisResult.severity === 'urgent' ? 'URGENT' :
                           analysisResult.severity === 'moderate' ? 'MODERATE' : 'MILD'}
                        </h3>
                        <p className="text-gray-600">{analysisResult.category}</p>
          </div>
        </div>
        
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Recommended Action:</h4>
                        <p className="text-gray-700">{analysisResult.recommendedAction}</p>
          </div>
          
                      <div>
                        <h4 className="font-semibold text-gray-900">Department:</h4>
                        <p className="text-gray-700">{analysisResult.recommendedDepartment}</p>
        </div>
        
                      <div>
                        <h4 className="font-semibold text-gray-900">Estimated Wait Time:</h4>
                        <p className="text-gray-700">{analysisResult.estimatedWaitTime}</p>
          </div>
          
                      <div>
                        <h4 className="font-semibold text-gray-900">Analysis:</h4>
                        <p className="text-gray-700">{analysisResult.urgencyExplanation}</p>
                </div>
              </div>
              
                    {analysisResult.severity === 'emergency' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="text-red-600 text-xl mr-2">🚨</div>
                          <div>
                            <p className="font-semibold text-red-800">Call Emergency Services Immediately!</p>
                            <p className="text-red-700">Dial 999, 991, or 994 for immediate assistance.</p>
                </div>
                </div>
              </div>
                    )}
            </div>
                )}
          </div>
          
              {/* Hospital Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-lg p-6 text-center ${
                  mode === 'emergency' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    mode === 'emergency' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {mode === 'emergency' ? '8' : hospitalStats.hospitalsOnline}
                </div>
                  <div className={`font-medium ${
                    mode === 'emergency' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {mode === 'emergency' ? 'Emergency Hospitals' : 'Hospitals Online'}
                </div>
              </div>
                <div className={`rounded-lg p-6 text-center ${
                  mode === 'emergency' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    mode === 'emergency' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {mode === 'emergency' ? '24' : hospitalStats.availableBeds}
                </div>
                  <div className={`font-medium ${
                    mode === 'emergency' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {mode === 'emergency' ? 'Emergency Beds' : 'Available Beds'}
                </div>
              </div>
                <div className={`rounded-lg p-6 text-center ${
                  mode === 'emergency' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <div className={`text-4xl font-bold mb-2 ${
                    mode === 'emergency' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {mode === 'emergency' ? '12' : hospitalStats.doctorsOnDuty}
              </div>
                  <div className={`font-medium ${
                    mode === 'emergency' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {mode === 'emergency' ? 'Emergency Doctors' : 'Doctors On Duty'}
              </div>
            </div>
          </div>
          
              {/* Recommended Hospitals */}
              <div className={`rounded-lg shadow-md p-6 ${
                mode === 'emergency' ? 'bg-red-50 border border-red-200' : 'bg-white'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-2xl font-bold ${
                    mode === 'emergency' ? 'text-red-800' : 'text-gray-900'
                  }`}>
                    {mode === 'emergency' ? '🚨 EMERGENCY HOSPITALS' : 'Recommended Hospitals'}
                  </h3>
                  <a href="#" className={`hover:opacity-80 font-medium ${
                    mode === 'emergency' ? 'text-red-600' : 'text-blue-600 hover:text-blue-800'
                  }`}>
                    {mode === 'emergency' ? 'View All Emergency' : 'View All Hospitals'}
                  </a>
                </div>
              
                <div className="space-y-4">
                  {(mode === 'emergency' ? [
                    {
                      name: 'KL General Hospital - Emergency',
                      status: 'Immediate attention • 0-5 min wait • Trauma center ready',
                      icon: '🚨',
                      color: 'red'
                    },
                    {
                      name: 'Subang Jaya Medical - ER',
                      status: 'Emergency department open • 2-8 min wait • 24/7 service',
                      icon: '🚑',
                      color: 'red'
                    },
                    {
                      name: 'Gleneagles Emergency',
                      status: 'High priority • 5-15 min wait • Specialist on call',
                      icon: '⚡',
                      color: 'orange'
                    }
                  ] : recommendedHospitals).map((hospital, index) => (
                    <div key={index} className={`flex items-center p-4 border rounded-lg ${
                      mode === 'emergency' ? 'border-red-300 bg-white' : 'border-gray-200'
                    }`}>
                      <div className="text-2xl mr-4">{hospital.icon}</div>
                      <div className="flex-1">
                        <div className={`font-semibold ${
                          mode === 'emergency' ? 'text-red-800' : 'text-gray-900'
                        }`}>
                          {hospital.name}
                </div>
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
              <div className={`rounded-lg shadow-md p-6 ${
                mode === 'emergency' ? 'bg-red-50 border border-red-200' : 'bg-white'
              }`}>
                <h3 className={`text-2xl font-bold mb-6 ${
                  mode === 'emergency' ? 'text-red-800' : 'text-gray-900'
                }`}>
                  {mode === 'emergency' ? '🚨 Emergency Hospital Map' : 'KL Hospital Map'}
                </h3>
                <div className={`rounded-lg h-64 flex items-center justify-center ${
                  mode === 'emergency' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {mode === 'emergency' ? '🚨' : '🗺️'}
            </div>
                    <div className={`font-medium ${
                      mode === 'emergency' ? 'text-red-700' : 'text-gray-600'
                    }`}>
                      {mode === 'emergency' ? 'Emergency Hospital Locations' : 'Interactive Hospital Location Map'}
          </div>
                    <div className={`text-sm ${
                      mode === 'emergency' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {mode === 'emergency' ? 'Showing emergency departments and trauma centers' : 'Showing hospitals with available capacity in green'}
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
