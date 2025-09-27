// SQLite Database service for Holy bed application
// Simple, file-based database - no server setup required

const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'holybed.db');

let db;

// Initialize database connection
const initializeDatabase = () => {
  if (!db) {
    // Create data directory if it doesn't exist
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Connect to SQLite database
    db = new Database(DB_PATH);
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    console.log('✅ SQLite database connected:', DB_PATH);
    
    // Create tables
    createTables();
  }
  return db;
};

// Create database tables
const createTables = () => {
  const db = initializeDatabase();
  
  // User submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symptoms TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('emergency', 'normal')),
      uploaded_files TEXT, -- JSON array of file names
      user_location TEXT, -- JSON object with lat/lng
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT
    )
  `);
  
  // AI analysis results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('emergency', 'urgent', 'moderate', 'mild')),
      category TEXT NOT NULL,
      recommended_action TEXT,
      urgency_explanation TEXT,
      recommended_department TEXT,
      estimated_wait_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES user_submissions(id)
    )
  `);
  
  // Hospital recommendations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospital_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      hospital_name TEXT NOT NULL,
      hospital_address TEXT,
      distance_km REAL,
      wait_time_minutes INTEGER,
      available_beds INTEGER,
      contact_info TEXT,
      specialties TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES user_submissions(id)
    )
  `);
  
  // Preventive care analyses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS preventive_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      risk_factors TEXT NOT NULL, -- JSON array
      lifestyle_recommendations TEXT, -- JSON array
      medical_screenings TEXT, -- JSON array
      supplementation TEXT, -- JSON array
      warning_signs TEXT, -- JSON array
      follow_up_recommendations TEXT, -- JSON object
      health_goals TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES user_submissions(id)
    )
  `);
  
  console.log('✅ Database tables created/verified');
};

// Save user submission
const saveUserSubmission = (data) => {
  const db = initializeDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO user_submissions (symptoms, mode, uploaded_files, user_location, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.symptoms,
    data.mode,
    data.uploadedFiles ? JSON.stringify(data.uploadedFiles) : null,
    data.userLocation ? JSON.stringify(data.userLocation) : null,
    data.ipAddress || null,
    data.userAgent || null
  );
  
  return result.lastInsertRowid;
};

// Save AI analysis result
const saveAIAnalysis = (submissionId, analysis) => {
  const db = initializeDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO ai_analyses (
      submission_id, severity, category, recommended_action, 
      urgency_explanation, recommended_department, estimated_wait_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    submissionId,
    analysis.severity,
    analysis.category,
    analysis.recommendedAction,
    analysis.urgencyExplanation,
    analysis.recommendedDepartment,
    analysis.estimatedWaitTime
  );
  
  return result.lastInsertRowid;
};

// Save hospital recommendations
const saveHospitalRecommendations = (submissionId, hospitals) => {
  const db = initializeDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO hospital_recommendations (
      submission_id, hospital_name, hospital_address, distance_km,
      wait_time_minutes, available_beds, contact_info, specialties
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((hospitals) => {
    for (const hospital of hospitals) {
      stmt.run(
        submissionId,
        hospital.name,
        hospital.address || null,
        hospital.distance || null,
        hospital.waitTime || null,
        hospital.availableBeds || null,
        hospital.contactInfo || null,
        hospital.specialties ? JSON.stringify(hospital.specialties) : null
      );
    }
  });
  
  transaction(hospitals);
};

// Save preventive care analysis
const savePreventiveAnalysis = (submissionId, analysis) => {
  const db = initializeDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO preventive_analyses (
      submission_id, risk_factors, lifestyle_recommendations, medical_screenings,
      supplementation, warning_signs, follow_up_recommendations, health_goals
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    submissionId,
    JSON.stringify(analysis.riskFactors || []),
    JSON.stringify(analysis.preventiveMeasures?.lifestyle || []),
    JSON.stringify(analysis.preventiveMeasures?.medicalScreenings || []),
    JSON.stringify(analysis.preventiveMeasures?.supplementation || []),
    JSON.stringify(analysis.warningSignsToWatch || []),
    JSON.stringify(analysis.followUpRecommendations || {}),
    JSON.stringify(analysis.healthGoals || [])
  );
  
  return result.lastInsertRowid;
};

// Get analytics data
const getAnalytics = () => {
  const db = initializeDatabase();
  
  // Total submissions
  const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM user_submissions').get().count;
  
  // Submissions by mode
  const submissionsByMode = db.prepare(`
    SELECT mode, COUNT(*) as count 
    FROM user_submissions 
    GROUP BY mode
  `).all().reduce((acc, row) => {
    acc[row.mode] = row.count;
    return acc;
  }, {});
  
  // Submissions by date (last 7 days)
  const submissionsByDate = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM user_submissions 
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();
  
  // Top symptoms (extract first word from symptoms)
  const topSymptoms = db.prepare(`
    SELECT 
      CASE 
        WHEN symptoms LIKE '%fever%' THEN 'Fever'
        WHEN symptoms LIKE '%headache%' THEN 'Headache'
        WHEN symptoms LIKE '%chest pain%' OR symptoms LIKE '%chest%' THEN 'Chest Pain'
        WHEN symptoms LIKE '%shortness of breath%' OR symptoms LIKE '%breathing%' THEN 'Shortness of Breath'
        WHEN symptoms LIKE '%stomach%' OR symptoms LIKE '%abdominal%' THEN 'Stomach Pain'
        WHEN symptoms LIKE '%dizziness%' OR symptoms LIKE '%dizzy%' THEN 'Dizziness'
        WHEN symptoms LIKE '%cough%' THEN 'Cough'
        WHEN symptoms LIKE '%sore throat%' OR symptoms LIKE '%throat%' THEN 'Sore Throat'
        ELSE 'Other'
      END as symptom,
      COUNT(*) as count
    FROM user_submissions 
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY symptom
    HAVING symptom != 'Other'
    ORDER BY count DESC
    LIMIT 10
  `).all();
  
  // Severity distribution
  const severityDistribution = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM ai_analyses 
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY severity
  `).all().reduce((acc, row) => {
    acc[row.severity] = row.count;
    return acc;
  }, {});
  
  return {
    totalSubmissions,
    submissionsByMode,
    submissionsByDate,
    topSymptoms,
    severityDistribution,
    averageResponseTime: '2.1 seconds', // This would need to be calculated
    lastUpdated: new Date().toISOString()
  };
};

// Get recent submissions for admin view
const getRecentSubmissions = (limit = 50) => {
  const db = initializeDatabase();
  
  return db.prepare(`
    SELECT 
      us.id,
      us.symptoms,
      us.mode,
      us.created_at,
      aa.severity,
      aa.category,
      aa.recommended_department
    FROM user_submissions us
    LEFT JOIN ai_analyses aa ON us.id = aa.submission_id
    ORDER BY us.created_at DESC
    LIMIT ?
  `).all(limit);
};

// Close database connection
const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
    console.log('📦 Database connection closed');
  }
};

module.exports = {
  initializeDatabase,
  saveUserSubmission,
  saveAIAnalysis,
  saveHospitalRecommendations,
  savePreventiveAnalysis,
  getAnalytics,
  getRecentSubmissions,
  closeDatabase
};
