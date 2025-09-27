import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PDFAnalysis() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    console.log('File selected:', file);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    
    if (!file) {
      alert('No file selected');
      return;
    }
    
    // Check file type
    if (file.type !== 'application/pdf') {
      alert(`❌ Invalid file type: ${file.type}\nPlease select a PDF file (.pdf)`);
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`❌ File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB\nMaximum size allowed: 10 MB`);
      return;
    }
    
    // Check file extension as additional validation
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      alert('❌ Invalid file extension. Please select a .pdf file');
      return;
    }
    
    console.log('✅ File validation passed');
    setPdfFile(file);
    setAnalysisResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const analyzePDF = async () => {
    if (!pdfFile) {
      alert('Please select a PDF file first');
      return;
    }

    console.log('🔄 Starting PDF analysis...');
    console.log('File details:', {
      name: pdfFile.name,
      type: pdfFile.type,
      size: pdfFile.size
    });

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('pdf', pdfFile);
    
    console.log('📤 Sending request to /api/analyze-pdf-report');

    try {
      const response = await fetch('/api/analyze-pdf-report', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📥 Response data:', result);

      if (result.success) {
        setAnalysisResult(result);
        // Store results for potential viewing later
        localStorage.setItem('latestPDFAnalysis', JSON.stringify(result));
      } else {
        // Enhanced error handling
        console.error('Full error response:', result);
        
        if (result.error && result.error.includes('API key')) {
          alert('⚠️ OpenAI API key not configured properly. Please check your .env.local file.');
        } else if (result.error && result.error.includes('Only PDF files are allowed')) {
          alert('❌ Please select a valid PDF file. Other file types are not supported.');
        } else if (result.error && result.error.includes('insufficient_quota')) {
          alert('⚠️ OpenAI API quota exceeded. Please check your OpenAI account billing.');
        } else if (result.message && result.message.includes('extract text')) {
          alert('❌ Could not extract text from the PDF. Please ensure the PDF contains readable text or try a different file.');
        } else {
          alert(`❌ Analysis failed: ${result.message || result.error || 'Unknown error'}\n\nPlease check:\n• File is a valid PDF\n• File size is under 10MB\n• PDF contains readable text`);
        }
      }
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      alert('❌ Error analyzing PDF: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#22c55e';
      case 'minor_concerns': return '#eab308';
      case 'moderate_concerns': return '#f97316';
      case 'serious_concerns': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'routine': return '#22c55e';
      case 'follow_up_needed': return '#eab308';
      case 'urgent_consultation': return '#f97316';
      case 'immediate_attention': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return '#22c55e';
      case 'moderate': return '#eab308';
      case 'severe': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <Head>
        <title>PDF Medical Report Analysis - Symptom Finder</title>
        <meta name="description" content="Upload and analyze your medical reports with AI" />
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
              <button onClick={() => router.push('/')} style={{
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
                Back to Home
              </button>
            </div>
          </div>
        </header>

        <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
          <div style={{textAlign: 'center', marginBottom: '40px'}}>
            <h2 style={{fontSize: '2.5rem', marginBottom: '15px', color: '#1e293b'}}>
              Medical Report Analysis
            </h2>
            <p style={{fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto'}}>
              Upload your medical reports, lab results, or diagnostic documents for AI-powered analysis and insights
            </p>
          </div>

          {/* Upload Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div
              style={{
                border: dragActive ? '3px dashed #007bff' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '60px 40px',
                textAlign: 'center',
                background: dragActive ? '#f0f9ff' : '#f8fafc',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pdf-file-input').click()}
            >
              <i className="fas fa-file-pdf" style={{
                fontSize: '4rem',
                color: dragActive ? '#007bff' : '#64748b',
                marginBottom: '20px'
              }}></i>
              
              <h3 style={{
                fontSize: '1.5rem',
                marginBottom: '10px',
                color: dragActive ? '#007bff' : '#1e293b'
              }}>
                {pdfFile ? pdfFile.name : 'Upload Medical Report'}
              </h3>
              
              <p style={{
                color: '#64748b',
                marginBottom: '20px',
                fontSize: '1rem'
              }}>
                {pdfFile 
                  ? `File size: ${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`
                  : 'Drag and drop your PDF file here, or click to browse'
                }
              </p>
              
              <input
                type="file"
                id="pdf-file-input"
                accept=".pdf"
                onChange={handleFileInputChange}
                style={{display: 'none'}}
              />
              
              {!pdfFile && (
                <div style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '20px'
                }}>
                  <span>📋 Blood Test Results</span>
                  <span>🩺 Medical Reports</span>
                  <span>🔬 Lab Results</span>
                  <span>📊 Diagnostic Reports</span>
                  <span>💊 Prescription Details</span>
                </div>
              )}
            </div>

            {pdfFile && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '30px',
                gap: '15px'
              }}>
                <button
                  onClick={analyzePDF}
                  disabled={isAnalyzing}
                  style={{
                    padding: '15px 30px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    opacity: isAnalyzing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-microscope'}`}></i>
                  {isAnalyzing ? 'Analyzing Report...' : 'Analyze Report'}
                </button>
                
                <button
                  onClick={() => {
                    setPdfFile(null);
                    setAnalysisResult(null);
                  }}
                  style={{
                    padding: '15px 30px',
                    background: '#f8f9fa',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Clear File
                </button>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '25px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.8rem',
                    marginBottom: '10px',
                    color: '#1e293b'
                  }}>
                    Analysis Results
                  </h3>
                  <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <span style={{
                      background: '#f1f5f9',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      {analysisResult.analysis.reportType}
                    </span>
                    <span style={{
                      background: getUrgencyColor(analysisResult.analysis.urgencyLevel),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {analysisResult.analysis.urgencyLevel.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Assessment */}
              <div style={{
                background: '#f8fafc',
                border: `1px solid ${getStatusColor(analysisResult.analysis.overallAssessment.status)}`,
                borderLeft: `4px solid ${getStatusColor(analysisResult.analysis.overallAssessment.status)}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <h4 style={{
                  color: getStatusColor(analysisResult.analysis.overallAssessment.status),
                  marginBottom: '10px'
                }}>
                  Overall Assessment: {analysisResult.analysis.overallAssessment.status.replace('_', ' ').toUpperCase()}
                </h4>
                <p style={{marginBottom: '15px', lineHeight: '1.6'}}>
                  {analysisResult.analysis.overallAssessment.summary}
                </p>
                <div>
                  <strong>Recommendations:</strong>
                  <p style={{marginTop: '5px', lineHeight: '1.6'}}>
                    {analysisResult.analysis.overallAssessment.recommendations}
                  </p>
                </div>
              </div>

              {/* Key Findings */}
              {analysisResult.analysis.keyFindings && analysisResult.analysis.keyFindings.length > 0 && (
                <div style={{marginBottom: '25px'}}>
                  <h4 style={{marginBottom: '15px', color: '#1e293b'}}>Key Findings</h4>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px'}}>
                    {analysisResult.analysis.keyFindings.map((finding, index) => (
                      <div key={index} style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '15px'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                          <strong style={{color: '#1e293b'}}>{finding.finding}</strong>
                          <span style={{
                            background: finding.status === 'normal' ? '#22c55e' : 
                                       finding.status === 'abnormal' ? '#ef4444' :
                                       finding.status === 'critical' ? '#dc2626' : '#eab308',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {finding.status.toUpperCase()}
                          </span>
                        </div>
                        {finding.value && (
                          <p style={{margin: '5px 0', fontSize: '14px'}}>
                            <strong>Value:</strong> {finding.value}
                            {finding.normalRange && <span style={{color: '#64748b'}}> (Normal: {finding.normalRange})</span>}
                          </p>
                        )}
                        <p style={{margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4'}}>
                          {finding.significance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abnormal Values */}
              {analysisResult.analysis.abnormalValues && analysisResult.analysis.abnormalValues.length > 0 && (
                <div style={{marginBottom: '25px'}}>
                  <h4 style={{marginBottom: '15px', color: '#ef4444'}}>
                    <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
                    Abnormal Values
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    {analysisResult.analysis.abnormalValues.map((abnormal, index) => (
                      <div key={index} style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '15px'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                          <strong style={{color: '#dc2626'}}>{abnormal.parameter}</strong>
                          <span style={{
                            background: getSeverityColor(abnormal.severity),
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {abnormal.severity.toUpperCase()}
                          </span>
                        </div>
                        <p style={{margin: '5px 0', fontSize: '14px'}}>
                          <strong>Value:</strong> {abnormal.value}
                          <span style={{color: '#64748b', marginLeft: '10px'}}>
                            (Normal: {abnormal.normalRange})
                          </span>
                        </p>
                        <p style={{margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4'}}>
                          {abnormal.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {analysisResult.analysis.recommendedActions && analysisResult.analysis.recommendedActions.length > 0 && (
                <div style={{marginBottom: '25px'}}>
                  <h4 style={{marginBottom: '15px', color: '#1e293b'}}>Recommended Actions</h4>
                  <ul style={{paddingLeft: '20px', lineHeight: '1.6'}}>
                    {analysisResult.analysis.recommendedActions.map((action, index) => (
                      <li key={index} style={{marginBottom: '8px', color: '#374151'}}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions for Doctor */}
              {analysisResult.analysis.questionsForDoctor && analysisResult.analysis.questionsForDoctor.length > 0 && (
                <div style={{marginBottom: '25px'}}>
                  <h4 style={{marginBottom: '15px', color: '#1e293b'}}>
                    <i className="fas fa-question-circle" style={{marginRight: '8px'}}></i>
                    Questions to Ask Your Doctor
                  </h4>
                  <ul style={{paddingLeft: '20px', lineHeight: '1.6'}}>
                    {analysisResult.analysis.questionsForDoctor.map((question, index) => (
                      <li key={index} style={{marginBottom: '8px', color: '#374151'}}>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up */}
              {analysisResult.analysis.followUpTimeframe && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{color: '#0ea5e9', marginBottom: '8px'}}>
                    <i className="fas fa-calendar-check" style={{marginRight: '8px'}}></i>
                    Follow-up Recommended
                  </h4>
                  <p style={{margin: 0, color: '#374151'}}>
                    <strong>Timeframe:</strong> {analysisResult.analysis.followUpTimeframe}
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <p style={{margin: 0, fontSize: '14px', color: '#92400e', fontStyle: 'italic'}}>
                  <i className="fas fa-info-circle" style={{marginRight: '8px'}}></i>
                  <strong>Important:</strong> This analysis is for educational purposes only and does not replace professional medical advice. 
                  Always consult with your healthcare provider for proper medical interpretation and treatment decisions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
