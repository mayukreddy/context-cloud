# Setup Guide - Context Cloud Extension

## 🔐 **Secure API Key Setup**

### **Step 1: Get Your OpenAI API Key**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### **Step 2: Configure the Extension**
```bash
# Copy the example config
cp config.example.js config.js

# Edit the config file
# Add your API key to the OPENAI_API_KEY field
```

### **Step 3: Security Best Practices**
- ✅ **Never commit your API key** to version control
- ✅ **Keep config.js local** (it's already in .gitignore)
- ✅ **Use environment variables** for production
- ✅ **Rotate your API key** regularly
- ✅ **Monitor usage** in OpenAI dashboard

### **Step 4: Load Extension**
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `contextfinal` folder

## 🚨 **Security Warnings**

### **What NOT to do:**
- ❌ Don't commit `config.js` to Git
- ❌ Don't share your API key publicly
- ❌ Don't hardcode keys in production
- ❌ Don't use the same key for multiple projects

### **What TO do:**
- ✅ Keep API keys in environment variables
- ✅ Use different keys for different environments
- ✅ Monitor API usage regularly
- ✅ Rotate keys periodically

## 🔧 **Advanced Setup Options**

### **Option 1: Environment Variables**
```javascript
// In config.js
OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
```

### **Option 2: Secure Storage**
```javascript
// Store key in browser's secure storage
const getSecureAPIKey = async () => {
  return await chrome.storage.secure.get(['openai_key']);
};
```

### **Option 3: OAuth Flow**
For enterprise use, implement OAuth to get API keys securely.

## 📊 **Usage Monitoring**

Monitor your API usage at:
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set up billing alerts
- Track costs per request

## 🆘 **Troubleshooting**

### **Extension not working:**
1. Check if API key is valid
2. Verify extension is loaded
3. Check browser console for errors
4. Ensure you have OpenAI credits

### **API errors:**
1. Check API key format
2. Verify account has credits
3. Check rate limits
4. Review OpenAI status page 