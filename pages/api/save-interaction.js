// API endpoint to save user interactions and hospital recommendations
// Database functionality temporarily disabled - using console logging instead

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Log interaction for debugging (replace database functionality)
    console.log('📝 User interaction logged:', {
      timestamp: new Date().toISOString(),
      symptoms: symptoms.substring(0, 100) + (symptoms.length > 100 ? '...' : ''),
      mode,
      hasUploadedFiles: uploadedFiles && uploadedFiles.length > 0,
      hasLocation: !!userLocation,
      hasAnalysisResult: !!analysisResult,
      hospitalRecommendationsCount: hospitalRecommendations ? hospitalRecommendations.length : 0
    });

    // Generate mock IDs for compatibility
    const submissionId = 'mock_' + Date.now();
    const analysisId = analysisResult ? 'analysis_' + Date.now() : null;

    console.log('✅ User interaction logged successfully (database disabled)');

    res.status(200).json({
      success: true,
      submissionId,
      analysisId,
      message: 'Interaction logged successfully (database functionality disabled)'
    });

  } catch (error) {
    console.error('❌ Error logging interaction:', error);
    res.status(500).json({ 
      error: 'Failed to log interaction',
      details: error.message 
    });
  }
}
