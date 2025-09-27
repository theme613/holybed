import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', {
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
  console.log('=== PDF Upload Test Endpoint ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Running multer middleware...');
    
    // Run multer middleware
    await runMiddleware(req, res, upload.single('pdf'));

    console.log('Multer completed successfully');
    console.log('File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF file uploaded' 
      });
    }

    // Simple text extraction test
    const fileInfo = {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    };

    console.log('✅ Upload successful:', fileInfo);

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      fileInfo: fileInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed',
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
