# OpenAI API Setup Guide

This guide will help you set up OpenAI API integration for the Symptom Finder app.

## 🚀 Quick Setup

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the API key (it starts with `sk-`)

### 2. Configure Environment Variables
1. Open the `.env.local` file in your project root
2. Replace `your_openai_api_key_here` with your actual API key:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Install Dependencies
The required dependencies are already installed:
- `openai` - OpenAI API client
- `ai` - AI SDK for additional functionality

### 4. Features Implemented

#### ✅ Symptom Analysis
- **Input Methods**: 
  - Text symptoms description
  - Additional context textarea
  - PDF medical document upload
- **AI Analysis**: GPT-3.5-turbo powered symptom analysis
- **Output**: Severity assessment, recommended actions, and hospital departments

#### ✅ PDF Document Processing
- **Google Cloud Vision**: Primary OCR method for scanned documents
- **PDF-parse**: Fallback for text-based PDFs
- **Smart Extraction**: Automatically chooses the best method

#### ✅ Intelligent Triage
- **Severity Levels**: Emergency, Urgent, Moderate, Mild
- **Smart Routing**: Recommends appropriate hospital departments
- **Wait Time Estimates**: Based on severity and current capacity
- **Emergency Alerts**: Special handling for critical conditions

## 🔧 API Endpoints

### `/api/analyze-symptoms`
- **Method**: POST
- **Purpose**: Analyze symptoms using OpenAI GPT
- **Input**: 
  ```json
  {
    "symptoms": "chest pain, shortness of breath",
    "description": "Started 2 hours ago, getting worse",
    "pdfContent": "extracted medical document text",
    "mode": "emergency"
  }
  ```
- **Output**:
  ```json
  {
    "success": true,
    "analysis": {
      "severity": "emergency",
      "category": "Cardiovascular",
      "recommendedAction": "Go to emergency room immediately",
      "urgencyExplanation": "Chest pain with breathing difficulty...",
      "recommendedDepartment": "Emergency Department",
      "estimatedWaitTime": "Immediate attention"
    }
  }
  ```

### `/api/upload-pdf`
- **Method**: POST
- **Purpose**: Extract text from medical PDFs
- **Input**: FormData with PDF file
- **Output**: Extracted text content

## 💰 Pricing & Usage

### OpenAI API Costs
- **GPT-3.5-turbo**: $0.0015 per 1K input tokens, $0.002 per 1K output tokens
- **Typical Analysis**: ~$0.01-0.03 per symptom analysis
- **Free Tier**: $5 credit for new accounts

### Usage Optimization
- **Token Limits**: Responses limited to 500 tokens max
- **Temperature**: Set to 0.3 for consistent medical analysis
- **Model**: Using GPT-3.5-turbo for cost efficiency

## 🔒 Security & Privacy

### Data Handling
- **No Storage**: Symptom data is not stored permanently
- **API Only**: Data sent only to OpenAI for analysis
- **Environment Variables**: API keys stored securely in `.env.local`

### Medical Disclaimer
- **AI Assistance**: This is AI-powered assistance, not medical diagnosis
- **Emergency Protocol**: Always directs emergency cases to call 999
- **Professional Care**: Recommends consulting healthcare professionals

## 🧪 Testing the Integration

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Symptom Analysis
1. Open http://localhost:3000
2. Enter symptoms like "chest pain, difficulty breathing"
3. Add additional description
4. Click "Find Help"
5. Review AI analysis results

### 3. Test PDF Upload
1. Upload a medical PDF document
2. Wait for text extraction
3. Analyze with AI
4. Review combined analysis

### 4. Test Emergency Mode
1. Switch to "Emergency" mode
2. Enter severe symptoms
3. Verify emergency alerts appear
4. Check immediate care recommendations

## 🛠️ Troubleshooting

### Common Issues

#### "OpenAI API Error"
- Check API key is correctly set in `.env.local`
- Verify API key has sufficient credits
- Ensure no extra spaces in the key

#### "PDF Upload Failed"
- Check file size (max 10MB)
- Verify PDF contains readable text
- Try both scanned and text-based PDFs

#### "Analysis Taking Too Long"
- Check internet connection
- Verify OpenAI API status
- Try simpler symptom descriptions

### Debug Mode
Enable detailed logging by adding to `.env.local`:
```bash
NODE_ENV=development
```

## 📱 Mobile Compatibility
- **Responsive Design**: Works on all devices
- **Touch Friendly**: Large buttons and inputs
- **File Upload**: Native mobile file picker support

## 🔄 Updates & Maintenance
- **API Monitoring**: Track usage in OpenAI dashboard
- **Model Updates**: Can easily switch to GPT-4 if needed
- **Cost Optimization**: Monitor token usage and optimize prompts
