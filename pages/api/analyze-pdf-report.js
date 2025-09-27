import OpenAI from 'openai';
import multer from 'multer';
import pdf from 'pdf-parse';
import { ImageAnnotatorClient } from '@google-cloud/vision';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Helper function to run middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Google Cloud Vision OCR function
async function extractTextWithGoogleVision(fileBuffer, mimeType) {
  try {
    const client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './holybed-e18056e0d97f.json',
    });

    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const [result] = await client.documentTextDetection({
        image: { content: fileBuffer },
      });

      const fullTextAnnotation = result.fullTextAnnotation;
      if (fullTextAnnotation) {
        extractedText = fullTextAnnotation.text;
      }
    }

    return extractedText;
  } catch (error) {
    console.error('Google Cloud Vision error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('pdf'));

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF file uploaded' 
      });
    }

    // Extract text from PDF using Google Cloud Vision (primary) or pdf-parse (fallback)
    const pdfBuffer = req.file.buffer;
    let extractedText = '';
    let extractionMethod = '';

    try {
      // Try pdf-parse first (faster and works well for text-based PDFs)
      console.log('Attempting pdf-parse extraction...');
      const pdfData = await pdf(pdfBuffer);
      extractedText = pdfData.text;
      extractionMethod = 'pdf-parse';
      
      console.log('pdf-parse successful:', {
        textLength: extractedText.length,
        numPages: pdfData.numpages
      });
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('pdf-parse extraction returned insufficient text');
      }
    } catch (parseError) {
      console.log('pdf-parse failed, falling back to Google Cloud Vision:', parseError.message);
      
      try {
        // Fallback to Google Cloud Vision for scanned documents
        console.log('Attempting Google Cloud Vision extraction...');
        extractedText = await extractTextWithGoogleVision(pdfBuffer, req.file.mimetype);
        extractionMethod = 'google-cloud-vision';
        
        if (!extractedText || extractedText.trim().length < 10) {
          throw new Error('Google Vision extraction failed or returned insufficient text');
        }
      } catch (visionError) {
        console.error('Both extraction methods failed:', {
          pdfParseError: parseError.message,
          visionError: visionError.message
        });
        return res.status(400).json({ 
          success: false, 
          message: 'Could not extract text from PDF using any method. Please ensure the PDF contains readable text or try a different file.',
          errors: {
            pdfParse: parseError.message,
            googleVision: visionError.message
          }
        });
      }
    }
    
    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    if (!cleanedText || cleanedText.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract meaningful text from PDF. Please ensure the PDF contains readable text.' 
      });
    }

    // Limit text length to avoid token limits
    const maxLength = 12000;
    const truncatedText = cleanedText.length > maxLength 
      ? cleanedText.substring(0, maxLength) + '...[truncated]'
      : cleanedText;

    // Advanced medical report analysis prompt
    const prompt = `You are a medical AI assistant specializing in analyzing medical reports and lab results. Analyze the following medical document and provide a comprehensive assessment.

Medical Document Content:
${truncatedText}

Please respond with a JSON object containing:

1. reportType: The type of medical report (e.g., "Blood Test", "Radiology Report", "Pathology Report", "General Medical Report", "Lab Results", "Diagnostic Report")

2. keyFindings: An array of the most important findings from the report, each with:
   - finding: The specific finding
   - value: The measured value (if applicable)
   - normalRange: Normal range for this value (if applicable)
   - status: "normal", "abnormal", "borderline", or "critical"
   - significance: Brief explanation of what this means

3. abnormalValues: An array of any abnormal or concerning values found, each with:
   - parameter: Name of the test/measurement
   - value: The actual value
   - normalRange: What the normal range should be
   - severity: "mild", "moderate", "severe", or "critical"
   - explanation: What this abnormal value might indicate

4. overallAssessment: 
   - status: "normal", "minor_concerns", "moderate_concerns", "serious_concerns", or "critical"
   - summary: A brief overall summary of the report
   - recommendations: What the patient should do next

5. urgencyLevel: "routine", "follow_up_needed", "urgent_consultation", or "immediate_attention"

6. recommendedActions: An array of specific actions the patient should take

7. questionsForDoctor: An array of questions the patient should ask their doctor about these results

8. followUpTimeframe: When the patient should follow up (e.g., "1-2 weeks", "immediately", "3 months")

Guidelines:
- Focus on clinically significant findings
- Explain medical terms in patient-friendly language
- Be conservative in assessments - when in doubt, recommend professional consultation
- Pay attention to critical values that require immediate attention
- Consider the context of multiple test results together

IMPORTANT: This is for educational purposes only and does not replace professional medical advice.

Respond ONLY with valid JSON, no additional text.`;

    // Get AI analysis of the medical report
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for more accurate medical analysis
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant that analyzes medical reports and lab results. Always respond with valid JSON format and provide comprehensive, accurate medical interpretations while emphasizing the need for professional medical consultation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent medical analysis
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;
    
    try {
      const analysisResult = JSON.parse(response);
      
      // Validate the response structure
      const requiredFields = ['reportType', 'keyFindings', 'overallAssessment', 'urgencyLevel', 'recommendedActions'];
      const hasAllFields = requiredFields.every(field => analysisResult.hasOwnProperty(field));
      
      if (!hasAllFields) {
        throw new Error('Invalid response structure');
      }

      res.status(200).json({
        success: true,
        analysis: analysisResult,
        extractionMethod: extractionMethod,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedTextLength: cleanedText.length,
        timestamp: new Date().toISOString()
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
    console.error('Error analyzing PDF report:', error);
    
    // Better error handling for different types of errors
    let errorMessage = 'Error analyzing PDF report';
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

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};
