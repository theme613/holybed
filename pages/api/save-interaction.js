// API endpoint to save user interactions and hospital recommendations
const { 
  saveUserSubmission, 
  saveAIAnalysis, 
  saveHospitalRecommendations,
  savePreventiveAnalysis,
  initializeDatabase 
} = require('../../lib/sqlite-database.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database
    initializeDatabase();

    const { 
      symptoms, 
      mode, 
      uploadedFiles, 
      userLocation, 
      analysisResult, 
      hospitalRecommendations,
      preventiveAnalysis
    } = req.body;

    // Validate required fields
    if (!symptoms || !mode) {
      return res.status(400).json({ error: 'Missing required fields: symptoms and mode' });
    }

    // Get client info
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('📝 Saving user interaction to SQLite database:', { 
      symptoms: symptoms.substring(0, 50) + '...', 
      mode,
      hasAnalysis: !!analysisResult,
      hasPreventive: !!preventiveAnalysis
    });

    // Step 1: Save user submission
    const submissionId = saveUserSubmission({
      symptoms,
      mode,
      uploadedFiles,
      userLocation,
      ipAddress: clientIP,
      userAgent
    });

    // Step 2: Save AI analysis if provided
    let analysisId = null;
    if (analysisResult) {
      analysisId = saveAIAnalysis(submissionId, analysisResult);
    }

    // Step 3: Save hospital recommendations if provided
    if (hospitalRecommendations && hospitalRecommendations.length > 0) {
      saveHospitalRecommendations(submissionId, hospitalRecommendations);
    }

    // Step 4: Save preventive analysis if provided
    let preventiveId = null;
    if (preventiveAnalysis) {
      preventiveId = savePreventiveAnalysis(submissionId, preventiveAnalysis);
    }

    console.log('✅ User interaction saved successfully to database');

    res.status(200).json({
      success: true,
      submissionId,
      analysisId,
      preventiveId,
      message: 'Interaction saved successfully to SQLite database'
    });

  } catch (error) {
    console.error('❌ Error saving interaction:', error);
    res.status(500).json({ 
      error: 'Failed to save interaction',
      details: error.message 
    });
  }
}
