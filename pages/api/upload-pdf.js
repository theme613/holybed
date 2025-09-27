import multer from 'multer';
import pdf from 'pdf-parse';
import { ImageAnnotatorClient } from '@google-cloud/vision';

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
      // For PDF files, use document text detection
      const [result] = await client.documentTextDetection({
        image: { content: fileBuffer },
      });

      const fullTextAnnotation = result.fullTextAnnotation;
      if (fullTextAnnotation) {
        extractedText = fullTextAnnotation.text;
      }
    } else {
      // For image files, use text detection
      const [result] = await client.textDetection({
        image: { content: fileBuffer },
      });

      const detections = result.textAnnotations;
      if (detections && detections.length > 0) {
        extractedText = detections[0].description;
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
      // Try Google Cloud Vision first (better for scanned documents)
      extractedText = await extractTextWithGoogleVision(pdfBuffer, req.file.mimetype);
      extractionMethod = 'google-cloud-vision';
      
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Google Vision extraction failed or returned insufficient text');
      }
    } catch (visionError) {
      console.log('Google Cloud Vision failed, falling back to pdf-parse:', visionError.message);
      
      try {
        // Fallback to pdf-parse for text-based PDFs
        const pdfData = await pdf(pdfBuffer);
        extractedText = pdfData.text;
        extractionMethod = 'pdf-parse';
      } catch (parseError) {
        console.error('Both extraction methods failed:', parseError);
        return res.status(400).json({ 
          success: false, 
          message: 'Could not extract text from PDF using any method. Please ensure the PDF contains readable text.' 
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
    const maxLength = 8000; // Adjust based on your needs
    const truncatedText = cleanedText.length > maxLength 
      ? cleanedText.substring(0, maxLength) + '...' 
      : cleanedText;

    res.status(200).json({
      success: true,
      extractedText: truncatedText,
      originalLength: cleanedText.length,
      truncatedLength: truncatedText.length,
      extractionMethod: extractionMethod
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF files are allowed' 
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 10MB.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error processing PDF file',
      error: error.message 
    });
  }
}

// Disable body parsing for multer
export const config = {
  api: {
    bodyParser: false,
  },
};
