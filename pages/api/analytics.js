// API endpoint to get analytics data from SQLite database
const { getAnalytics, getRecentSubmissions, initializeDatabase } = require('../../lib/sqlite-database.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database
    initializeDatabase();

    // Get analytics data from database
    const analytics = getAnalytics();
    const recentSubmissions = getRecentSubmissions(10); // Get last 10 submissions

    // Transform data to match the analytics page expectations
    const transformedData = {
      // Mode statistics for the analytics page
      modeStats: Object.entries(analytics.submissionsByMode).map(([mode, count]) => ({
        mode,
        count
      })),

      // Severity statistics
      severityStats: Object.entries(analytics.severityDistribution).map(([severity, count]) => ({
        severity,
        count
      })),

      // Top hospitals (we'll need to add this to the database service)
      topHospitals: getTopHospitals(),

      // Recent submissions for the analytics page
      recentSubmissions: recentSubmissions,

      // Additional analytics data
      totalSubmissions: analytics.totalSubmissions,
      submissionsByDate: analytics.submissionsByDate,
      topSymptoms: analytics.topSymptoms,
      averageResponseTime: analytics.averageResponseTime,
      lastUpdated: analytics.lastUpdated
    };

    console.log('📊 Analytics data retrieved from SQLite database');

    res.status(200).json({
      success: true,
      data: transformedData,
      source: 'SQLite Database',
      recordCount: {
        totalSubmissions: analytics.totalSubmissions,
        recentSubmissions: recentSubmissions.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    
    // Fallback to basic data if database fails
    const fallbackAnalytics = {
      modeStats: [
        { mode: 'emergency', count: 0 },
        { mode: 'normal', count: 0 }
      ],
      severityStats: [],
      topHospitals: [],
      recentSubmissions: [],
      totalSubmissions: 0,
      submissionsByDate: [],
      topSymptoms: [],
      averageResponseTime: 'N/A',
      lastUpdated: new Date().toISOString(),
      error: 'Database not available'
    };
    
    res.status(200).json({ 
      success: true,
      data: fallbackAnalytics,
      source: 'Fallback Data',
      note: 'Database error - showing fallback data'
    });
  }
}

// Get top hospitals from database
function getTopHospitals() {
  try {
    const { initializeDatabase } = require('../../lib/sqlite-database.js');
    const db = initializeDatabase();
    
    return db.prepare(`
      SELECT 
        hospital_name as name,
        hospital_address as address,
        COUNT(*) as recommendation_count,
        AVG(distance_km) as avg_distance
      FROM hospital_recommendations 
      WHERE hospital_name IS NOT NULL
      GROUP BY hospital_name, hospital_address
      ORDER BY recommendation_count DESC
      LIMIT 10
    `).all();
  } catch (error) {
    console.log('⚠️ Could not get top hospitals:', error.message);
    return [];
  }
}
