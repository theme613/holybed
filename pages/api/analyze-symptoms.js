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
    res.status(500).json({ 
      success: false, 
      message: 'Error analyzing symptoms',
      error: error.message 
    });
  }
}
