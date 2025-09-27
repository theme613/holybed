import multer from 'multer';
import pdf from 'pdf-parse';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Only PDF files are allowed. Received: ${file.mimetype}`), false);
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
  console.log('=== Simple PDF Parse Endpoint ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔄 Running multer middleware...');
    
    // Run multer middleware
    await runMiddleware(req, res, upload.single('pdf'));

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF file uploaded' 
      });
    }

    console.log('✅ File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    });

    // Extract text using pdf-parse
    console.log('📄 Extracting text with pdf-parse...');
    
    try {
      const pdfData = await pdf(req.file.buffer);
      
      console.log('✅ PDF parsing successful:', {
        textLength: pdfData.text.length,
        numPages: pdfData.numpages,
        info: pdfData.info
      });

      // Clean up the extracted text
      const cleanedText = pdfData.text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      if (!cleanedText || cleanedText.length < 10) {
        console.log('❌ Insufficient text extracted');
        return res.status(400).json({ 
          success: false, 
          message: 'Could not extract meaningful text from PDF. Please ensure the PDF contains readable text.' 
        });
      }

      // Limit text length to avoid token limits
      const maxLength = 8000;
      const truncatedText = cleanedText.length > maxLength 
        ? cleanedText.substring(0, maxLength) + '...[truncated]'
        : cleanedText;

      console.log('✅ Text extraction completed successfully');

      res.status(200).json({
        success: true,
        text: truncatedText,
        fullTextLength: cleanedText.length,
        extractionMethod: 'pdf-parse',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        numPages: pdfData.numpages,
        pdfInfo: pdfData.info,
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      console.error('❌ PDF parsing failed:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract text from PDF. The file may be corrupted, password-protected, or contain only images.',
        error: parseError.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error processing PDF',
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
