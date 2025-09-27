// API to find hospitals by medical category using Google Places API (same as emergency.js)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, department, lat, lng, limit = 10 } = req.query;

  // This API returns a client-side script that will use Google Places API
  // Since Google Places API requires browser environment, we return instructions for client-side execution
  
  try {
    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        error: 'User location (lat, lng) is required' 
      });
    }

    // Return the search configuration for client-side execution
    const searchConfig = {
      success: true,
      message: 'Use client-side Google Places API to fetch real hospitals',
      searchParams: {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        category: category || 'Emergency',
        department: department || 'Emergency',
        radius: 15000, // 15km
        limit: parseInt(limit) || 10
      },
      categoryMapping: getCategoryMapping(),
      instructions: {
        step1: 'Get user location first',
        step2: 'Use Google Places API nearbySearch with type: hospital',
        step3: 'Filter results based on medical category',
        step4: 'Sort by distance and rating'
      }
    };

    res.status(200).json(searchConfig);

  } catch (error) {
    console.error('Error in find-hospitals-by-category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process hospital search request',
      message: error.message
    });
  }
}

// Helper function to get category mapping
function getCategoryMapping() {
  return {
    'Cardiology': ['cardiology', 'heart', 'cardiac'],
    'Cardiac': ['cardiology', 'heart', 'cardiac'],
    'Heart': ['cardiology', 'heart', 'cardiac'],
    'Neurology': ['neurology', 'neurological', 'brain', 'neuro'],
    'Neurological': ['neurology', 'neurological', 'brain', 'neuro'],
    'Brain': ['neurology', 'neurological', 'brain', 'neuro'],
    'Orthopedics': ['orthopedic', 'orthopedics', 'bone', 'joint'],
    'Orthopedic': ['orthopedic', 'orthopedics', 'bone', 'joint'],
    'Bone': ['orthopedic', 'orthopedics', 'bone', 'joint'],
    'Surgery': ['surgery', 'surgical'],
    'Surgical': ['surgery', 'surgical'],
    'Emergency': ['emergency', 'urgent', 'trauma'],
    'Urgent': ['emergency', 'urgent', 'trauma'],
    'Oncology': ['oncology', 'cancer', 'tumor'],
    'Cancer': ['oncology', 'cancer', 'tumor'],
    'Pediatrics': ['pediatric', 'pediatrics', 'children', 'child'],
    'Pediatric': ['pediatric', 'pediatrics', 'children', 'child'],
    'Children': ['pediatric', 'pediatrics', 'children', 'child'],
    'Internal Medicine': ['internal', 'medicine', 'general'],
    'General': ['internal', 'medicine', 'general'],
    'Obstetrics': ['obstetric', 'obstetrics', 'gynecology', 'women'],
    'Gynecology': ['obstetric', 'obstetrics', 'gynecology', 'women'],
    'Women': ['obstetric', 'obstetrics', 'gynecology', 'women']
  };
}
