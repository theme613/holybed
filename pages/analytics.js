import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Analytics() {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        setError(data.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Error connecting to analytics API');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📊</div>
          <div>Loading Analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Analytics - HolyBed</title>
        </Head>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f5f5f5',
          minHeight: '100vh'
        }}>
          <h2 style={{ color: '#dc3545' }}>Analytics Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
            The SQLite database may not be initialized yet. Try using the app first to generate some data.
          </p>
          <button 
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '20px'
            }}
          >
            Go Back to Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard - HolyBed</title>
        <meta name="description" content="Analytics dashboard for HolyBed user interactions" />
      </Head>

      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, color: '#1f2937', fontSize: '24px' }}>
                📊 Analytics Dashboard
              </h1>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                {analyticsData ? (
                  <>
                    Real-time data from SQLite Database • {analyticsData.totalSubmissions || 0} total submissions
                  </>
                ) : (
                  'User interactions and hospital recommendations tracking'
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={fetchAnalyticsData}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🔄 {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button 
                onClick={() => router.push('/')}
                style={{
                  padding: '10px 20px',
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Database Status Card */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                  🗄️ SQLite Database Status
                </h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                  Database is active and storing real user interactions
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {analyticsData?.totalSubmissions || 0}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Records
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Mode Statistics */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Usage by Mode</h3>
              {analyticsData?.modeStats?.map(stat => (
                <div key={stat.mode} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ 
                    color: stat.mode === 'emergency' ? '#dc2626' : '#059669',
                    fontWeight: '600'
                  }}>
                    {stat.mode === 'emergency' ? '🚨 Emergency' : '🏥 Normal'}
                  </span>
                  <span style={{ fontWeight: '600' }}>{stat.count}</span>
                </div>
              )) || <p style={{ color: '#666' }}>No data available</p>}
            </div>

            {/* Severity Distribution */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>Severity Distribution</h3>
              {analyticsData?.severityStats?.map(stat => (
                <div key={stat.severity} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ 
                    color: getSeverityColor(stat.severity),
                    fontWeight: '600'
                  }}>
                    {stat.severity.toUpperCase()}
                  </span>
                  <span style={{ fontWeight: '600' }}>{stat.count}</span>
                </div>
              )) || <p style={{ color: '#666' }}>No data available</p>}
            </div>

            {/* Most Frequent Symptoms */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
                🩺 Most Frequent Symptoms
              </h3>
              {analyticsData?.topSymptoms?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analyticsData.topSymptoms.map((symptom, index) => {
                    const maxCount = analyticsData.topSymptoms[0]?.count || 1;
                    const percentage = (symptom.count / maxCount) * 100;
                    
                    return (
                      <div key={index} style={{ position: 'relative' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ 
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px'
                          }}>
                            {symptom.symptom}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              {((symptom.count / analyticsData.totalSubmissions) * 100).toFixed(1)}%
                            </span>
                            <span style={{ 
                              fontWeight: '700',
                              color: '#059669',
                              fontSize: '16px'
                            }}>
                              {symptom.count}
                            </span>
                          </div>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: index === 0 ? '#059669' : 
                                           index === 1 ? '#0ea5e9' : 
                                           index === 2 ? '#f59e0b' : '#6b7280',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                  No symptom data available yet
                </p>
              )}
            </div>
          </div>

          {/* Detailed Symptom Analysis */}
          {analyticsData?.topSymptoms?.length > 0 && (
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
                📊 Detailed Symptom Analysis
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {analyticsData.topSymptoms.map((symptom, index) => (
                  <div key={index} style={{
                    background: index === 0 ? '#f0fdf4' : 
                               index === 1 ? '#eff6ff' : 
                               index === 2 ? '#fefbf0' : '#f9fafb',
                    border: `2px solid ${
                      index === 0 ? '#22c55e' : 
                      index === 1 ? '#3b82f6' : 
                      index === 2 ? '#f59e0b' : '#6b7280'
                    }`,
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    {index === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#22c55e',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        #1
                      </div>
                    )}
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: index === 0 ? '#059669' : 
                             index === 1 ? '#2563eb' : 
                             index === 2 ? '#d97706' : '#374151',
                      marginBottom: '8px'
                    }}>
                      {symptom.count}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {symptom.symptom}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {((symptom.count / analyticsData.totalSubmissions) * 100).toFixed(1)}% of cases
                    </div>
                  </div>
                ))}
              </div>

              {/* Symptom Insights */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: '#1f2937',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💡 Symptom Insights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                    <strong>Most Common:</strong> {analyticsData.topSymptoms[0]?.symptom} 
                    ({analyticsData.topSymptoms[0]?.count} cases, {((analyticsData.topSymptoms[0]?.count / analyticsData.totalSubmissions) * 100).toFixed(1)}%)
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                    <strong>Total Unique Symptoms:</strong> {analyticsData.topSymptoms.length} different types
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                    <strong>Coverage:</strong> Top 3 symptoms represent {
                      analyticsData.topSymptoms.slice(0, 3).reduce((sum, s) => sum + s.count, 0)
                    } out of {analyticsData.totalSubmissions} total cases 
                    ({(analyticsData.topSymptoms.slice(0, 3).reduce((sum, s) => sum + s.count, 0) / analyticsData.totalSubmissions * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Hospitals */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
              🏥 Most Recommended Hospitals
            </h3>
            {analyticsData?.topHospitals?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#374151' }}>Hospital Name</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#374151' }}>Address</th>
                      <th style={{ textAlign: 'center', padding: '12px', color: '#374151' }}>Recommendations</th>
                      <th style={{ textAlign: 'center', padding: '12px', color: '#374151' }}>Avg Distance (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topHospitals.map((hospital, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{hospital.name}</td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                          {hospital.address?.substring(0, 50)}...
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#059669' }}>
                          {hospital.recommendation_count}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {parseFloat(hospital.avg_distance).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#666' }}>No hospital data available</p>
            )}
          </div>

          {/* Recent Submissions */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
              📋 Recent User Submissions
            </h3>
            {analyticsData?.recentSubmissions?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analyticsData.recentSubmissions.map((submission, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${getSeverityColor(submission.severity)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            background: submission.mode === 'emergency' ? '#dc2626' : '#059669',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {submission.mode.toUpperCase()}
                          </span>
                          {submission.severity && (
                            <span style={{
                              color: getSeverityColor(submission.severity),
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              {submission.severity.toUpperCase()}
                            </span>
                          )}
                          {submission.category && (
                            <span style={{
                              background: '#f3f4f6',
                              color: '#374151',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              {submission.category}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                          {submission.symptoms?.substring(0, 150)}...
                        </p>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
                        {new Date(submission.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666' }}>No recent submissions</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
