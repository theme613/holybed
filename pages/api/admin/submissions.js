// Admin API endpoint to view recent submissions
const { getRecentSubmissions, initializeDatabase } = require('../../../lib/sqlite-database.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database
    initializeDatabase();

    // Get limit from query params
    const limit = parseInt(req.query.limit) || 50;

    // Get recent submissions
    const submissions = getRecentSubmissions(limit);

    console.log(`📋 Retrieved ${submissions.length} recent submissions`);

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length,
      source: 'SQLite Database'
    });

  } catch (error) {
    console.error('❌ Error getting submissions:', error);
    res.status(500).json({ 
      error: 'Failed to get submissions data',
      details: error.message 
    });
  }
}
