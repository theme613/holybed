import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Medical specialty classifications
const MEDICAL_SPECIALTIES = {
  'emergency': {
    name: 'Emergency Medicine',
    urgency: 'critical',
    keywords: ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke symptoms', 'heart attack', 'severe trauma'],
    waitTime: 'immediate',
    priority: 1
  },
  'cardiology': {
    name: 'Cardiology',
    urgency: 'high',
    keywords: ['heart', 'chest pain', 'palpitations', 'hypertension', 'cardiac'],
    waitTime: '15-30 min',
    priority: 2
  },
  'respiratory': {
    name: 'Pulmonology/Respiratory',
    urgency: 'high',
    keywords: ['breathing', 'cough', 'asthma', 'lung', 'shortness of breath'],
    waitTime: '20-40 min',
    priority: 3
  },
  'neurology': {
    name: 'Neurology',
    urgency: 'high',
    keywords: ['headache', 'seizure', 'stroke', 'numbness', 'neurological'],
    waitTime: '30-60 min',
    priority: 4
  },
  'gastroenterology': {
    name: 'Gastroenterology',
    urgency: 'medium',
    keywords: ['stomach', 'abdominal', 'nausea', 'vomiting', 'digestive'],
    waitTime: '45-90 min',
    priority: 5
  },
  'orthopedics': {
    name: 'Orthopedics',
    urgency: 'medium',
    keywords: ['bone', 'joint', 'fracture', 'sprain', 'back pain'],
    waitTime: '60-120 min',
    priority: 6
  },
  'general': {
    name: 'General Medicine',
    urgency: 'low',
    keywords: ['fever', 'fatigue', 'general', 'routine'],
    waitTime: '90-180 min',
    priority: 7
  }
};

// Symptom severity classifier
async function classifySymptomSeverity(symptoms, description) {
  const prompt = `
As a medical AI assistant, classify the severity of these symptoms on a scale of 1-5:

Symptoms: ${symptoms}
Description: ${description}

Classification Scale:
1 = Routine/Non-urgent (can wait days)
2 = Low priority (can wait hours) 
3 = Medium priority (should be seen within 2-4 hours)
4 = High priority (should be seen within 1 hour)
5 = Critical/Emergency (immediate attention required)

Consider factors like:
- Pain level and duration
- Vital functions (breathing, consciousness, circulation)
- Potential for rapid deterioration
- Life-threatening indicators

Response format:
{
  "severity": [1-5],
  "reasoning": "Brief medical reasoning",
  "urgency": "critical|high|medium|low|routine",
  "timeframe": "immediate|<1hour|2-4hours|same day|routine"
}

Respond only with valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error classifying severity:', error);
    return {
      severity: 3,
      reasoning: "Unable to classify severity, defaulting to medium priority",
      urgency: "medium",
      timeframe: "2-4hours"
    };
  }
}

// Medical specialty classifier
async function classifyMedicalSpecialty(symptoms, description) {
  const specialtyList = Object.entries(MEDICAL_SPECIALTIES)
    .map(([key, spec]) => `${key}: ${spec.name}`)
    .join('\n');

  const prompt = `
As a medical AI assistant, classify these symptoms into the most appropriate medical specialty:

Symptoms: ${symptoms}
Description: ${description}

Available Specialties:
${specialtyList}

Consider:
- Primary organ systems involved
- Symptom patterns and presentations
- Urgency and specialization needs
- Most appropriate initial evaluation

Response format:
{
  "primary_specialty": "[specialty_key]",
  "secondary_specialty": "[optional_secondary_key]",
  "confidence": [0.0-1.0],
  "reasoning": "Brief explanation"
}

Respond only with valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error classifying specialty:', error);
    return {
      primary_specialty: "general",
      secondary_specialty: null,
      confidence: 0.5,
      reasoning: "Unable to classify specialty, defaulting to general medicine"
    };
  }
}

// Hospital matching based on classification
function matchHospitals(classification, availableHospitals) {
  const specialty = MEDICAL_SPECIALTIES[classification.primary_specialty] || MEDICAL_SPECIALTIES.general;
  
  // Filter and rank hospitals based on:
  // 1. Specialty availability
  // 2. Urgency matching
  // 3. Wait times
  // 4. Bed availability
  
  const rankedHospitals = availableHospitals
    .map(hospital => {
      let score = 0;
      
      // Availability score (more available beds = higher score)
      score += (hospital.availableBeds / hospital.totalBeds) * 30;
      
      // Urgency matching score
      if (specialty.urgency === 'critical' && hospital.availableBeds > 5) score += 40;
      if (specialty.urgency === 'high' && hospital.availableBeds > 10) score += 30;
      if (specialty.urgency === 'medium' && hospital.availableBeds > 0) score += 20;
      
      // Hospital priority (major hospitals for critical cases)
      if (hospital.priority === 'high' && specialty.urgency === 'critical') score += 20;
      
      // Wait time penalty
      const waitMinutes = parseInt(hospital.waitTime.match(/\d+/)?.[0] || '30');
      score -= waitMinutes * 0.5;
      
      return {
        ...hospital,
        matchScore: Math.max(0, score),
        recommendedFor: specialty.name,
        estimatedWaitTime: hospital.waitTime
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); // Top 5 matches
  
  return rankedHospitals;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { symptoms, description, hospitals } = req.body;

    if (!symptoms || !description) {
      return res.status(400).json({ 
        message: 'Symptoms and description are required' 
      });
    }

    console.log('🔍 Classifying symptoms:', symptoms.substring(0, 100) + '...');

    // Run classifications in parallel for speed
    const [severityResult, specialtyResult] = await Promise.all([
      classifySymptomSeverity(symptoms, description),
      classifyMedicalSpecialty(symptoms, description)
    ]);

    console.log('📊 Severity:', severityResult.severity, '- Specialty:', specialtyResult.primary_specialty);

    // Get hospital recommendations
    const hospitalRecommendations = hospitals ? 
      matchHospitals(specialtyResult, hospitals) : [];

    // Create comprehensive classification result
    const classification = {
      severity: severityResult,
      specialty: {
        ...specialtyResult,
        details: MEDICAL_SPECIALTIES[specialtyResult.primary_specialty] || MEDICAL_SPECIALTIES.general
      },
      recommendations: {
        hospitals: hospitalRecommendations,
        immediateActions: generateImmediateActions(severityResult, specialtyResult),
        followUpCare: generateFollowUpCare(severityResult, specialtyResult)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'openai-gpt4-prompt',
        processingTime: Date.now()
      }
    };

    res.status(200).json({
      success: true,
      classification: classification,
      summary: {
        severity: severityResult.severity,
        urgency: severityResult.urgency,
        specialty: specialtyResult.primary_specialty,
        confidence: specialtyResult.confidence,
        topHospital: hospitalRecommendations[0]?.name || 'No hospitals provided'
      }
    });

  } catch (error) {
    console.error('Error in symptom classification:', error);
    res.status(500).json({
      success: false,
      message: 'Error classifying symptoms',
      error: error.message
    });
  }
}

// Helper functions
function generateImmediateActions(severity, specialty) {
  const actions = [];
  
  if (severity.severity >= 4) {
    actions.push('Seek immediate emergency care');
    actions.push('Call emergency services if symptoms worsen');
  } else if (severity.severity === 3) {
    actions.push('Schedule urgent care appointment within 2-4 hours');
    actions.push('Monitor symptoms closely');
  } else {
    actions.push('Schedule routine appointment');
    actions.push('Continue monitoring symptoms');
  }
  
  return actions;
}

function generateFollowUpCare(severity, specialty) {
  const followUp = [];
  
  if (specialty.primary_specialty !== 'general') {
    followUp.push(`Consider specialist consultation: ${MEDICAL_SPECIALTIES[specialty.primary_specialty]?.name}`);
  }
  
  followUp.push('Follow up with primary care physician');
  followUp.push('Keep symptom diary for ongoing monitoring');
  
  return followUp;
}
