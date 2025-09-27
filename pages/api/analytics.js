// API endpoint to get analytics data from MySQL database
const { getAnalytics, initializeDatabase } = require('../../lib/database.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();

    // Get analytics data
    const analytics = await getAnalytics();

    console.log('📊 Analytics data retrieved successfully');

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics data',
      details: error.message 
    });
  }
}
