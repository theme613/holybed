import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Result() {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedResults, setSavedResults] = useState([]);

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
    
    setLoading(false);
  }, []);

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
          <title>No Results - Symptom Finder</title>
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
        <title>Analysis Results - Symptom Finder</title>
        <meta name="description" content="Your symptom analysis results" />
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
                  Symptom <span style={{color: '#007bff'}}>Finder</span>
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
                <p style={{margin: 0, lineHeight: '1.6'}}>{analysisResult.recommendedAction}</p>
              </div>
            </div>

            {/* Explanation */}
            <div style={{marginBottom: '20px'}}>
              <h4 style={{marginBottom: '12px', color: '#495057'}}>Medical Explanation:</h4>
              <p style={{margin: 0, lineHeight: '1.6', color: '#666'}}>
                {analysisResult.urgencyExplanation}
              </p>
            </div>

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
