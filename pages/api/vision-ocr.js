import { ImageAnnotatorClient } from '@google-cloud/vision';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for Google Cloud Vision
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'image/tiff' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TIFF, PNG, and JPEG files are allowed'), false);
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
        message: 'No file uploaded' 
      });
    }

    // Initialize Google Cloud Vision client
    const client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './holybed-e18056e0d97f.json',
    });

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

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
      // For image files (TIFF, PNG, JPEG), use text detection
      const [result] = await client.textDetection({
        image: { content: fileBuffer },
      });

      const detections = result.textAnnotations;
      if (detections && detections.length > 0) {
        // Get the first detection which contains all text
        extractedText = detections[0].description;
      }
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract meaningful text from the document. Please ensure the file contains readable text.' 
      });
    }

    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Limit text length to avoid token limits
    const maxLength = 8000;
    const truncatedText = cleanedText.length > maxLength 
      ? cleanedText.substring(0, maxLength) + '...' 
      : cleanedText;

    res.status(200).json({
      success: true,
      extractedText: truncatedText,
      originalLength: cleanedText.length,
      truncatedLength: truncatedText.length,
      mimeType: mimeType,
      method: 'google-cloud-vision'
    });

  } catch (error) {
    console.error('Error processing document with Google Cloud Vision:', error);
    
    if (error.message === 'Only PDF, TIFF, PNG, and JPEG files are allowed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF, TIFF, PNG, and JPEG files are allowed' 
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 20MB.' 
      });
    }

    // Handle Google Cloud authentication errors
    if (error.message && error.message.includes('authentication')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google Cloud authentication failed. Please check your credentials.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error processing document with Google Cloud Vision',
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
