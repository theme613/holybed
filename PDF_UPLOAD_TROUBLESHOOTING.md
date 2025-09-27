# PDF Upload Troubleshooting Guide

## Common Issues and Solutions

### ❌ "Error uploading PDF"

This generic error can have several causes. Follow these steps to diagnose:

#### 1. **Check File Type**
- ✅ **Solution**: Ensure you're uploading a `.pdf` file
- ❌ **Common mistake**: Uploading `.doc`, `.docx`, `.jpg`, or other file types
- 🔍 **How to check**: Look at the file extension in your file manager

#### 2. **Check File Size**
- ✅ **Solution**: File must be under 10MB
- ❌ **Common mistake**: Large scanned documents or high-resolution PDFs
- 🔍 **How to check**: Right-click file → Properties/Get Info

#### 3. **Check PDF Content**
- ✅ **Solution**: PDF must contain readable text
- ❌ **Common mistake**: Image-only PDFs without OCR
- 🔍 **How to check**: Try to select/copy text from the PDF

#### 4. **Browser Issues**
- ✅ **Solution**: Try a different browser (Chrome, Firefox, Safari)
- ❌ **Common mistake**: Using outdated browser or blocking JavaScript
- 🔍 **How to check**: Open browser console (F12) for error messages

#### 5. **Network Issues**
- ✅ **Solution**: Check internet connection
- ❌ **Common mistake**: Slow/unstable connection during upload
- 🔍 **How to check**: Try uploading a smaller file first

## Detailed Error Messages

### "Only PDF files are allowed"
- **Cause**: File type validation failed
- **Solution**: 
  1. Check file extension is `.pdf`
  2. Verify MIME type is `application/pdf`
  3. Try saving/exporting the document as PDF again

### "File too large"
- **Cause**: File exceeds 10MB limit
- **Solutions**:
  1. Compress the PDF using online tools
  2. Reduce image quality in the PDF
  3. Split large documents into smaller parts

### "Could not extract text from PDF"
- **Cause**: PDF contains only images or is corrupted
- **Solutions**:
  1. Use OCR software to make PDF text-searchable
  2. Re-scan document with text recognition
  3. Try a different PDF viewer to verify content

### "OpenAI API key not configured"
- **Cause**: Missing or invalid API key
- **Solution**: 
  1. Add your OpenAI API key to `.env.local`
  2. Restart the development server
  3. Verify key starts with `sk-`

### "API quota exceeded"
- **Cause**: OpenAI usage limits reached
- **Solution**:
  1. Check OpenAI billing dashboard
  2. Add payment method or increase limits
  3. Wait for quota reset if on free tier

## Testing Steps

### 1. **Basic Upload Test**
```bash
# Test with a simple PDF
curl -X POST http://localhost:3001/api/test-pdf-upload \
  -F "pdf=@your-test-file.pdf" \
  -v
```

### 2. **Check Server Logs**
- Open browser console (F12)
- Look for detailed error messages
- Check network tab for failed requests

### 3. **Verify File Properties**
```bash
# Check file info on macOS/Linux
file your-document.pdf
ls -la your-document.pdf
```

## Supported PDF Types

### ✅ **Supported**
- Text-based PDFs (created from Word, etc.)
- Scanned documents with OCR
- Medical reports from hospitals/labs
- Mixed text and image PDFs
- Password-free PDFs

### ❌ **Not Supported**
- Image-only scans without OCR
- Password-protected PDFs
- Corrupted or damaged PDFs
- Non-PDF files renamed with .pdf extension
- Files over 10MB

## Best Practices

### 📄 **For Medical Reports**
1. **Scan Quality**: Use at least 300 DPI
2. **Text Recognition**: Enable OCR when scanning
3. **File Size**: Keep under 5MB for faster processing
4. **Orientation**: Ensure pages are right-side up
5. **Clarity**: Avoid blurry or low-contrast scans

### 🔧 **Technical Tips**
1. **Browser**: Use Chrome or Firefox for best compatibility
2. **Network**: Use stable Wi-Fi, not mobile data
3. **Files**: Test with a simple text PDF first
4. **Cache**: Clear browser cache if having issues
5. **JavaScript**: Ensure JavaScript is enabled

## Getting Help

### 🐛 **Debug Mode**
1. Open browser console (F12)
2. Upload your PDF
3. Copy any error messages
4. Check the Network tab for failed requests

### 📞 **Support Information**
- Check console logs for detailed errors
- Note your browser and operating system
- Include file size and type information
- Describe steps taken before the error occurred

## Quick Fixes

### 🚀 **Try These First**
1. **Refresh** the page and try again
2. **Different file** - test with a simple PDF
3. **Different browser** - try Chrome/Firefox
4. **Smaller file** - compress or reduce pages
5. **Clear cache** - refresh browser data

### 🔄 **If Still Not Working**
1. Restart your browser
2. Check internet connection
3. Try the test endpoint: `/api/test-pdf-upload`
4. Verify the development server is running
5. Check for any ad blockers or security software blocking uploads
