// API endpoint to save user interactions and hospital recommendations
const { 
  saveUserSubmission, 
  saveAIAnalysis, 
  saveHospitalRecommendations,
  initializeDatabase 
} = require('../../lib/database.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();

    const { 
      symptoms, 
      mode, 
      uploadedFiles, 
      userLocation, 
      analysisResult, 
      hospitalRecommendations 
    } = req.body;

    // Validate required fields
    if (!symptoms || !mode) {
      return res.status(400).json({ error: 'Missing required fields: symptoms and mode' });
    }

    console.log('📝 Saving user interaction:', { symptoms: symptoms.substring(0, 50) + '...', mode });

    // Step 1: Save user submission
    const submissionId = await saveUserSubmission({
      symptoms,
      mode,
      uploadedFiles,
      userLocation
    });

    // Step 2: Save AI analysis if provided
    let analysisId = null;
    if (analysisResult) {
      analysisId = await saveAIAnalysis(submissionId, analysisResult);
    }

    // Step 3: Save hospital recommendations if provided
    if (hospitalRecommendations && hospitalRecommendations.length > 0) {
      await saveHospitalRecommendations(submissionId, hospitalRecommendations);
    }

    console.log('✅ User interaction saved successfully');

    res.status(200).json({
      success: true,
      submissionId,
      analysisId,
      message: 'Interaction saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving interaction:', error);
    res.status(500).json({ 
      error: 'Failed to save interaction',
      details: error.message 
    });
  }
}
