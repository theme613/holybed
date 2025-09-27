// API endpoint to get analytics data
// Database functionality temporarily disabled - using mock data instead

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate mock analytics data for demonstration
    const mockAnalytics = {
      totalSubmissions: 42,
      submissionsByMode: {
        emergency: 15,
        normal: 27
      },
      submissionsByDate: [
        { date: '2024-01-20', count: 5 },
        { date: '2024-01-21', count: 8 },
        { date: '2024-01-22', count: 12 },
        { date: '2024-01-23', count: 17 }
      ],
      topSymptoms: [
        { symptom: 'Fever', count: 18 },
        { symptom: 'Headache', count: 15 },
        { symptom: 'Chest Pain', count: 12 },
        { symptom: 'Shortness of Breath', count: 8 }
      ],
      severityDistribution: {
        emergency: 5,
        urgent: 12,
        moderate: 18,
        mild: 7
      },
      averageResponseTime: '2.3 seconds',
      userLocations: [
        { city: 'Kuala Lumpur', count: 25 },
        { city: 'Selangor', count: 12 },
        { city: 'Johor', count: 5 }
      ]
    };

    console.log('📊 Mock analytics data generated successfully');

    res.status(200).json({
      success: true,
      data: mockAnalytics,
      note: 'Database functionality disabled - showing mock data'
    });

  } catch (error) {
    console.error('❌ Error generating analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics data',
      details: error.message 
    });
  }
}
