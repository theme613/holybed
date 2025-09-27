import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { symptoms, description, pdfContent, mode } = req.body;

    if (!symptoms && !description && !pdfContent) {
      return res.status(400).json({ message: 'Symptoms, description, or PDF content is required' });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not found, using fallback analysis');
      return provideFallbackAnalysis(symptoms, description, pdfContent, mode, res);
    }

    const prompt = `You are a medical AI assistant. Analyze the following symptoms and determine the severity level and recommended action.

Mode: ${mode || 'normal'}
Symptoms: ${symptoms || ''}
Additional Description: ${description || ''}
${pdfContent ? `Medical Document Content: ${pdfContent}` : ''}

Please respond with a JSON object containing:
1. severity: "emergency", "urgent", "moderate", or "mild"
2. category: The medical category (e.g., "Cardiovascular", "Respiratory", "Gastrointestinal", "Neurological", "General")
3. recommendedAction: What the patient should do
4. urgencyExplanation: Brief explanation of why this severity level was chosen
5. recommendedDepartment: Which hospital department to visit
6. estimatedWaitTime: Estimated wait time based on severity

Guidelines for severity levels:
- emergency: Life-threatening symptoms (chest pain, severe bleeding, unconsciousness, difficulty breathing, stroke symptoms)
- urgent: Serious symptoms requiring prompt medical attention (severe pain, high fever, persistent vomiting)
- moderate: Symptoms that need medical attention but not immediately (moderate pain, persistent symptoms)
- mild: Minor symptoms that may resolve on their own (mild headache, minor cold symptoms)

${pdfContent ? 'IMPORTANT: If medical document content is provided, consider the test results, lab values, and medical history in your analysis. Pay special attention to abnormal values, concerning findings, or critical results mentioned in the document.' : ''}

Respond ONLY with valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant that analyzes symptoms and provides severity assessments. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    
    try {
      const analysisResult = JSON.parse(response);
      
      // Validate the response structure
      const requiredFields = ['severity', 'category', 'recommendedAction', 'urgencyExplanation', 'recommendedDepartment', 'estimatedWaitTime'];
      const hasAllFields = requiredFields.every(field => analysisResult.hasOwnProperty(field));
      
      if (!hasAllFields) {
        throw new Error('Invalid response structure');
      }

      res.status(200).json({
        success: true,
        analysis: analysisResult
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      res.status(500).json({ 
        success: false, 
        message: 'Error parsing analysis response',
        rawResponse: response 
      });
    }

  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    
    // Better error handling for different types of errors
    let errorMessage = 'Error analyzing symptoms';
    let statusCode = 500;
    
    if (error.message.includes('API key')) {
      errorMessage = 'OpenAI API key not configured properly';
      statusCode = 401;
    } else if (error.message.includes('insufficient_quota')) {
      errorMessage = 'OpenAI API quota exceeded';
      statusCode = 429;
    } else if (error.message.includes('model_not_found')) {
      errorMessage = 'OpenAI model not available';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Fallback analysis when OpenAI is not available
function provideFallbackAnalysis(symptoms, description, pdfContent, mode, res) {
  const symptomText = (symptoms || '').toLowerCase();
  const descText = (description || '').toLowerCase();
  const fullText = `${symptomText} ${descText}`.trim();
  
  let analysis = {
    severity: 'moderate',
    category: 'General',
    recommendedAction: 'Consult with a healthcare provider for proper evaluation',
    urgencyExplanation: 'Based on symptom analysis, medical consultation is recommended',
    recommendedDepartment: 'General Practice',
    estimatedWaitTime: '30-60 minutes'
  };

  // Emergency symptoms
  if (fullText.includes('chest pain') || fullText.includes('difficulty breathing') || 
      fullText.includes('shortness of breath') || fullText.includes('severe bleeding') ||
      fullText.includes('unconscious') || fullText.includes('stroke') ||
      fullText.includes('heart attack') || fullText.includes('severe headache')) {
    analysis = {
      severity: 'emergency',
      category: 'Emergency',
      recommendedAction: 'Seek immediate emergency medical attention. Call 999 or go to the nearest emergency room immediately.',
      urgencyExplanation: 'These symptoms may indicate a life-threatening condition requiring immediate medical intervention',
      recommendedDepartment: 'Emergency Department',
      estimatedWaitTime: 'Immediate'
    };
  }
  // Cardiovascular symptoms
  else if (fullText.includes('chest pain') || fullText.includes('heart') || 
           fullText.includes('cardiac') || fullText.includes('palpitation')) {
    analysis.category = 'Cardiovascular';
    analysis.recommendedDepartment = 'Cardiology';
    analysis.severity = 'urgent';
    analysis.recommendedAction = 'Seek prompt medical attention at a cardiology department or emergency room';
  }
  // Neurological symptoms
  else if (fullText.includes('headache') || fullText.includes('dizziness') || 
           fullText.includes('weakness') || fullText.includes('numbness') ||
           fullText.includes('confusion') || fullText.includes('seizure')) {
    analysis.category = 'Neurological';
    analysis.recommendedDepartment = 'Neurology';
  }
  // Respiratory symptoms
  else if (fullText.includes('cough') || fullText.includes('sore throat') || 
           fullText.includes('breathing') || fullText.includes('fever')) {
    analysis.category = 'Respiratory';
    analysis.recommendedDepartment = 'Respiratory Medicine';
  }
  // Gastrointestinal symptoms
  else if (fullText.includes('stomach pain') || fullText.includes('nausea') || 
           fullText.includes('vomiting') || fullText.includes('diarrhea')) {
    analysis.category = 'Gastrointestinal';
    analysis.recommendedDepartment = 'Gastroenterology';
  }
  // Orthopedic symptoms
  else if (fullText.includes('back pain') || fullText.includes('joint') || 
           fullText.includes('bone') || fullText.includes('muscle')) {
    analysis.category = 'Orthopedics';
    analysis.recommendedDepartment = 'Orthopedics';
  }

  // Adjust severity based on mode
  if (mode === 'emergency' && analysis.severity === 'moderate') {
    analysis.severity = 'urgent';
  }

  console.log('🤖 Fallback analysis provided:', analysis);
  
  res.status(200).json({
    success: true,
    analysis: analysis,
    fallback: true,
    message: 'Analysis provided by fallback system (OpenAI not available)'
  });
}
