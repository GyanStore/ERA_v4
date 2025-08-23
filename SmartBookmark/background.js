// Background service worker for Smart Bookmark Organizer

class BookmarkAnalyzer {
    constructor() {
        this.categories = [];
        this.bookmarks = [];
        this.maxBookmarksPerCategory = 25;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupMessageListeners();
        this.setupTabListeners();
    }

    async loadData() {
        try {
            console.log('📂 Background script: Loading data from storage...');
            const result = await chrome.storage.local.get(['categories', 'bookmarks']);
            console.log('Storage result:', result);
            
            this.categories = result.categories || this.getDefaultCategories();
            this.bookmarks = result.bookmarks || [];
            
            console.log('Loaded categories:', this.categories.length);
            console.log('Loaded bookmarks:', this.bookmarks.length);
            console.log('Category IDs:', this.categories.map(c => c.id));
            console.log('Bookmark category IDs:', this.bookmarks.map(b => b.categoryId));
            
            await this.saveData();
            console.log('✅ Background script data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data in background:', error);
        }
    }

    getDefaultCategories() {
        return [
            {
                id: 'ai',
                name: 'AI & Machine Learning',
                keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks', 'AI', 'ML', 'neural', 'algorithm', 'model', 'training'],
                parentId: null,
                type: 'main'
            },
            {
                id: 'system-design',
                name: 'System Design',
                keywords: ['system design', 'architecture', 'scalability', 'distributed systems', 'microservices', 'scaling', 'performance', 'infrastructure', 'design patterns'],
                parentId: null,
                type: 'main'
            },
            {
                id: 'new-tech',
                name: 'New Technology',
                keywords: ['new technology', 'emerging tech', 'innovation', 'latest tech', 'cutting edge', 'breakthrough', 'revolutionary', 'next generation'],
                parentId: null,
                type: 'main'
            },
            {
                id: 'programming',
                name: 'Programming',
                keywords: ['programming', 'coding', 'software development', 'algorithms', 'data structures', 'code', 'development', 'software', 'application'],
                parentId: null,
                type: 'main'
            }
        ];
    }

    async saveData() {
        try {
            await chrome.storage.local.set({
                categories: this.categories,
                bookmarks: this.bookmarks
            });
        } catch (error) {
            console.error('Error saving data in background:', error);
        }
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'analyzePage':
                    // This is now handled locally in the popup
                    sendResponse([]);
                    break;
                case 'getRelatedBookmarks':
                    this.getRelatedBookmarks(request.content, sendResponse);
                    return true;
                case 'addBookmark':
                    this.addBookmark(request.bookmark, request.processingMode).then(sendResponse);
                    return true; // Keep message channel open for async response
                case 'getCategories':
                    sendResponse(this.categories);
                    break;
                case 'analyzeContentForBookmark':
                    this.analyzeContentForBookmark(request.content, sendResponse);
                    return true;
                case 'hideFloatingIcon':
                    this.hideFloatingIcon(request.tabId);
                    break;
                case 'openExtensionPopup':
                    // Open the extension popup
                    this.openExtensionPopup(request.bookmark);
                    break;
                case 'checkDuplicateURL':
                    // Check if URL is already bookmarked
                    this.checkDuplicateURL(request.url, sendResponse);
                    return true; // Keep message channel open for async response
                case 'openExtensionForEdit':
                    // Open extension popup for editing existing bookmark
                    this.openExtensionForEdit(request.bookmark);
                    break;
                case 'openAddBookmarkPopup':
                    // Forward this message to the popup if it's open
                    this.forwardToPopup(request);
                    break;
                // Azure OpenAI integration
                case 'testAzureConnection':
                    this.testAzureConnection(request.config, sendResponse);
                    return true;
                    
                case 'generateNotes':
                    console.log('Received generateNotes request:', {
                        title: request.title,
                        contentLength: request.content?.text?.length,
                        model: request.model,
                        deployment: request.deployment
                    });
                    this.generateNotes(request.content, request.title, request.model, request.deployment, sendResponse);
                    return true;
                    
                case 'saveNotesToDownloads':
                    console.log('Received saveNotesToDownloads request:', {
                        title: request.title,
                        notesLength: request.notes?.length,
                        hasNotes: !!request.notes
                    });
                    this.saveNotesToDownloads(request.notes, request.title, sendResponse);
                    return true;
                    
                case 'openFile':
                    this.openFile(request.path, sendResponse);
                    return true;
            }
        });
    }

    async openExtensionPopup(bookmarkData) {
        try {
            // Try to open the extension popup
            await chrome.action.openPopup();
            
            // If popup opens successfully, send the bookmark data to it
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    action: 'openAddBookmarkPopup',
                    bookmark: bookmarkData
                }).catch(() => {
                    // If popup is not listening, store the request for later
                    this.storeBookmarkRequest({
                        action: 'openAddBookmarkPopup',
                        bookmark: bookmarkData
                    });
                });
            }, 100); // Small delay to ensure popup is ready
        } catch (error) {
            console.log('Could not open popup directly:', error);
            // Store the request for when popup is manually opened
            this.storeBookmarkRequest({
                action: 'openAddBookmarkPopup',
                bookmark: bookmarkData
            });
        }
    }

    forwardToPopup(request) {
        // Try to forward the message to any open popup
        chrome.runtime.sendMessage(request).catch(() => {
            // If no popup is listening, store the request for later
            console.log('No popup available, storing bookmark request for later');
            this.storeBookmarkRequest(request);
        });
    }

    async storeBookmarkRequest(request) {
        try {
            await chrome.storage.local.set({
                pendingBookmarkRequest: request.bookmark
            });
            console.log('Bookmark request stored for later processing');
        } catch (error) {
            console.error('Error storing bookmark request:', error);
        }
    }

    setupTabListeners() {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
                this.analyzeTab(tabId, tab);
            }
        });
    }

    async analyzeTab(tabId, tab) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: this.extractPageContent
            });
        } catch (error) {
            console.error('Error analyzing tab:', error);
        }
    }

    extractPageContent() {
        const content = {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.substring(0, 8000), // Increased for better analysis
            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
            headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent).join(' '),
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            links: Array.from(document.querySelectorAll('a')).map(a => a.textContent).join(' '),
            timestamp: new Date().toISOString()
        };

        chrome.runtime.sendMessage({
            action: 'analyzePage',
            tabId: chrome.tabs.TAB_ID_NONE,
            content: content
        });
    }

    // analyzePage function removed - now handled locally in popup

    async analyzeContentForBookmark(content, sendResponse) {
        try {
            const analysis = await this.performContentAnalysis(content);
            const categorySuggestion = this.suggestCategory(analysis);
            const description = this.generateDescription(content, analysis);
            
            sendResponse({
                success: true,
                analysis: analysis,
                categorySuggestion: categorySuggestion,
                description: description
            });
        } catch (error) {
            console.error('Error analyzing content:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async performContentAnalysis(content) {
        const text = `${content.title} ${content.text} ${content.metaDescription} ${content.headings}`.toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 3);
        
        // Count word frequencies
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // Extract key phrases (2-3 word combinations)
        const phrases = [];
        for (let i = 0; i < words.length - 1; i++) {
            phrases.push(words.slice(i, i + 2).join(' '));
        }
        for (let i = 0; i < words.length - 2; i++) {
            phrases.push(words.slice(i, i + 3).join(' '));
        }

        // Identify technical terms and concepts
        const technicalTerms = this.extractTechnicalTerms(text);
        
        return {
            wordFreq,
            phrases,
            technicalTerms,
            totalWords: words.length,
            keyTopics: this.extractKeyTopics(text),
            complexity: this.assessComplexity(text),
            domain: this.identifyDomain(text)
        };
    }

    extractTechnicalTerms(text) {
        const technicalPatterns = [
            /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g, // CamelCase terms
            /[a-z]+(?:\s+[a-z]+)*\s+(?:API|SDK|UI|UX|DB|ML|AI|API|REST|GraphQL|Docker|Kubernetes)/gi,
            /(?:algorithm|architecture|framework|library|database|protocol|interface|service|component)/gi
        ];
        
        const terms = new Set();
        technicalPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (match.length > 3) terms.add(match.toLowerCase());
                });
            }
        });
        
        return Array.from(terms);
    }

    extractKeyTopics(text) {
        const topics = [];
        const topicKeywords = {
            'AI/ML': ['machine learning', 'artificial intelligence', 'neural network', 'deep learning', 'algorithm'],
            'System Design': ['architecture', 'scalability', 'distributed', 'microservices', 'performance'],
            'Programming': ['code', 'development', 'software', 'application', 'framework'],
            'Data': ['database', 'data structure', 'analytics', 'processing', 'storage'],
            'Security': ['security', 'authentication', 'encryption', 'vulnerability', 'privacy'],
            'Cloud': ['cloud', 'aws', 'azure', 'google cloud', 'deployment']
        };

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            const score = keywords.filter(keyword => text.includes(keyword)).length;
            if (score > 0) {
                topics.push({ name: topic, score, keywords: score });
            }
        });

        return topics.sort((a, b) => b.score - a.score);
    }

    assessComplexity(text) {
        const technicalTerms = this.extractTechnicalTerms(text);
        const wordCount = text.split(/\s+/).length;
        const technicalDensity = technicalTerms.length / wordCount;
        
        if (technicalDensity > 0.1) return 'expert';
        if (technicalDensity > 0.05) return 'intermediate';
        return 'beginner';
    }

    identifyDomain(text) {
        const domains = {
            'AI Research': ['research', 'paper', 'study', 'experiment', 'model', 'training'],
            'Engineering': ['engineering', 'development', 'implementation', 'deployment', 'production'],
            'Tutorial': ['tutorial', 'guide', 'how-to', 'step-by-step', 'example'],
            'News': ['news', 'announcement', 'release', 'update', 'launch'],
            'Documentation': ['documentation', 'api', 'reference', 'manual', 'guide']
        };

        let bestDomain = 'General';
        let bestScore = 0;

        Object.entries(domains).forEach(([domain, keywords]) => {
            const score = keywords.filter(keyword => text.includes(keyword)).length;
            if (score > bestScore) {
                bestScore = score;
                bestDomain = domain;
            }
        });

        return bestDomain;
    }

    suggestCategory(analysis) {
        let bestCategory = null;
        let bestScore = 0;
        let shouldCreateSubCategory = false;
        let suggestedName = '';

        // First, try to match based on title and headings (most reliable)
        const titleAndHeadings = `${analysis.title} ${analysis.headings}`.toLowerCase();
        
        // Check existing categories first
        this.categories.forEach(category => {
            const score = this.calculateCategoryMatch(titleAndHeadings, category.keywords);
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        });

        // If we found a good match (score > 0.4), use it
        if (bestScore > 0.4) {
            // Check if we should create a sub-category
            if (bestScore > 0.6 && bestCategory.type === 'main') {
                // High confidence match - suggest sub-category
                shouldCreateSubCategory = true;
                suggestedName = this.generateSubCategoryName(analysis, bestCategory);
            }
            
            return {
                category: bestCategory,
                shouldCreateSubCategory,
                suggestedName,
                confidence: bestScore
            };
        }

        // If no good match found, analyze content more deeply
        const contentAnalysis = this.analyzeContentIntent(analysis);
        
        if (contentAnalysis.confidence > 0.3) {
            // Create new main category based on content analysis
            suggestedName = contentAnalysis.suggestedCategory;
            return {
                category: null,
                shouldCreateSubCategory: false,
                suggestedName,
                confidence: contentAnalysis.confidence,
                keywords: contentAnalysis.keywords
            };
        }

        // Fallback: use domain-based categorization
        const domainCategory = this.categorizeByDomain(analysis.url);
        if (domainCategory) {
            return {
                category: null,
                shouldCreateSubCategory: false,
                suggestedName: domainCategory,
                confidence: 0.2,
                keywords: this.extractKeywordsFromText(domainCategory)
            };
        }

        // Last resort: generic category
        return {
            category: null,
            shouldCreateSubCategory: false,
            suggestedName: 'General',
            confidence: 0.1,
            keywords: ['general', 'miscellaneous']
        };
    }

    analyzeContentIntent(analysis) {
        const content = `${analysis.title} ${analysis.headings} ${analysis.text}`.toLowerCase();
        
        // Define intent patterns with weights
        const intentPatterns = {
            'AI & Machine Learning': {
                patterns: [
                    'machine learning', 'artificial intelligence', 'neural network', 'deep learning',
                    'ai model', 'ml algorithm', 'data science', 'predictive analytics',
                    'computer vision', 'nlp', 'natural language processing', 'reinforcement learning'
                ],
                weight: 1.0
            },
            'System Design': {
                patterns: [
                    'system design', 'architecture', 'scalability', 'distributed systems',
                    'microservices', 'load balancing', 'database design', 'api design',
                    'performance optimization', 'system architecture', 'infrastructure'
                ],
                weight: 1.0
            },
            'Programming': {
                patterns: [
                    'programming', 'coding', 'software development', 'algorithm',
                    'data structure', 'framework', 'library', 'api', 'sdk',
                    'best practices', 'code review', 'testing', 'debugging'
                ],
                weight: 0.8
            },
            'Data & Analytics': {
                patterns: [
                    'data analysis', 'analytics', 'big data', 'data processing',
                    'statistics', 'visualization', 'business intelligence', 'data mining',
                    'etl', 'data warehouse', 'database', 'sql'
                ],
                weight: 0.9
            },
            'Security': {
                patterns: [
                    'security', 'cybersecurity', 'authentication', 'authorization',
                    'encryption', 'vulnerability', 'penetration testing', 'security audit',
                    'compliance', 'privacy', 'gdpr', 'security best practices'
                ],
                weight: 0.9
            },
            'Cloud & DevOps': {
                patterns: [
                    'cloud computing', 'aws', 'azure', 'google cloud', 'devops',
                    'ci/cd', 'docker', 'kubernetes', 'infrastructure as code',
                    'monitoring', 'logging', 'deployment', 'automation'
                ],
                weight: 0.9
            },
            'Web Development': {
                patterns: [
                    'web development', 'frontend', 'backend', 'full stack',
                    'react', 'angular', 'vue', 'node.js', 'html', 'css', 'javascript',
                    'responsive design', 'web performance', 'seo'
                ],
                weight: 0.8
            }
        };

        let bestIntent = null;
        let bestScore = 0;
        let bestKeywords = [];

        Object.entries(intentPatterns).forEach(([intent, config]) => {
            let score = 0;
            const matchedKeywords = [];

            config.patterns.forEach(pattern => {
                if (content.includes(pattern)) {
                    score += config.weight;
                    matchedKeywords.push(pattern);
                }
            });

            // Bonus for title/headings matches
            const titleScore = this.calculateTitleRelevance(analysis.title, analysis.headings, config.patterns);
            score += titleScore * 0.5;

            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent;
                bestKeywords = matchedKeywords;
            }
        });

        return {
            suggestedCategory: bestIntent || 'General',
            confidence: Math.min(bestScore / 5, 1), // Normalize to 0-1
            keywords: bestKeywords
        };
    }

    calculateTitleRelevance(title, headings, patterns) {
        let score = 0;
        const titleLower = title.toLowerCase();
        const headingsLower = headings.toLowerCase();

        patterns.forEach(pattern => {
            if (titleLower.includes(pattern)) {
                score += 2; // Title matches are worth more
            }
            if (headingsLower.includes(pattern)) {
                score += 1; // Heading matches
            }
        });

        return score;
    }

    categorizeByDomain(url) {
        try {
            const domain = new URL(url).hostname.toLowerCase();
            
            if (domain.includes('github.com')) return 'Programming';
            if (domain.includes('stackoverflow.com')) return 'Programming';
            if (domain.includes('medium.com')) return 'General';
            if (domain.includes('dev.to')) return 'Programming';
            if (domain.includes('arxiv.org')) return 'AI & Machine Learning';
            if (domain.includes('papers.ssrn.com')) return 'AI & Machine Learning';
            if (domain.includes('aws.amazon.com')) return 'Cloud & DevOps';
            if (domain.includes('azure.microsoft.com')) return 'Cloud & DevOps';
            if (domain.includes('cloud.google.com')) return 'Cloud & DevOps';
            if (domain.includes('kubernetes.io')) return 'Cloud & DevOps';
            if (domain.includes('docker.com')) return 'Cloud & DevOps';
            
            return null; // Let content analysis handle it
        } catch (error) {
            return null;
        }
    }

    calculateCategoryMatch(analysisText, keywords) {
        if (!keywords || keywords.length === 0) return 0;
        
        const categoryText = keywords.join(' ').toLowerCase();
        const contentWords = analysisText.toLowerCase().split(/\s+/);
        const contentWordSet = new Set(contentWords);
        
        let totalScore = 0;
        let maxPossibleScore = keywords.length;
        
        keywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase().trim();
            if (keywordLower.length < 3) return; // Skip very short keywords
            
            let keywordScore = 0;
            
            // Exact word match (highest score)
            if (contentWordSet.has(keywordLower)) {
                keywordScore = 1.0;
            }
            // Exact phrase match (high score)
            else if (analysisText.toLowerCase().includes(keywordLower)) {
                keywordScore = 0.9;
            }
            // Word contains keyword (medium score)
            else if (contentWords.some(word => word.includes(keywordLower))) {
                keywordScore = 0.6;
            }
            // Keyword contains word (lower score)
            else if (contentWords.some(word => keywordLower.includes(word))) {
                keywordScore = 0.4;
            }
            // Partial match (lowest score)
            else if (contentWords.some(word => {
                return word.length > 3 && (
                    word.substring(0, 3) === keywordLower.substring(0, 3) ||
                    word.substring(word.length - 3) === keywordLower.substring(keywordLower.length - 3)
                );
            })) {
                keywordScore = 0.2;
            }
            
            totalScore += keywordScore;
        });
        
        // Calculate final score as percentage of max possible
        const finalScore = totalScore / maxPossibleScore;
        
        // Apply logarithmic scaling for more realistic scores
        const scaledScore = Math.log10(1 + finalScore * 9) / Math.log10(10);
        
        return Math.min(scaledScore, 0.95); // Cap at 95%
    }

    generateCategoryName(analysis, parentCategory) {
        if (!parentCategory) {
            // Create new main category
            const topTopic = analysis.keyTopics[0];
            if (topTopic) {
                return `${topTopic.name} - ${analysis.domain}`;
            }
            return `${analysis.domain} - General`;
        }

        // Create sub-category name
        const specificTopic = analysis.technicalTerms[0] || analysis.keyTopics[0]?.name;
        if (specificTopic) {
            return `${parentCategory.name} - ${specificTopic}`;
        }
        
        return `${parentCategory.name} - ${analysis.domain}`;
    }

    generateDescription(content, analysis) {
        const title = content.title;
        const domain = analysis.domain;
        const complexity = analysis.complexity;
        const keyTopics = analysis.keyTopics.slice(0, 3).map(t => t.name).join(', ');
        const technicalTerms = analysis.technicalTerms.slice(0, 5).join(', ');
        
        let description = `${title} - A ${complexity} level resource covering ${keyTopics}. `;
        
        if (analysis.domain !== 'General') {
            description += `Domain: ${domain}. `;
        }
        
        if (technicalTerms) {
            description += `Key concepts: ${technicalTerms}. `;
        }
        
        if (content.metaDescription) {
            description += content.metaDescription.substring(0, 100);
        }
        
        return description;
    }

    async addBookmark(bookmark, processingMode = 'background') {
        try {
            // Check for duplicate URL (only for new bookmarks, not edits)
            if (!bookmark.isEdit) {
                const existingBookmark = this.bookmarks.find(b => b.url === bookmark.url);
                if (existingBookmark) {
                    return { 
                        success: false, 
                        error: `URL already bookmarked as "${existingBookmark.title}"` 
                    };
                }
            }

            if (processingMode === 'realtime') {
                // Real-time processing
                const analysis = await this.performContentAnalysis(bookmark);
                const categorySuggestion = this.suggestCategory(analysis);
                bookmark = await this.processBookmarkWithCategory(bookmark, categorySuggestion);
            } else {
                // Background processing - queue for later
                bookmark.processingStatus = 'queued';
                bookmark.queuedAt = new Date().toISOString();
            }

            this.bookmarks.push(bookmark);
            await this.saveData();
            
            // Check if we need to split categories
            await this.checkAndSplitCategories();
            
            return { 
                success: true, 
                bookmark: bookmark,
                categories: this.categories // Return updated categories
            };
        } catch (error) {
            console.error('Error adding bookmark:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async processBookmarkWithCategory(bookmark, categorySuggestion) {
        try {
            if (bookmark.customCategoryName && !bookmark.categoryId) {
                // User selected "Others" and provided a custom name - create new main category
                const newCategory = {
                    id: Date.now().toString(),
                    name: bookmark.customCategoryName,
                    keywords: this.extractKeywordsFromBookmark(bookmark),
                    parentId: null,
                    type: 'main'
                };
                
                this.categories.push(newCategory);
                bookmark.categoryId = newCategory.id;
                
            } else if (categorySuggestion.shouldCreateSubCategory && categorySuggestion.category) {
                // Create sub-category
                const subCategoryName = bookmark.customCategoryName || categorySuggestion.suggestedName;
                const newSubCategory = {
                    id: Date.now().toString(),
                    name: subCategoryName,
                    keywords: categorySuggestion.keywords || [],
                    parentId: categorySuggestion.category.id,
                    type: 'sub'
                };
                
                this.categories.push(newSubCategory);
                bookmark.categoryId = newSubCategory.id;
                
            } else if (categorySuggestion.shouldCreateSubCategory === false) {
                // Create new main category
                const categoryName = bookmark.customCategoryName || categorySuggestion.suggestedName;
                const newCategory = {
                    id: Date.now().toString(),
                    name: categoryName,
                    keywords: categorySuggestion.keywords || [],
                    parentId: null,
                    type: 'main'
                };
                
                this.categories.push(newCategory);
                bookmark.categoryId = newCategory.id;
                
            } else if (categorySuggestion.category) {
                // Use existing category
                bookmark.categoryId = categorySuggestion.category.id;
            }
            
            return bookmark;
        } catch (error) {
            console.error('Error processing bookmark with category:', error);
            return bookmark;
        }
    }

    extractKeywordsFromBookmark(bookmark) {
        const text = `${bookmark.title} ${bookmark.notes}`.toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 3);
        const wordFreq = {};
        
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        // Return top 10 most frequent words
        return Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    async checkAndSplitCategories() {
        this.categories.forEach(async (category) => {
            if (category.type === 'main') {
                const bookmarksInCategory = this.bookmarks.filter(b => b.categoryId === category.id);
                
                if (bookmarksInCategory.length > this.maxBookmarksPerCategory) {
                    await this.splitCategory(category, bookmarksInCategory);
                }
            }
        });
    }

    async splitCategory(category, bookmarks) {
        // Group bookmarks by similarity
        const groups = this.groupBookmarksBySimilarity(bookmarks);
        
        // Create sub-categories for each group
        groups.forEach((group, index) => {
            if (group.length > 0) {
                const subCategory = {
                    id: `sub_${category.id}_${index}`,
                    name: `${category.name} - ${this.generateSubCategoryName(group)}`,
                    keywords: this.extractCommonKeywords(group),
                    parentId: category.id,
                    type: 'sub'
                };
                
                this.categories.push(subCategory);
                
                // Update bookmarks to use new sub-category
                group.forEach(bookmark => {
                    bookmark.categoryId = subCategory.id;
                });
            }
        });
        
        await this.saveData();
    }

    groupBookmarksBySimilarity(bookmarks) {
        // Simple similarity grouping based on title and notes
        const groups = [];
        const processed = new Set();
        
        bookmarks.forEach(bookmark => {
            if (processed.has(bookmark.id)) return;
            
            const group = [bookmark];
            processed.add(bookmark.id);
            
            bookmarks.forEach(otherBookmark => {
                if (processed.has(otherBookmark.id)) return;
                
                const similarity = this.calculateBookmarkSimilarity(bookmark, otherBookmark);
                if (similarity > 0.3) {
                    group.push(otherBookmark);
                    processed.add(otherBookmark.id);
                }
            });
            
            groups.push(group);
        });
        
        return groups;
    }

    calculateBookmarkSimilarity(bookmark1, bookmark2) {
        const text1 = `${bookmark1.title} ${bookmark1.notes}`.toLowerCase();
        const text2 = `${bookmark2.title} ${bookmark2.notes}`.toLowerCase();
        
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    generateSubCategoryName(analysis, parentCategory) {
        if (!parentCategory) {
            // Create new main category
            const topTopic = analysis.keyTopics[0];
            if (topTopic) {
                return `${topTopic.name} - ${analysis.domain}`;
            }
            return `${analysis.domain} - General`;
        }

        // Create sub-category name
        const specificTopic = analysis.technicalTerms[0] || analysis.keyTopics[0]?.name;
        if (specificTopic) {
            return `${parentCategory.name} - ${specificTopic}`;
        }
        
        return `${parentCategory.name} - ${analysis.domain}`;
    }

    extractCommonKeywords(bookmarks) {
        const allText = bookmarks.map(b => `${b.title} ${b.notes}`).join(' ').toLowerCase();
        const words = allText.split(/\s+/).filter(word => word.length > 3);
        const wordFreq = {};
        
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        return Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([word]) => word);
    }

    // findRelatedBookmarks function removed - now handled locally in popup

    calculateRelevance(bookmark, currentContent, currentTitle) {
        let totalScore = 0;
        let maxPossibleScore = 0;
        
        // Content analysis with stricter matching
        const contentScore = this.calculateContentRelevance(bookmark, currentContent);
        const titleScore = this.calculateTitleRelevance(bookmark, currentTitle);
        const categoryScore = this.calculateCategoryRelevance(bookmark, currentContent);
        
        // Weighted scoring with stricter thresholds
        totalScore = (contentScore * 0.4) + (titleScore * 0.4) + (categoryScore * 0.2);
        maxPossibleScore = 1.0;
        
        // Apply reasonable scoring rules
        let finalScore = totalScore / maxPossibleScore;
        
        // Boost moderate matches slightly
        if (finalScore >= 0.3 && finalScore < 0.7) {
            finalScore = finalScore * 1.1; // Boost moderate matches
        }
        
        // Ensure score doesn't exceed 95% for very high matches
        finalScore = Math.min(finalScore, 0.95);
        
        // Round to 2 decimal places
        return Math.round(finalScore * 100) / 100;
    }

    calculateContentRelevance(bookmark, currentContent) {
        if (!currentContent || !bookmark.title) return 0;
        
        const content = currentContent.toLowerCase();
        const bookmarkTitle = bookmark.title.toLowerCase();
        const bookmarkNotes = (bookmark.notes || '').toLowerCase();
        
        let score = 0;
        let maxScore = 0;
        
        // Extract key terms from bookmark (more sophisticated)
        const bookmarkTerms = this.extractKeyTerms(bookmarkTitle + ' ' + bookmarkNotes);
        const contentTerms = this.extractKeyTerms(content);
        
        // Calculate term overlap with stricter matching
        let matchedTerms = 0;
        let totalBookmarkTerms = bookmarkTerms.length;
        
        for (const term of bookmarkTerms) {
            if (term.length < 3) continue; // Skip very short terms
            
            // Check for exact term match first
            if (contentTerms.includes(term)) {
                matchedTerms += 1.0;
            }
            // Check for phrase match (terms appearing together)
            else if (this.checkPhraseMatch(term, content)) {
                matchedTerms += 0.8;
            }
            // Check for partial match (but be more strict)
            else if (this.checkPartialMatch(term, content)) {
                matchedTerms += 0.4;
            }
        }
        
        if (totalBookmarkTerms > 0) {
            score = matchedTerms / totalBookmarkTerms;
        }
        
        // Additional content relevance checks
        const titleMatch = this.calculateTitleRelevance(bookmark, content);
        score = (score + titleMatch) / 2;
        
        return Math.min(score, 1.0);
    }

    extractKeyTerms(text) {
        if (!text) return [];
        
        // Remove common stop words and technical terms that don't add value
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'mine', 'yours', 'his', 'hers', 'ours', 'theirs',
            'what', 'when', 'where', 'why', 'how', 'which', 'who', 'whom',
            'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
            'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
            'just', 'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how',
            'also', 'even', 'still', 'again', 'ever', 'never', 'always', 'often', 'usually',
            'about', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after',
            'up', 'down', 'out', 'off', 'over', 'under', 'away', 'back', 'forward',
            'first', 'last', 'next', 'previous', 'current', 'new', 'old', 'good', 'bad',
            'big', 'small', 'large', 'little', 'high', 'low', 'long', 'short',
            'well', 'better', 'best', 'worse', 'worst', 'more', 'most', 'less', 'least',
            'much', 'many', 'few', 'several', 'some', 'any', 'all', 'none',
            'paper', 'research', 'study', 'analysis', 'method', 'approach', 'technique',
            'system', 'model', 'framework', 'architecture', 'design', 'implementation',
            'evaluation', 'experiment', 'result', 'conclusion', 'introduction', 'abstract',
            'section', 'chapter', 'page', 'figure', 'table', 'algorithm', 'code',
            'data', 'dataset', 'training', 'testing', 'validation', 'performance',
            'accuracy', 'efficiency', 'speed', 'time', 'space', 'memory', 'storage',
            'network', 'neural', 'deep', 'machine', 'learning', 'artificial', 'intelligence',
            'computer', 'software', 'hardware', 'application', 'program', 'function',
            'class', 'object', 'method', 'variable', 'parameter', 'argument',
            'database', 'query', 'index', 'table', 'record', 'field', 'column',
            'web', 'internet', 'protocol', 'http', 'https', 'url', 'domain', 'server',
            'client', 'browser', 'request', 'response', 'api', 'rest', 'graphql',
            'security', 'authentication', 'authorization', 'encryption', 'decryption',
            'error', 'exception', 'bug', 'debug', 'test', 'unit', 'integration',
            'deployment', 'production', 'development', 'staging', 'environment',
            'version', 'release', 'update', 'patch', 'hotfix', 'rollback'
        ]);
        
        // Extract meaningful terms
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length >= 3) // Only words with 3+ characters
            .filter(word => !stopWords.has(word)) // Remove stop words
            .filter(word => !/^\d+$/.test(word)) // Remove pure numbers
            .filter(word => !/^[a-z]$/.test(word)) // Remove single letters
            .filter(word => !/^(ai|ml|dl|nlp|cv|api|url|http|www|com|org|net|io)$/i.test(word)); // Remove common abbreviations
        
        // Remove duplicates and return
        return [...new Set(words)];
    }

    checkPhraseMatch(term, content) {
        // Check if the term appears as part of a meaningful phrase
        const phrases = [
            `${term} system`, `${term} design`, `${term} architecture`,
            `${term} model`, `${term} framework`, `${term} algorithm`,
            `${term} method`, `${term} approach`, `${term} technique`,
            `system ${term}`, `design ${term}`, `architecture ${term}`,
            `model ${term}`, `framework ${term}`, `algorithm ${term}`,
            `method ${term}`, `approach ${term}`, `technique ${term}`
        ];
        
        for (const phrase of phrases) {
            if (content.includes(phrase)) {
                return true;
            }
        }
        
        return false;
    }

    checkPartialMatch(term, content) {
        // More strict partial matching - only if term is substantial
        if (term.length < 5) return false; // Skip short terms for partial matching
        
        // Check if term appears as a substantial part of content
        const words = content.split(/\s+/);
        for (const word of words) {
            if (word.length >= 5 && (word.includes(term) || term.includes(word))) {
                // Ensure it's not just a coincidence
                const similarity = this.calculateWordSimilarity(term, word);
                if (similarity > 0.7) {
                    return true;
                }
            }
        }
        
        return false;
    }

    calculateWordSimilarity(word1, word2) {
        // Simple Levenshtein distance-based similarity
        const longer = word1.length > word2.length ? word1 : word2;
        const shorter = word1.length > word2.length ? word2 : word1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    calculateTitleRelevance(bookmark, currentTitle) {
        if (!currentTitle || !bookmark.title) return 0;
        
        const title = currentTitle.toLowerCase();
        const bookmarkTitle = bookmark.title.toLowerCase();
        
        // Extract key terms from both titles
        const titleTerms = this.extractKeyTerms(title);
        const bookmarkTerms = this.extractKeyTerms(bookmarkTitle);
        
        if (titleTerms.length === 0 || bookmarkTerms.length === 0) return 0;
        
        // Calculate term overlap
        let matchedTerms = 0;
        for (const term of bookmarkTerms) {
            if (titleTerms.includes(term)) {
                matchedTerms += 1.0;
            }
        }
        
        return matchedTerms / bookmarkTerms.length;
    }

    calculateCategoryRelevance(bookmark, currentContent) {
        if (!bookmark.categoryId || !currentContent) return 0;
        
        const category = this.categories.find(c => c.id === bookmark.categoryId);
        if (!category || !category.keywords) return 0;
        
        const content = currentContent.toLowerCase();
        const categoryKeywords = category.keywords.toLowerCase().split(',').map(k => k.trim());
        
        let matchedKeywords = 0;
        for (const keyword of categoryKeywords) {
            if (keyword.length >= 3 && content.includes(keyword)) {
                matchedKeywords += 1.0;
            }
        }
        
        return categoryKeywords.length > 0 ? matchedKeywords / categoryKeywords.length : 0;
    }

    async getRelatedBookmarks(content, sendResponse) {
        const related = this.findRelatedBookmarks(content);
        sendResponse(related);
    }

    async hideFloatingIcon(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: 'hideFloatingIcon'
            });
        } catch (error) {
            console.error('Error hiding floating icon:', error);
        }
    }

    async checkDuplicateURL(url, sendResponse) {
        const existingBookmark = this.bookmarks.find(b => b.url === url);
        if (existingBookmark) {
            sendResponse({ success: true, isDuplicate: true, existingBookmark: existingBookmark });
        } else {
            sendResponse({ success: true, isDuplicate: false });
        }
    }

    async openExtensionForEdit(bookmarkData) {
        try {
            await chrome.action.openPopup();
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    action: 'openAddBookmarkPopup',
                    bookmark: bookmarkData,
                    isEdit: true
                }).catch(() => {
                    this.storeBookmarkRequest({
                        action: 'openAddBookmarkPopup',
                        bookmark: bookmarkData,
                        isEdit: true
                    });
                });
            }, 100);
        } catch (error) {
            console.log('Could not open popup directly for edit:', error);
            this.storeBookmarkRequest({
                action: 'openAddBookmarkPopup',
                bookmark: bookmarkData,
                isEdit: true
            });
        }
    }

    async testAzureConnection(config, sendResponse) {
        try {
            console.log('Testing Azure OpenAI connection with config:', {
                endpoint: config.endpoint,
                model: config.model,
                deployment: config.deployment
            });
            
            const response = await fetch(`${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion || '2025-01-01-preview'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello! This is a test message to verify the Azure OpenAI connection.'
                        }
                    ],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Azure OpenAI test successful:', result);
                sendResponse({ success: true, message: 'Connection successful' });
            } else {
                const errorText = await response.text();
                console.error('Azure OpenAI test failed:', response.status, errorText);
                sendResponse({ 
                    success: false, 
                    error: `HTTP ${response.status}: ${errorText}` 
                });
            }
        } catch (error) {
            console.error('Azure OpenAI connection test error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async generateNotes(content, title, model, deployment, sendResponse) {
        try {
            console.log('Generating AI notes for:', title);
            
            // Get Azure config from storage
            const result = await chrome.storage.local.get(['settings']);
            const config = result.settings?.azureOpenAI;
            
            if (!config || !config.apiKey || !config.endpoint) {
                sendResponse({ 
                    success: false, 
                    error: 'Azure OpenAI not configured' 
                });
                return;
            }
            
            // Prepare the prompt for note generation
            const prompt = this.createNoteGenerationPrompt(content, title);
            
            console.log('Sending request to Azure OpenAI...');
            
            const response = await fetch(`${config.endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${config.apiVersion || '2025-01-01-preview'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert study assistant. Create comprehensive, well-structured study notes from the given content. Focus on key concepts, definitions, examples, and practical applications. Use clear headings, bullet points, and organize information logically.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.3,
                    top_p: 0.9
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const notes = result.choices[0]?.message?.content;
                
                if (notes) {
                    console.log('AI notes generated successfully');
                    sendResponse({ success: true, notes: notes });
                } else {
                    sendResponse({ 
                        success: false, 
                        error: 'No notes generated from AI response' 
                    });
                }
            } else {
                const errorText = await response.text();
                console.error('Azure OpenAI note generation failed:', response.status, errorText);
                sendResponse({ 
                    success: false, 
                    error: `HTTP ${response.status}: ${errorText}` 
                });
            }
        } catch (error) {
            console.error('AI note generation error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    createNoteGenerationPrompt(content, title) {
        return `Please create comprehensive study notes for the following content:

Title: ${title}

Content:
${content.text}

Meta Description: ${content.metaDescription}
Keywords: ${content.keywords}
Headings: ${content.headings}

Please create well-structured study notes that include:
1. **Key Concepts & Definitions** - Important terms and their explanations
2. **Main Topics** - Major themes and subjects covered
3. **Examples & Applications** - Practical instances and use cases
4. **Summary Points** - Key takeaways and conclusions
5. **Study Tips** - Suggestions for effective learning and retention

Format the notes with clear headings, bullet points, and logical organization. Make them suitable for revision and reference.`;
    }

    async saveNotesToDownloads(notes, title, sendResponse) {
        try {
            console.log('Saving notes to Downloads folder:', title);
            console.log('Notes content length:', notes.length);
            console.log('Notes preview:', notes.substring(0, 200));
            console.log('Title:', title);
            
            // Create a clean filename
            const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Study_Notes_${cleanTitle}_${timestamp}.md`;
            console.log('Generated filename:', filename);
            
            // Create the content with metadata
            const fileContent = `# Study Notes: ${title}

Generated on: ${new Date().toLocaleString()}
Source: Smart Bookmarks Extension

---

${notes}

---

*These notes were automatically generated using AI to help with your studies. Review and customize them as needed.*`;

            // Create a data URL for download (Chrome extension compatible)
            const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(fileContent)}`;
            
            // Use Chrome's download API with data URL
            const downloadId = await chrome.downloads.download({
                url: dataUrl,
                filename: filename,
                saveAs: false // Save directly to Downloads folder
            });
            
            if (downloadId) {
                console.log('Notes saved successfully with download ID:', downloadId);
                
                // Get the download path (this might not work in all cases due to security)
                try {
                    const downloadItem = await new Promise((resolve) => {
                        chrome.downloads.search({ id: downloadId }, (results) => {
                            if (results && results.length > 0) {
                                resolve(results[0]);
                            } else {
                                resolve(null);
                            }
                        });
                    });
                    
                    if (downloadItem && downloadItem.filename) {
                        sendResponse({ 
                            success: true, 
                            path: downloadItem.filename,
                            downloadId: downloadId 
                        });
                    } else {
                        sendResponse({ 
                            success: true, 
                            path: `Downloads/${filename}`,
                            downloadId: downloadId 
                        });
                    }
                } catch (error) {
                    console.log('Could not get exact path, using default:', error);
                    sendResponse({ 
                        success: true, 
                        path: `Downloads/${filename}`,
                        downloadId: downloadId 
                    });
                }
                
                // Data URL cleanup not needed
            } else {
                throw new Error('Failed to initiate download');
            }
            
        } catch (error) {
            console.error('Error saving notes to Downloads:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    async openFile(filePath, sendResponse) {
        try {
            console.log('Opening file:', filePath);
            
            // Try to open the file using the download ID if available
            if (filePath.includes('downloadId:')) {
                const downloadId = filePath.split('downloadId:')[1];
                await chrome.downloads.open(parseInt(downloadId));
                sendResponse({ success: true });
            } else {
                // Fallback: try to open the file path
                await chrome.downloads.open({ filename: filePath });
                sendResponse({ success: true });
            }
            
        } catch (error) {
            console.error('Error opening file:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }
}

// Initialize the bookmark analyzer
const analyzer = new BookmarkAnalyzer();

// Listen for storage changes to keep data in sync
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.categories) {
            analyzer.categories = changes.categories.newValue || [];
        }
        if (changes.bookmarks) {
            analyzer.bookmarks = changes.bookmarks.newValue || [];
        }
    }
}); 