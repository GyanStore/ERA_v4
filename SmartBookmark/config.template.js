// Smart Bookmark Organizer - Configuration Template
// Copy this file to config.js and fill in your actual values

const CONFIG = {
    // Azure OpenAI Configuration
    azureOpenAI: {
        // Production Configuration (replace with your actual values)
        production: {
            apiKey: 'YOUR_PRODUCTION_API_KEY_HERE',
            endpoint: 'https://YOUR_RESOURCE.openai.azure.com/',
            model: 'gpt-4o',
            deployment: 'YOUR_DEPLOYMENT_NAME',
            apiVersion: '2025-01-01-preview'
        },
        
        // Test Configuration (replace with your actual values)
        test: {
            apiKey: 'YOUR_TEST_API_KEY_HERE',
            endpoint: 'https://YOUR_TEST_RESOURCE.openai.azure.com/',
            model: 'gpt-4o',
            deployment: 'YOUR_TEST_DEPLOYMENT_NAME',
            apiVersion: '2025-01-01-preview'
        },
        
        // Development Configuration (replace with your actual values)
        development: {
            apiKey: 'YOUR_DEV_API_KEY_HERE',
            endpoint: 'https://YOUR_DEV_RESOURCE.openai.azure.com/',
            model: 'gpt-4o',
            deployment: 'YOUR_DEV_DEPLOYMENT_NAME',
            apiVersion: '2025-01-01-preview'
        }
    },
    
    // Extension Settings
    extension: {
        name: 'Smart Bookmark Organizer',
        version: '1.0.0',
        description: 'Intelligent bookmark organization with AI-powered categorization and related content discovery'
    },
    
    // Feature Flags
    features: {
        aiNotesGeneration: true,
        realTimeCategorization: true,
        floatingIcon: true,
        relatedBookmarks: true
    },
    
    // UI Configuration
    ui: {
        maxBookmarksPerCategory: 25,
        defaultRelevanceThreshold: 0.15,
        animationDuration: 300,
        maxRecentBookmarks: 10
    },
    
    // API Configuration
    api: {
        timeout: 30000,
        maxRetries: 3,
        rateLimitDelay: 1000
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.SMART_BOOKMARKS_CONFIG = CONFIG;
} 