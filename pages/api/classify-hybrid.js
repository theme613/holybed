import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ML API server configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Classification methods
const CLASSIFICATION_METHODS = {
  OPENAI_PROMPT: 'openai-prompt',
  BERT_ML: 'bert-ml', 
  HYBRID: 'hybrid',
  RULE_BASED: 'rule-based'
};

// Medical specialty definitions (shared across methods)
const MEDICAL_SPECIALTIES = {
  'emergency': { name: 'Emergency Medicine', urgency: 'critical', waitTime: 'immediate', priority: 1 },
  'cardiology': { name: 'Cardiology', urgency: 'high', waitTime: '15-30 min', priority: 2 },
  'respiratory': { name: 'Pulmonology/Respiratory', urgency: 'high', waitTime: '20-40 min', priority: 3 },
  'neurology': { name: 'Neurology', urgency: 'high', waitTime: '30-60 min', priority: 4 },
  'gastroenterology': { name: 'Gastroenterology', urgency: 'medium', waitTime: '45-90 min', priority: 5 },
  'orthopedics': { name: 'Orthopedics', urgency: 'medium', waitTime: '60-120 min', priority: 6 },
  'general': { name: 'General Medicine', urgency: 'low', waitTime: '90-180 min', priority: 7 }
};

// OpenAI-based classification (fast, good for demos)
async function classifyWithOpenAI(symptoms, description) {
  const prompt = `
Classify these medical symptoms:

Symptoms: ${symptoms}
Description: ${description}

Classify into:
1. Severity (1-5): 1=routine, 2=low, 3=medium, 4=high, 5=critical
2. Medical Specialty: emergency, cardiology, respiratory, neurology, gastroenterology, orthopedics, general

Consider urgency, organ systems, and specialization needs.

Response format:
{
  "severity": {"level": 1-5, "label": "routine|low|medium|high|critical", "confidence": 0.0-1.0},
  "specialty": {"label": "specialty_name", "confidence": 0.0-1.0},
  "reasoning": "brief explanation"
}

Respond only with valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    return {
      severity: {
        level: result.severity.level,
        label: result.severity.label,
        confidence: result.severity.confidence
      },
      specialty: {
        label: result.specialty.label,
        confidence: result.specialty.confidence,
        details: MEDICAL_SPECIALTIES[result.specialty.label] || MEDICAL_SPECIALTIES.general
      },
      reasoning: result.reasoning,
      method: CLASSIFICATION_METHODS.OPENAI_PROMPT,
      processingTime: Date.now()
    };

  } catch (error) {
    console.error('OpenAI classification error:', error);
    throw new Error(`OpenAI classification failed: ${error.message}`);
  }
}

// BERT ML-based classification (more accurate, requires trained model)
async function classifyWithBERT(symptoms, description) {
  try {
    const response = await axios.post(`${ML_API_URL}/classify`, {
      symptoms: symptoms,
      description: description
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data;
    
    return {
      severity: {
        level: result.severity.raw_prediction + 1, // Convert 0-4 to 1-5
        label: result.severity.label,
        confidence: result.severity.confidence
      },
      specialty: {
        label: result.specialty.label,
        confidence: result.specialty.confidence,
        details: MEDICAL_SPECIALTIES[result.specialty.label] || MEDICAL_SPECIALTIES.general
      },
      confidence_scores: result.confidence_scores,
      method: CLASSIFICATION_METHODS.BERT_ML,
      processingTime: Date.now()
    };

  } catch (error) {
    console.error('BERT classification error:', error);
    throw new Error(`BERT classification failed: ${error.message}`);
  }
}

// Rule-based classification (fallback)
function classifyWithRules(symptoms, description) {
  const text = `${symptoms} ${description}`.toLowerCase();
  
  // Emergency patterns
  const emergencyPatterns = [
    /chest pain.*breathing/i,
    /can'?t breathe/i,
    /unconscious/i,
    /severe bleeding/i,
    /stroke/i,
    /heart attack/i
  ];
  
  // High priority patterns
  const highPriorityPatterns = [
    /severe|intense|acute|sudden/i,
    /emergency/i,
    /urgent/i
  ];
  
  // Specialty patterns
  const specialtyPatterns = {
    cardiology: /chest|heart|cardiac|palpitation|hypertension/i,
    respiratory: /breath|lung|cough|asthma|respiratory/i,
    neurology: /headache|seizure|numbness|confusion|neurological/i,
    gastroenterology: /stomach|abdominal|nausea|vomiting|digestive/i,
    orthopedics: /bone|joint|fracture|sprain|back pain/i,
    emergency: /emergency|critical|severe trauma/i
  };
  
  // Determine severity
  let severity;
  if (emergencyPatterns.some(pattern => pattern.test(text))) {
    severity = { level: 5, label: 'critical', confidence: 0.8 };
  } else if (highPriorityPatterns.some(pattern => pattern.test(text))) {
    severity = { level: 4, label: 'high', confidence: 0.7 };
  } else if (/moderate|medium/i.test(text)) {
    severity = { level: 3, label: 'medium', confidence: 0.6 };
  } else {
    severity = { level: 2, label: 'low', confidence: 0.5 };
  }
  
  // Determine specialty
  let specialty = { label: 'general', confidence: 0.5 };
  for (const [spec, pattern] of Object.entries(specialtyPatterns)) {
    if (pattern.test(text)) {
      specialty = { label: spec, confidence: 0.7 };
      break;
    }
  }
  
  return {
    severity,
    specialty: {
      ...specialty,
      details: MEDICAL_SPECIALTIES[specialty.label] || MEDICAL_SPECIALTIES.general
    },
    reasoning: 'Rule-based pattern matching',
    method: CLASSIFICATION_METHODS.RULE_BASED,
    processingTime: Date.now()
  };
}

// Hybrid approach: try BERT first, fallback to OpenAI, then rules
async function classifyWithHybrid(symptoms, description) {
  const startTime = Date.now();
  const results = [];
  
  // Try BERT first (most accurate if available)
  try {
    const bertResult = await classifyWithBERT(symptoms, description);
    results.push({ source: 'bert', result: bertResult, success: true });
    
    // If BERT confidence is high, use it
    if (bertResult.severity.confidence > 0.7 && bertResult.specialty.confidence > 0.7) {
      return {
        ...bertResult,
        method: CLASSIFICATION_METHODS.HYBRID,
        hybrid_info: {
          primary_method: 'bert',
          fallback_used: false,
          total_processing_time: Date.now() - startTime
        }
      };
    }
  } catch (error) {
    results.push({ source: 'bert', error: error.message, success: false });
    console.log('BERT failed, trying OpenAI...');
  }
  
  // Try OpenAI as fallback
  try {
    const openaiResult = await classifyWithOpenAI(symptoms, description);
    results.push({ source: 'openai', result: openaiResult, success: true });
    
    return {
      ...openaiResult,
      method: CLASSIFICATION_METHODS.HYBRID,
      hybrid_info: {
        primary_method: 'openai',
        fallback_used: true,
        bert_failed: results[0]?.success === false,
        total_processing_time: Date.now() - startTime
      }
    };
  } catch (error) {
    results.push({ source: 'openai', error: error.message, success: false });
    console.log('OpenAI failed, using rule-based fallback...');
  }
  
  // Final fallback to rules
  const ruleResult = classifyWithRules(symptoms, description);
  results.push({ source: 'rules', result: ruleResult, success: true });
  
  return {
    ...ruleResult,
    method: CLASSIFICATION_METHODS.HYBRID,
    hybrid_info: {
      primary_method: 'rules',
      fallback_used: true,
      bert_failed: results[0]?.success === false,
      openai_failed: results[1]?.success === false,
      total_processing_time: Date.now() - startTime
    }
  };
}

// Hospital matching based on classification
function matchHospitals(classification, availableHospitals) {
  if (!availableHospitals || availableHospitals.length === 0) return [];
  
  const specialty = classification.specialty.details;
  
  const rankedHospitals = availableHospitals
    .map(hospital => {
      let score = 0;
      
      // Availability score
      score += (hospital.availableBeds / hospital.totalBeds) * 30;
      
      // Urgency matching
      if (classification.severity.level >= 4 && hospital.availableBeds > 5) score += 40;
      if (classification.severity.level === 3 && hospital.availableBeds > 10) score += 30;
      if (classification.severity.level <= 2 && hospital.availableBeds > 0) score += 20;
      
      // Hospital priority for critical cases
      if (hospital.priority === 'high' && classification.severity.level >= 4) score += 20;
      
      // Wait time penalty
      const waitMinutes = parseInt(hospital.waitTime?.match(/\d+/)?.[0] || '30');
      score -= waitMinutes * 0.5;
      
      return {
        ...hospital,
        matchScore: Math.max(0, score),
        recommendedFor: specialty.name,
        estimatedWaitTime: hospital.waitTime || specialty.waitTime,
        urgencyMatch: classification.severity.level >= 4 ? 'high' : 'medium'
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
  
  return rankedHospitals;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { symptoms, description, hospitals, method = 'hybrid' } = req.body;

    if (!symptoms || symptoms.trim().length < 3) {
      return res.status(400).json({ 
        message: 'Symptoms are required and must be at least 3 characters' 
      });
    }

    console.log(`🔍 Classifying with method: ${method}, symptoms: ${symptoms.substring(0, 100)}...`);

    let classification;
    const startTime = Date.now();

    // Choose classification method
    switch (method) {
      case CLASSIFICATION_METHODS.OPENAI_PROMPT:
        classification = await classifyWithOpenAI(symptoms, description || '');
        break;
        
      case CLASSIFICATION_METHODS.BERT_ML:
        classification = await classifyWithBERT(symptoms, description || '');
        break;
        
      case CLASSIFICATION_METHODS.RULE_BASED:
        classification = classifyWithRules(symptoms, description || '');
        break;
        
      case CLASSIFICATION_METHODS.HYBRID:
      default:
        classification = await classifyWithHybrid(symptoms, description || '');
        break;
    }

    // Get hospital recommendations
    const hospitalRecommendations = matchHospitals(classification, hospitals || []);

    // Final response
    const response = {
      success: true,
      classification: {
        ...classification,
        processingTime: Date.now() - startTime
      },
      recommendations: {
        hospitals: hospitalRecommendations,
        immediateActions: generateImmediateActions(classification),
        followUpCare: generateFollowUpCare(classification)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        method: classification.method,
        total_processing_time: Date.now() - startTime
      }
    };

    console.log(`✅ Classification complete: ${classification.severity.label} (${classification.specialty.label}) via ${classification.method}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('Hybrid classification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error classifying symptoms',
      error: error.message,
      fallback_available: true
    });
  }
}

// Helper functions
function generateImmediateActions(classification) {
  const actions = [];
  
  if (classification.severity.level >= 5) {
    actions.push('🚨 Seek immediate emergency care');
    actions.push('📞 Call emergency services if symptoms worsen');
    actions.push('🏥 Go to nearest emergency room');
  } else if (classification.severity.level >= 4) {
    actions.push('⚡ Seek urgent care within 1 hour');
    actions.push('📱 Call healthcare provider immediately');
    actions.push('👀 Monitor symptoms closely');
  } else if (classification.severity.level >= 3) {
    actions.push('📅 Schedule appointment within 2-4 hours');
    actions.push('📝 Monitor and document symptoms');
  } else {
    actions.push('📋 Schedule routine appointment');
    actions.push('🏠 Continue home monitoring');
  }
  
  return actions;
}

function generateFollowUpCare(classification) {
  const followUp = [];
  
  if (classification.specialty.label !== 'general') {
    followUp.push(`🔬 Consider specialist consultation: ${classification.specialty.details.name}`);
  }
  
  followUp.push('👨‍⚕️ Follow up with primary care physician');
  followUp.push('📊 Keep symptom diary for ongoing monitoring');
  
  if (classification.severity.level >= 3) {
    followUp.push('🔄 Schedule follow-up within 24-48 hours');
  }
  
  return followUp;
}
