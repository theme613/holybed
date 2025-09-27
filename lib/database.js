// Database service for MySQL integration
// This replaces the Firebase approach with a structured SQL solution

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'holybed',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
let pool;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Database schema creation functions
const createTables = async () => {
  const connection = await getPool().getConnection();
  
  try {
    // Create user_submissions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symptoms TEXT NOT NULL,
        mode ENUM('emergency', 'normal') NOT NULL,
        uploaded_files JSON,
        user_location JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create ai_analysis table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        submission_id INT NOT NULL,
        category VARCHAR(255),
        severity ENUM('emergency', 'urgent', 'moderate', 'mild'),
        recommended_department VARCHAR(255),
        recommended_action TEXT,
        urgency_explanation TEXT,
        estimated_wait_time VARCHAR(100),
        confidence_score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES user_submissions(id) ON DELETE CASCADE
      )
    `);

    // Create hospitals table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        rating DECIMAL(2,1),
        user_ratings_total INT,
        business_status VARCHAR(50),
        is_government BOOLEAN DEFAULT FALSE,
        specialties JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create user_recommendations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        submission_id INT NOT NULL,
        hospital_id INT NOT NULL,
        distance_km DECIMAL(5,2),
        recommendation_score INT,
        rank_position INT,
        is_selected BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES user_submissions(id) ON DELETE CASCADE,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Save user submission
const saveUserSubmission = async (submissionData) => {
  const connection = await getPool().getConnection();
  
  try {
    const { symptoms, mode, uploadedFiles, userLocation } = submissionData;
    
    const [result] = await connection.execute(
      `INSERT INTO user_submissions (symptoms, mode, uploaded_files, user_location) 
       VALUES (?, ?, ?, ?)`,
      [
        symptoms,
        mode,
        JSON.stringify(uploadedFiles || []),
        JSON.stringify(userLocation || {})
      ]
    );

    console.log('✅ User submission saved with ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error saving user submission:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Save AI analysis results
const saveAIAnalysis = async (submissionId, analysisData) => {
  const connection = await getPool().getConnection();
  
  try {
    const {
      category,
      severity,
      recommendedDepartment,
      recommendedAction,
      urgencyExplanation,
      estimatedWaitTime,
      confidenceScore
    } = analysisData;

    const [result] = await connection.execute(
      `INSERT INTO ai_analysis 
       (submission_id, category, severity, recommended_department, recommended_action, 
        urgency_explanation, estimated_wait_time, confidence_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submissionId,
        category,
        severity,
        recommendedDepartment,
        recommendedAction,
        urgencyExplanation,
        estimatedWaitTime,
        confidenceScore || 0.95
      ]
    );

    console.log('✅ AI analysis saved with ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error saving AI analysis:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Save or update hospital information
const saveHospital = async (hospitalData) => {
  const connection = await getPool().getConnection();
  
  try {
    const {
      placeId,
      name,
      address,
      phone,
      lat,
      lng,
      rating,
      userRatingsTotal,
      businessStatus,
      isGovernment,
      specialties
    } = hospitalData;

    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle existing hospitals
    const [result] = await connection.execute(
      `INSERT INTO hospitals 
       (place_id, name, address, phone, latitude, longitude, rating, 
        user_ratings_total, business_status, is_government, specialties) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       address = VALUES(address),
       phone = VALUES(phone),
       rating = VALUES(rating),
       user_ratings_total = VALUES(user_ratings_total),
       business_status = VALUES(business_status),
       updated_at = CURRENT_TIMESTAMP`,
      [
        placeId,
        name,
        address || 'Address not available',
        phone || 'Phone not available',
        lat,
        lng,
        rating || 0,
        userRatingsTotal || 0,
        businessStatus || 'OPERATIONAL',
        isGovernment || false,
        JSON.stringify(specialties || [])
      ]
    );

    // Get the hospital ID (either inserted or existing)
    const [hospitalRows] = await connection.execute(
      'SELECT id FROM hospitals WHERE place_id = ?',
      [placeId]
    );

    const hospitalId = hospitalRows[0]?.id;
    console.log('✅ Hospital saved/updated with ID:', hospitalId);
    return hospitalId;
  } catch (error) {
    console.error('❌ Error saving hospital:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Save hospital recommendations for a submission
const saveHospitalRecommendations = async (submissionId, recommendations) => {
  const connection = await getPool().getConnection();
  
  try {
    for (let i = 0; i < recommendations.length; i++) {
      const hospital = recommendations[i];
      
      // First save the hospital
      const hospitalId = await saveHospital(hospital);
      
      // Then save the recommendation
      await connection.execute(
        `INSERT INTO user_recommendations 
         (submission_id, hospital_id, distance_km, recommendation_score, rank_position) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          submissionId,
          hospitalId,
          hospital.distance || 0,
          hospital.priorityScore || hospital.recommendationScore || 0,
          i + 1
        ]
      );
    }

    console.log('✅ Hospital recommendations saved for submission:', submissionId);
  } catch (error) {
    console.error('❌ Error saving hospital recommendations:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Get analytics data
const getAnalytics = async () => {
  const connection = await getPool().getConnection();
  
  try {
    // Get submission counts by mode
    const [modeStats] = await connection.execute(`
      SELECT mode, COUNT(*) as count 
      FROM user_submissions 
      GROUP BY mode
    `);

    // Get severity distribution
    const [severityStats] = await connection.execute(`
      SELECT severity, COUNT(*) as count 
      FROM ai_analysis 
      GROUP BY severity
    `);

    // Get top recommended hospitals
    const [topHospitals] = await connection.execute(`
      SELECT h.name, h.address, COUNT(ur.id) as recommendation_count,
             AVG(ur.distance_km) as avg_distance
      FROM hospitals h
      JOIN user_recommendations ur ON h.id = ur.hospital_id
      GROUP BY h.id
      ORDER BY recommendation_count DESC
      LIMIT 10
    `);

    // Get recent submissions
    const [recentSubmissions] = await connection.execute(`
      SELECT us.symptoms, us.mode, us.created_at,
             aa.category, aa.severity
      FROM user_submissions us
      LEFT JOIN ai_analysis aa ON us.id = aa.submission_id
      ORDER BY us.created_at DESC
      LIMIT 20
    `);

    return {
      modeStats,
      severityStats,
      topHospitals,
      recentSubmissions
    };
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await createTables();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  createTables,
  saveUserSubmission,
  saveAIAnalysis,
  saveHospital,
  saveHospitalRecommendations,
  getAnalytics,
  initializeDatabase
};
