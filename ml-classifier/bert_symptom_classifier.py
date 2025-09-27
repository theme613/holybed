#!/usr/bin/env python3
"""
BERT-based Medical Symptom Classifier
Fine-tuned Hugging Face BERT for symptom classification and severity prediction
"""

import torch
import torch.nn as nn
from transformers import (
    BertTokenizer, BertForSequenceClassification, 
    AutoTokenizer, AutoModelForSequenceClassification,
    Trainer, TrainingArguments
)
from datasets import Dataset
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import json
import os
from datetime import datetime

class MedicalBERTClassifier:
    def __init__(self, model_name='bert-base-uncased', num_severity_classes=5, num_specialty_classes=7):
        """
        Initialize BERT-based medical classifier
        
        Args:
            model_name: Hugging Face model name
            num_severity_classes: Number of severity levels (1-5)
            num_specialty_classes: Number of medical specialties
        """
        self.model_name = model_name
        self.num_severity_classes = num_severity_classes
        self.num_specialty_classes = num_specialty_classes
        
        # Initialize tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Models for different classification tasks
        self.severity_model = None
        self.specialty_model = None
        
        # Class mappings
        self.severity_labels = {
            0: 'routine',
            1: 'low', 
            2: 'medium',
            3: 'high',
            4: 'critical'
        }
        
        self.specialty_labels = {
            0: 'emergency',
            1: 'cardiology',
            2: 'respiratory', 
            3: 'neurology',
            4: 'gastroenterology',
            5: 'orthopedics',
            6: 'general'
        }
    
    def prepare_training_data(self, csv_path):
        """
        Prepare training data from CSV file
        Expected columns: symptoms, description, severity, specialty
        """
        df = pd.read_csv(csv_path)
        
        # Combine symptoms and description
        df['text'] = df['symptoms'] + ' ' + df['description'].fillna('')
        
        # Create severity labels (0-4)
        severity_mapping = {'routine': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        df['severity_label'] = df['severity'].map(severity_mapping)
        
        # Create specialty labels (0-6) 
        specialty_mapping = {v: k for k, v in self.specialty_labels.items()}
        df['specialty_label'] = df['specialty'].map(specialty_mapping)
        
        return df
    
    def tokenize_data(self, texts, max_length=512):
        """Tokenize text data for BERT"""
        return self.tokenizer(
            texts.tolist(),
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors='pt'
        )
    
    def create_dataset(self, texts, labels):
        """Create PyTorch dataset"""
        encodings = self.tokenize_data(texts)
        
        class MedicalDataset(torch.utils.data.Dataset):
            def __init__(self, encodings, labels):
                self.encodings = encodings
                self.labels = labels
            
            def __getitem__(self, idx):
                item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
                item['labels'] = torch.tensor(self.labels[idx], dtype=torch.long)
                return item
            
            def __len__(self):
                return len(self.labels)
        
        return MedicalDataset(encodings, labels)
    
    def train_severity_classifier(self, train_data, val_data, output_dir='./severity_model'):
        """Train BERT model for severity classification"""
        print("🏥 Training severity classifier...")
        
        # Initialize model
        self.severity_model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=self.num_severity_classes
        )
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=64,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir='./logs',
            logging_steps=10,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
        )
        
        # Create trainer
        trainer = Trainer(
            model=self.severity_model,
            args=training_args,
            train_dataset=train_data,
            eval_dataset=val_data,
            tokenizer=self.tokenizer,
        )
        
        # Train model
        trainer.train()
        
        # Save model
        trainer.save_model(output_dir)
        print(f"✅ Severity model saved to {output_dir}")
        
        return trainer
    
    def train_specialty_classifier(self, train_data, val_data, output_dir='./specialty_model'):
        """Train BERT model for specialty classification"""
        print("🔬 Training specialty classifier...")
        
        # Initialize model
        self.specialty_model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=self.num_specialty_classes
        )
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=64,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir='./logs',
            logging_steps=10,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
        )
        
        # Create trainer
        trainer = Trainer(
            model=self.specialty_model,
            args=training_args,
            train_dataset=train_data,
            eval_dataset=val_data,
            tokenizer=self.tokenizer,
        )
        
        # Train model
        trainer.train()
        
        # Save model
        trainer.save_model(output_dir)
        print(f"✅ Specialty model saved to {output_dir}")
        
        return trainer
    
    def load_models(self, severity_model_path='./severity_model', specialty_model_path='./specialty_model'):
        """Load trained models"""
        try:
            self.severity_model = AutoModelForSequenceClassification.from_pretrained(severity_model_path)
            self.specialty_model = AutoModelForSequenceClassification.from_pretrained(specialty_model_path)
            print("✅ Models loaded successfully")
        except Exception as e:
            print(f"❌ Error loading models: {e}")
    
    def predict(self, text):
        """
        Predict severity and specialty for given symptoms
        
        Args:
            text: Combined symptoms and description
            
        Returns:
            dict: Predictions with confidence scores
        """
        if not self.severity_model or not self.specialty_model:
            raise ValueError("Models not loaded. Please load or train models first.")
        
        # Tokenize input
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
        
        # Predict severity
        with torch.no_grad():
            severity_outputs = self.severity_model(**inputs)
            severity_probs = torch.nn.functional.softmax(severity_outputs.logits, dim=-1)
            severity_pred = torch.argmax(severity_probs, dim=-1).item()
            severity_confidence = severity_probs[0][severity_pred].item()
        
        # Predict specialty
        with torch.no_grad():
            specialty_outputs = self.specialty_model(**inputs)
            specialty_probs = torch.nn.functional.softmax(specialty_outputs.logits, dim=-1)
            specialty_pred = torch.argmax(specialty_probs, dim=-1).item()
            specialty_confidence = specialty_probs[0][specialty_pred].item()
        
        return {
            'severity': {
                'label': self.severity_labels[severity_pred],
                'confidence': severity_confidence,
                'raw_prediction': severity_pred
            },
            'specialty': {
                'label': self.specialty_labels[specialty_pred], 
                'confidence': specialty_confidence,
                'raw_prediction': specialty_pred
            },
            'model_type': 'bert-fine-tuned',
            'timestamp': datetime.now().isoformat()
        }

def create_training_data_template():
    """Create template for training data"""
    sample_data = [
        {
            'symptoms': 'chest pain, shortness of breath',
            'description': 'Sharp chest pain for 2 hours, difficulty breathing, sweating',
            'severity': 'critical',
            'specialty': 'cardiology'
        },
        {
            'symptoms': 'headache, fever',
            'description': 'Mild headache and low-grade fever for 1 day',
            'severity': 'low',
            'specialty': 'general'
        },
        {
            'symptoms': 'severe abdominal pain',
            'description': 'Intense stomach pain, nausea, vomiting for 4 hours',
            'severity': 'high',
            'specialty': 'gastroenterology'
        },
        # Add more training examples...
    ]
    
    df = pd.DataFrame(sample_data)
    df.to_csv('medical_training_data.csv', index=False)
    print("📝 Training data template created: medical_training_data.csv")
    return df

def main():
    """Main training pipeline"""
    print("🚀 Starting BERT Medical Classifier Training...")
    
    # Initialize classifier
    classifier = MedicalBERTClassifier()
    
    # Create sample training data if it doesn't exist
    if not os.path.exists('medical_training_data.csv'):
        create_training_data_template()
        print("⚠️  Please populate medical_training_data.csv with real training data before training")
        return
    
    # Load and prepare data
    df = classifier.prepare_training_data('medical_training_data.csv')
    
    # Split data
    train_texts, val_texts, train_severity, val_severity = train_test_split(
        df['text'], df['severity_label'], test_size=0.2, random_state=42
    )
    
    train_texts, val_texts, train_specialty, val_specialty = train_test_split(
        df['text'], df['specialty_label'], test_size=0.2, random_state=42
    )
    
    # Create datasets
    train_severity_dataset = classifier.create_dataset(train_texts, train_severity.values)
    val_severity_dataset = classifier.create_dataset(val_texts, val_severity.values)
    
    train_specialty_dataset = classifier.create_dataset(train_texts, train_specialty.values)
    val_specialty_dataset = classifier.create_dataset(val_texts, val_specialty.values)
    
    # Train models
    classifier.train_severity_classifier(train_severity_dataset, val_severity_dataset)
    classifier.train_specialty_classifier(train_specialty_dataset, val_specialty_dataset)
    
    # Test prediction
    test_text = "chest pain and shortness of breath for 2 hours"
    prediction = classifier.predict(test_text)
    print(f"🧪 Test prediction: {prediction}")
    
    print("🎉 Training complete!")

if __name__ == "__main__":
    main()
