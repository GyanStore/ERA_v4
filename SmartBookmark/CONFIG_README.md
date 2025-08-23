# 🔧 Configuration Guide - Smart Bookmark Organizer

## 📋 Overview

The Smart Bookmark Organizer now uses a centralized configuration system to manage Azure OpenAI credentials and other settings. This makes the extension more secure, maintainable, and easier to deploy across different environments.

## 🗂️ Configuration Structure

### **File: `config.js`**

The main configuration file contains all Azure OpenAI settings and extension configuration:

```javascript
const CONFIG = {
    azureOpenAI: {
        production: { /* Production settings */ },
        test: { /* Test settings */ },
        development: { /* Development settings */ }
    },
    extension: { /* Extension metadata */ },
    features: { /* Feature flags */ },
    ui: { /* UI settings */ },
    api: { /* API settings */ }
};
```

## 🔐 Azure OpenAI Configuration

### **Environment-Specific Configurations**

#### **1. Production Environment**
```javascript
production: {
    apiKey: 'YOUR_PRODUCTION_API_KEY_HERE',
    endpoint: 'https://YOUR_RESOURCE.openai.azure.com/',
    model: 'gpt-4o',
    deployment: 'YOUR_DEPLOYMENT_NAME',
    apiVersion: '2025-01-01-preview'
}
```



#### **3. Development Environment**
```javascript
development: {
    apiKey: 'YOUR_DEV_API_KEY_HERE',
    endpoint: 'https://YOUR_DEV_RESOURCE.openai.azure.com/',
    model: 'gpt-4o',
    deployment: 'YOUR_DEV_DEPLOYMENT_NAME',
    apiVersion: '2025-01-01-preview'
}
```

## 🚀 How to Use

### **Step 1: Update Configuration File**

1. **Open `config.js`** in your code editor
2. **Replace placeholder values** with your actual Azure OpenAI credentials
3. **Save the file**

### **Step 2: Load Configuration in Extension**

1. **Open the extension popup**
2. **Go to Settings tab**
3. **Use the configuration loading buttons:**
   - 🧪 **Load Test Config** - Loads test environment settings
   - 🔧 **Load Dev Config** - Loads development environment settings
   - 🚀 **Load Prod Config** - Loads production environment settings

### **Step 3: Verify Configuration**

1. **Click "Test Connection"** to verify Azure OpenAI connectivity
2. **Check the status indicator** shows green (✅)
3. **Try generating AI notes** to confirm everything works

## 🔒 Security Best Practices

### **1. Never Commit Real Credentials**
- **Use environment variables** for production deployments
- **Keep test credentials** separate from production
- **Use placeholder values** in public repositories

### **2. Environment Separation**
- **Production**: Live Azure OpenAI resources
- **Test**: Dedicated test environment
- **Development**: Local development resources

### **3. Access Control**
- **Limit API key permissions** to minimum required
- **Use different keys** for different environments
- **Rotate keys regularly**

## 🛠️ Customization

### **Adding New Environments**

You can easily add new environments by extending the config:

```javascript
azureOpenAI: {
    staging: {
        apiKey: 'YOUR_STAGING_API_KEY',
        endpoint: 'https://YOUR_STAGING_RESOURCE.openai.azure.com/',
        model: 'gpt-4o',
        deployment: 'YOUR_STAGING_DEPLOYMENT',
        apiVersion: '2025-01-01-preview'
    }
}
```

### **Feature Flags**

Control which features are enabled:

```javascript
features: {
    aiNotesGeneration: true,    // Enable/disable AI notes
    realTimeCategorization: true, // Enable/disable real-time categorization
    floatingIcon: true,         // Enable/disable floating icon
    relatedBookmarks: true      // Enable/disable related bookmarks
}
```

### **UI Configuration**

Customize the user interface:

```javascript
ui: {
    maxBookmarksPerCategory: 25,    // Max bookmarks per category
    defaultRelevanceThreshold: 0.15, // Default relevance threshold
    animationDuration: 300,         // Animation duration in ms
    maxRecentBookmarks: 10          // Max recent bookmarks to show
}
```

## 📱 Extension Integration

### **Loading Configuration**

The extension automatically loads the configuration when the popup opens:

```javascript
// Access configuration in your code
if (window.SMART_BOOKMARKS_CONFIG) {
    const config = window.SMART_BOOKMARKS_CONFIG;
    const azureConfig = config.azureOpenAI.production;
}
```

### **Fallback Handling**

The extension includes fallback logic if the config file isn't available:

```javascript
if (window.SMART_BOOKMARKS_CONFIG && window.SMART_BOOKMARKS_CONFIG.azureOpenAI.test) {
    // Use config file
    this.settings.azureOpenAI = { ...window.SMART_BOOKMARKS_CONFIG.azureOpenAI.test };
} else {
    // Fallback to hardcoded values
    this.settings.azureOpenAI = { /* fallback values */ };
}
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Configuration Not Loading**
- **Check `config.js`** is properly included in `popup.html`
- **Verify file paths** are correct
- **Check browser console** for JavaScript errors

#### **2. Azure OpenAI Connection Fails**
- **Verify API key** is correct and active
- **Check endpoint URL** is accessible
- **Confirm deployment name** exists in Azure portal
- **Verify API version** is supported

#### **3. Configuration Buttons Not Working**
- **Check event listeners** are properly attached
- **Verify button IDs** match in HTML and JavaScript
- **Check for JavaScript errors** in console

### **Debug Information**

Enable debug mode to see detailed information:

1. **Click the 🐛 Debug button** in the extension popup
2. **Check browser console** for detailed logs
3. **Verify configuration loading** in debug output

## 📝 Example Configurations

### **Complete Production Configuration**

```javascript
production: {
    apiKey: 'sk-1234567890abcdef...',
    endpoint: 'https://mycompany.openai.azure.com/',
    model: 'gpt-4o',
    deployment: 'gpt-4o-production',
    apiVersion: '2025-01-01-preview'
}
```

### **Complete Test Configuration**

```javascript
test: {
    apiKey: 'sk-test1234567890...',
    endpoint: 'https://test.openai.azure.com/',
    model: 'gpt-4o',
    deployment: 'gpt-4o-test',
    apiVersion: '2025-01-01-preview'
}
```

## 🔄 Updates and Maintenance

### **Regular Maintenance**
- **Update API keys** when they expire
- **Verify endpoint URLs** are still accessible
- **Test configurations** after Azure updates
- **Review security settings** periodically

### **Version Control**
- **Never commit real credentials** to version control
- **Use environment-specific configs** for different deployments
- **Document configuration changes** in commit messages

---

## 📞 Support

If you encounter issues with the configuration system:

1. **Check this documentation** for common solutions
2. **Review browser console** for error messages
3. **Verify Azure OpenAI** service status
4. **Test with different environments** to isolate issues

**Happy configuring! 🎉** 