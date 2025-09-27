// API endpoint to get analytics data from SQLite database
const { getAnalytics, initializeDatabase } = require('../../lib/sqlite-database.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database
    initializeDatabase();

    // Get analytics data from database
    const analytics = await getAnalytics();

    console.log('📊 Analytics data retrieved from SQLite database');

    res.status(200).json({
      success: true,
      data: analytics,
      source: 'SQLite Database'
    });

  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    
    // Fallback to basic data if database fails
    const fallbackAnalytics = {
      totalSubmissions: 0,
      submissionsByMode: { emergency: 0, normal: 0 },
      submissionsByDate: [],
      topSymptoms: [],
      severityDistribution: {},
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
