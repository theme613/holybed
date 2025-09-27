# Google Cloud Vision API Setup Guide

This guide will help you set up Google Cloud Vision API for enhanced PDF text extraction in your Symptom Finder app.

## 🚀 Quick Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your Project ID

### 2. Enable Vision API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Vision API"
3. Click on "Cloud Vision API" and enable it

### 3. Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `symptom-finder-vision`
4. Description: `Service account for Symptom Finder PDF OCR`
5. Click "Create and Continue"

### 4. Grant Permissions
1. In the service account creation, add these roles:
   - `Cloud Vision API User`
   - `Storage Object Viewer` (if using GCS)
2. Click "Continue" and "Done"

### 5. Create and Download Key
1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file

### 6. Configure Environment
Add to your `.env` file:
```bash
# Google Cloud Vision API Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/downloaded-key.json
```

## 🔧 Alternative Setup (Environment Variables)

Instead of a JSON key file, you can use individual environment variables:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

## 💰 Billing

Google Cloud Vision API has a free tier:
- **Free Tier**: 1,000 requests per month
- **Pricing**: $1.50 per 1,000 requests after free tier

## 🧪 Testing

Once configured, your app will:
1. **Try Google Cloud Vision first** (better for scanned documents)
2. **Fallback to pdf-parse** (for text-based PDFs)
3. **Show extraction method** in the UI

## 🔍 Features

### Google Cloud Vision Benefits:
- ✅ **Better OCR** for scanned documents
- ✅ **Image-based PDFs** support
- ✅ **Multiple formats**: PDF, TIFF, PNG, JPEG
- ✅ **Higher accuracy** for complex layouts
- ✅ **Confidence scores** for text detection

### Fallback System:
- 📄 **pdf-parse** for text-based PDFs
- 🔄 **Automatic fallback** if Vision API fails
- 💰 **Cost-effective** for simple documents

## 🚨 Troubleshooting

### Common Issues:

1. **Authentication Error**
   ```
   Error: Google Cloud authentication failed
   ```
   **Solution**: Check your `GOOGLE_APPLICATION_CREDENTIALS` path

2. **Permission Denied**
   ```
   Error: Permission denied for Vision API
   ```
   **Solution**: Ensure service account has `Cloud Vision API User` role

3. **Billing Not Enabled**
   ```
   Error: Billing account required
   ```
   **Solution**: Enable billing in Google Cloud Console

4. **API Not Enabled**
   ```
   Error: Vision API not enabled
   ```
   **Solution**: Enable Cloud Vision API in Google Cloud Console

## 📊 Monitoring

Check your usage in Google Cloud Console:
1. Go to "APIs & Services" > "Dashboard"
2. Select "Cloud Vision API"
3. View usage and costs

## 🔒 Security Best Practices

1. **Never commit** service account keys to git
2. **Use environment variables** for production
3. **Rotate keys** regularly
4. **Limit permissions** to minimum required
5. **Monitor usage** for unexpected charges

## 📞 Support

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Support Center](https://cloud.google.com/support)
