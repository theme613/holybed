#!/usr/bin/env python3
"""
ML API Server for BERT-based Medical Classification
FastAPI server to serve trained BERT models
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import json
from datetime import datetime
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Medical Symptom Classifier API", version="1.0.0")

# Global model variables
severity_model = None
specialty_model = None
tokenizer = None

# Class mappings
SEVERITY_LABELS = {
    0: 'routine',
    1: 'low', 
    2: 'medium',
    3: 'high',
    4: 'critical'
}

SPECIALTY_LABELS = {
    0: 'emergency',
    1: 'cardiology',
    2: 'respiratory', 
    3: 'neurology',
    4: 'gastroenterology',
    5: 'orthopedics',
    6: 'general'
}

# Request/Response models
class SymptomRequest(BaseModel):
    symptoms: str
    description: str = ""
    
class ClassificationResponse(BaseModel):
    severity: dict
    specialty: dict
    model_type: str
    timestamp: str
    confidence_scores: dict

@app.on_event("startup")
async def load_models():
    """Load BERT models on startup"""
    global severity_model, specialty_model, tokenizer
    
    try:
        logger.info("🚀 Loading BERT models...")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        
        # Try to load trained models
        severity_model_path = './severity_model'
        specialty_model_path = './specialty_model'
        
        if os.path.exists(severity_model_path) and os.path.exists(specialty_model_path):
            severity_model = AutoModelForSequenceClassification.from_pretrained(severity_model_path)
            specialty_model = AutoModelForSequenceClassification.from_pretrained(specialty_model_path)
            logger.info("✅ Custom trained models loaded successfully")
        else:
            # Use pre-trained models as fallback
            logger.warning("⚠️  Custom models not found, using base BERT models")
            severity_model = AutoModelForSequenceClassification.from_pretrained(
                'bert-base-uncased', num_labels=5
            )
            specialty_model = AutoModelForSequenceClassification.from_pretrained(
                'bert-base-uncased', num_labels=7
            )
        
        # Set models to evaluation mode
        severity_model.eval()
        specialty_model.eval()
        
        logger.info("🎯 Models ready for inference")
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        # Continue without models - will use fallback

def predict_with_bert(text: str):
    """Make predictions using BERT models"""
    if not severity_model or not specialty_model or not tokenizer:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    # Tokenize input
    inputs = tokenizer(
        text, 
        return_tensors='pt', 
        truncation=True, 
        padding=True, 
        max_length=512
    )
    
    try:
        # Predict severity
        with torch.no_grad():
            severity_outputs = severity_model(**inputs)
            severity_probs = torch.nn.functional.softmax(severity_outputs.logits, dim=-1)
            severity_pred = torch.argmax(severity_probs, dim=-1).item()
            severity_confidence = severity_probs[0][severity_pred].item()
            
            # Get top 3 severity predictions
            severity_top3 = torch.topk(severity_probs[0], 3)
            severity_scores = {
                SEVERITY_LABELS[idx.item()]: score.item() 
                for idx, score in zip(severity_top3.indices, severity_top3.values)
            }
        
        # Predict specialty
        with torch.no_grad():
            specialty_outputs = specialty_model(**inputs)
            specialty_probs = torch.nn.functional.softmax(specialty_outputs.logits, dim=-1)
            specialty_pred = torch.argmax(specialty_probs, dim=-1).item()
            specialty_confidence = specialty_probs[0][specialty_pred].item()
            
            # Get top 3 specialty predictions
            specialty_top3 = torch.topk(specialty_probs[0], 3)
            specialty_scores = {
                SPECIALTY_LABELS[idx.item()]: score.item()
                for idx, score in zip(specialty_top3.indices, specialty_top3.values)
            }
        
        return {
            'severity': {
                'label': SEVERITY_LABELS[severity_pred],
                'confidence': severity_confidence,
                'raw_prediction': severity_pred
            },
            'specialty': {
                'label': SPECIALTY_LABELS[specialty_pred], 
                'confidence': specialty_confidence,
                'raw_prediction': specialty_pred
            },
            'confidence_scores': {
                'severity_top3': severity_scores,
                'specialty_top3': specialty_scores
            },
            'model_type': 'bert-fine-tuned',
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Simple rule-based fallback classifier
def predict_with_rules(text: str):
    """Fallback rule-based classifier"""
    text_lower = text.lower()
    
    # Emergency keywords
    emergency_keywords = ['chest pain', 'can\'t breathe', 'unconscious', 'severe bleeding', 'stroke']
    # High priority keywords  
    high_keywords = ['severe', 'intense', 'acute', 'sudden onset']
    # Specialty keywords
    cardio_keywords = ['chest', 'heart', 'palpitation', 'cardiac']
    neuro_keywords = ['headache', 'seizure', 'numbness', 'confusion']
    
    # Determine severity
    if any(keyword in text_lower for keyword in emergency_keywords):
        severity = {'label': 'critical', 'confidence': 0.8, 'raw_prediction': 4}
    elif any(keyword in text_lower for keyword in high_keywords):
        severity = {'label': 'high', 'confidence': 0.7, 'raw_prediction': 3}
    else:
        severity = {'label': 'medium', 'confidence': 0.6, 'raw_prediction': 2}
    
    # Determine specialty
    if any(keyword in text_lower for keyword in cardio_keywords):
        specialty = {'label': 'cardiology', 'confidence': 0.7, 'raw_prediction': 1}
    elif any(keyword in text_lower for keyword in neuro_keywords):
        specialty = {'label': 'neurology', 'confidence': 0.7, 'raw_prediction': 3}
    else:
        specialty = {'label': 'general', 'confidence': 0.5, 'raw_prediction': 6}
    
    return {
        'severity': severity,
        'specialty': specialty,
        'confidence_scores': {
            'severity_top3': {severity['label']: severity['confidence']},
            'specialty_top3': {specialty['label']: specialty['confidence']}
        },
        'model_type': 'rule-based-fallback',
        'timestamp': datetime.now().isoformat()
    }

@app.post("/classify", response_model=ClassificationResponse)
async def classify_symptoms(request: SymptomRequest):
    """Classify symptoms using BERT or fallback to rules"""
    try:
        # Combine symptoms and description
        text = f"{request.symptoms} {request.description}".strip()
        
        if len(text) < 3:
            raise HTTPException(status_code=400, detail="Symptoms text too short")
        
        logger.info(f"🔍 Classifying: {text[:100]}...")
        
        # Try BERT prediction first
        try:
            result = predict_with_bert(text)
            logger.info(f"✅ BERT prediction: {result['severity']['label']}, {result['specialty']['label']}")
        except Exception as e:
            logger.warning(f"BERT prediction failed, using fallback: {e}")
            result = predict_with_rules(text)
            logger.info(f"✅ Rule-based prediction: {result['severity']['label']}, {result['specialty']['label']}")
        
        return ClassificationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": {
            "severity_model": severity_model is not None,
            "specialty_model": specialty_model is not None,
            "tokenizer": tokenizer is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Medical Symptom Classifier API",
        "version": "1.0.0",
        "endpoints": {
            "classify": "POST /classify - Classify symptoms",
            "health": "GET /health - Health check"
        },
        "model_type": "BERT-based with rule-based fallback"
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "ml_api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
