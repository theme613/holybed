import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { pdfContent, symptoms, patientAge, patientGender } = req.body;

    if (!pdfContent) {
      return res.status(400).json({ message: 'Medical document content is required for preventive analysis' });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not found, using fallback preventive analysis');
      return provideFallbackPreventiveAnalysis(pdfContent, symptoms, res);
    }

    const prompt = `You are a preventive healthcare AI assistant. Analyze the following medical document and provide comprehensive preventive care recommendations to help prevent health issues before they require treatment.

Medical Document Content: ${pdfContent}
${symptoms ? `Current Symptoms: ${symptoms}` : ''}
${patientAge ? `Patient Age: ${patientAge}` : ''}
${patientGender ? `Patient Gender: ${patientGender}` : ''}

Based on the medical document analysis, provide preventive care recommendations in the following JSON format:

{
  "riskFactors": [
    {
      "factor": "Risk factor name",
      "severity": "low|moderate|high",
      "description": "Brief description of the risk"
    }
  ],
  "preventiveMeasures": {
    "lifestyle": [
      {
        "category": "Diet|Exercise|Sleep|Stress|Habits",
        "recommendation": "Specific actionable recommendation",
        "priority": "high|medium|low",
        "timeframe": "immediate|1-3 months|3-6 months|ongoing"
      }
    ],
    "medicalScreenings": [
      {
        "screening": "Name of screening/test",
        "frequency": "How often to do it",
        "reason": "Why this screening is important",
        "urgency": "routine|soon|urgent"
      }
    ],
    "supplementation": [
      {
        "supplement": "Vitamin/mineral name",
        "dosage": "Recommended dosage",
        "reason": "Why this supplement is recommended",
        "consultPhysician": true/false
      }
    ]
  },
  "warningSignsToWatch": [
    {
      "symptom": "Symptom to monitor",
      "action": "What to do if this occurs",
      "urgency": "immediate|within_days|routine_checkup"
    }
  ],
  "followUpRecommendations": {
    "nextCheckup": "Recommended timeframe for next medical checkup",
    "specialistReferral": "Any specialist consultations needed",
    "labTestsToMonitor": ["List of lab tests to track over time"]
  },
  "healthGoals": [
    {
      "goal": "Specific health goal",
      "timeline": "Expected timeframe to achieve",
      "measurableTarget": "How to measure success"
    }
  ]
}

Guidelines for recommendations:
- Focus on PREVENTION rather than treatment
- Base recommendations on actual findings in the medical document
- Consider age-appropriate preventive measures
- Prioritize evidence-based interventions
- Include both short-term and long-term preventive strategies
- Always recommend consulting healthcare providers for personalized advice

IMPORTANT: If lab values are abnormal, focus on lifestyle and dietary changes to prevent progression. If values are normal, focus on maintaining good health and preventing future issues.

Respond ONLY with valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better medical analysis
      messages: [
        {
          role: "system",
          content: "You are a preventive healthcare AI assistant that analyzes medical documents and provides evidence-based preventive care recommendations. Always prioritize prevention over treatment and encourage consultation with healthcare professionals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const response = completion.choices[0].message.content;
    
    try {
      const preventiveAnalysis = JSON.parse(response);
      
      // Validate the response structure
      const requiredFields = ['riskFactors', 'preventiveMeasures', 'warningSignsToWatch', 'followUpRecommendations', 'healthGoals'];
      const hasAllFields = requiredFields.every(field => preventiveAnalysis.hasOwnProperty(field));
      
      if (!hasAllFields) {
        throw new Error('Invalid preventive analysis response structure');
      }

      res.status(200).json({
        success: true,
        preventiveAnalysis: preventiveAnalysis,
        analysisType: 'preventive_care',
        timestamp: new Date().toISOString(),
        disclaimer: 'These are general preventive care suggestions based on your medical document. Always consult with your healthcare provider before making significant changes to your health routine.'
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI preventive analysis response:', parseError);
      res.status(500).json({ 
        success: false, 
        message: 'Error parsing preventive analysis response',
        rawResponse: response 
      });
    }

  } catch (error) {
    console.error('Error in preventive care analysis:', error);
    
    if (error.code === 'insufficient_quota') {
      res.status(429).json({
        success: false,
        message: 'OpenAI API quota exceeded',
        error: 'insufficient_quota'
      });
    } else if (error.code === 'invalid_api_key') {
      res.status(401).json({
        success: false,
        message: 'Invalid OpenAI API key',
        error: 'invalid_api_key'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error analyzing medical document for preventive care',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Fallback preventive analysis when OpenAI is not available
function provideFallbackPreventiveAnalysis(pdfContent, symptoms, res) {
  const content = (pdfContent || '').toLowerCase();
  
  // Basic analysis based on common health indicators
  let analysis = {
    riskFactors: [
      {
        factor: "General Health Monitoring",
        severity: "low",
        description: "Regular health monitoring recommended based on document analysis"
      }
    ],
    preventiveMeasures: {
      lifestyle: [
        {
          category: "Diet",
          recommendation: "Maintain a balanced diet rich in fruits, vegetables, and whole grains",
          priority: "high",
          timeframe: "ongoing"
        },
        {
          category: "Exercise",
          recommendation: "Engage in at least 150 minutes of moderate aerobic activity weekly",
          priority: "high",
          timeframe: "ongoing"
        },
        {
          category: "Sleep",
          recommendation: "Aim for 7-9 hours of quality sleep per night",
          priority: "medium",
          timeframe: "ongoing"
        }
      ],
      medicalScreenings: [
        {
          screening: "Annual Health Checkup",
          frequency: "Yearly",
          reason: "Monitor overall health status and catch issues early",
          urgency: "routine"
        }
      ],
      supplementation: []
    },
    warningSignsToWatch: [
      {
        symptom: "Persistent unusual symptoms",
        action: "Consult healthcare provider promptly",
        urgency: "within_days"
      }
    ],
    followUpRecommendations: {
      nextCheckup: "6-12 months",
      specialistReferral: "As recommended by primary care physician",
      labTestsToMonitor: ["Complete Blood Count", "Basic Metabolic Panel"]
    },
    healthGoals: [
      {
        goal: "Maintain current health status",
        timeline: "Ongoing",
        measurableTarget: "Regular checkups show stable health indicators"
      }
    ]
  };

  // Enhanced analysis based on document content
  if (content.includes('cholesterol') || content.includes('lipid')) {
    analysis.riskFactors.push({
      factor: "Cardiovascular Risk",
      severity: "moderate",
      description: "Cholesterol levels detected - cardiovascular prevention important"
    });
    
    analysis.preventiveMeasures.lifestyle.push({
      category: "Diet",
      recommendation: "Follow heart-healthy diet - limit saturated fats, increase omega-3 fatty acids",
      priority: "high",
      timeframe: "immediate"
    });
    
    analysis.preventiveMeasures.medicalScreenings.push({
      screening: "Lipid Panel",
      frequency: "Every 6-12 months",
      reason: "Monitor cholesterol levels and cardiovascular risk",
      urgency: "routine"
    });
  }

  if (content.includes('diabetes') || content.includes('glucose') || content.includes('blood sugar')) {
    analysis.riskFactors.push({
      factor: "Diabetes Risk",
      severity: "moderate",
      description: "Blood sugar levels require monitoring and lifestyle management"
    });
    
    analysis.preventiveMeasures.lifestyle.push({
      category: "Diet",
      recommendation: "Monitor carbohydrate intake, choose low glycemic index foods",
      priority: "high",
      timeframe: "immediate"
    });
    
    analysis.preventiveMeasures.medicalScreenings.push({
      screening: "HbA1c and Fasting Glucose",
      frequency: "Every 3-6 months",
      reason: "Monitor blood sugar control and prevent diabetes complications",
      urgency: "routine"
    });
  }

  if (content.includes('blood pressure') || content.includes('hypertension')) {
    analysis.riskFactors.push({
      factor: "Hypertension Risk",
      severity: "moderate",
      description: "Blood pressure management important for cardiovascular health"
    });
    
    analysis.preventiveMeasures.lifestyle.push({
      category: "Diet",
      recommendation: "Reduce sodium intake, follow DASH diet principles",
      priority: "high",
      timeframe: "immediate"
    });
    
    analysis.preventiveMeasures.lifestyle.push({
      category: "Stress",
      recommendation: "Practice stress management techniques like meditation or yoga",
      priority: "medium",
      timeframe: "1-3 months"
    });
  }

  res.status(200).json({
    success: true,
    preventiveAnalysis: analysis,
    analysisType: 'preventive_care_fallback',
    timestamp: new Date().toISOString(),
    disclaimer: 'These are general preventive care suggestions. This analysis was generated without AI assistance. Please consult with your healthcare provider for personalized advice.'
  });
}
