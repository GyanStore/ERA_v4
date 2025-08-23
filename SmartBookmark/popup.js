class BookmarkOrganizer {
    constructor() {
        console.log('🏗️ BookmarkOrganizer constructor called');
        this.currentTab = 'categories';
        this.categories = [];
        this.bookmarks = [];
        this.settings = {
            processingMode: 'realtime',
            maxBookmarks: 25,
            relevanceThreshold: 0.15,
            azureOpenAI: {
                apiKey: '',
                endpoint: '',
                model: '',
                deployment: '',
                apiVersion: ''
            }
        };
        console.log('⚙️ Initializing BookmarkOrganizer...');
        this.init();
    }

    async init() {
        await this.loadData();
        await this.loadSettings();
        this.setupMessageListeners();
        this.renderCategories();
        this.renderRecentBookmarks();
        this.setupEventListeners(); // Moved here after DOM is rendered
        this.updateSettingsUI();
    }

    async loadData() {
        try {
            console.log('📂 Loading data from storage...');
            const result = await chrome.storage.local.get(['categories', 'bookmarks']);
            console.log('Storage result:', result);
            
            this.categories = result.categories || [];
            this.bookmarks = result.bookmarks || [];
            
            console.log('Loaded from storage:', { 
                categories: this.categories.length, 
                bookmarks: this.bookmarks.length 
            });
            
            // If no categories exist, create default ones
            if (this.categories.length === 0) {
                console.log('No categories found, creating defaults...');
                this.categories = this.getDefaultCategories();
                await this.saveData();
            }
            
            // If no bookmarks exist, create a test bookmark
            if (this.bookmarks.length === 0) {
                console.log('No bookmarks found, creating test bookmark...');
                this.bookmarks = this.getTestBookmarks();
                await this.saveData();
            }
            
            console.log('Final loaded data:', { 
                categories: this.categories.length, 
                bookmarks: this.bookmarks.length 
            });
            
            // Debug: Check for specific bookmarks
            const systemDesignBookmarks = this.bookmarks.filter(b => b.categoryId === 'system-design');
            const allBookmarks = this.bookmarks.map(b => ({ id: b.id, title: b.title, categoryId: b.categoryId, url: b.url }));
            
            console.log('System Design bookmarks:', systemDesignBookmarks);
            console.log('All bookmarks:', allBookmarks);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            // Fallback to default categories
            this.categories = this.getDefaultCategories();
            this.bookmarks = this.getTestBookmarks();
        }
    }

    getDefaultCategories() {
        return [
            {
                id: 'ai-ml',
                name: 'AI & Machine Learning',
                keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks', 'AI', 'ML', 'data science'],
                parentId: null,
                type: 'main'
            },
            {
                id: 'system-design',
                name: 'System Design',
                keywords: ['system design', 'architecture', 'scalability', 'distributed systems', 'microservices', 'design patterns'],
                parentId: null,
                type: 'main'
            },
            {
                id: 'programming',
                name: 'Programming',
                keywords: ['programming', 'coding', 'software development', 'algorithms', 'data structures', 'best practices'],
                parentId: null,
                type: 'main'
            },
            {
                id: 'new-tech',
                name: 'New Technology',
                keywords: ['emerging technology', 'innovation', 'trends', 'future tech', 'disruption', 'cutting edge'],
                parentId: null,
                type: 'main'
            }
        ];
    }

    getTestBookmarks() {
        return [
            {
                id: 'test-1',
                title: 'System Design Roadmap',
                url: 'https://roadmap.sh/system-design',
                categoryId: 'system-design',
                notes: 'Comprehensive guide to system design concepts and patterns',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'test-2',
                title: 'Load Balancing Guide',
                url: 'https://example.com/load-balancing',
                categoryId: 'system-design',
                notes: 'Understanding load balancing strategies and algorithms',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'test-3',
                title: 'Microservices Architecture',
                url: 'https://example.com/microservices',
                categoryId: 'system-design',
                notes: 'Best practices for designing microservices',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            if (result.settings) {
                this.settings = { ...this.settings, ...result.settings };
            }
            this.updateSettingsUI();
            this.updateAzureStatus();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({ settings: this.settings });
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    updateAzureStatus() {
        const statusIndicator = document.getElementById('azureStatusIndicator');
        const statusText = document.getElementById('azureStatusText');
        
        if (!this.settings.azureOpenAI.apiKey || !this.settings.azureOpenAI.endpoint) {
            statusIndicator.textContent = '⚪';
            statusIndicator.className = 'status-indicator not-configured';
            statusText.textContent = 'Not configured';
        } else {
            statusIndicator.textContent = '✅';
            statusIndicator.className = 'status-indicator configured';
            const modelName = this.settings.azureOpenAI.model || 'Custom Model';
            const apiVersion = this.settings.azureOpenAI.apiVersion || 'Default';
            statusText.textContent = `Configured (${modelName}, ${apiVersion})`;
        }
    }

    updateSettingsUI() {
        document.getElementById('processingMode').value = this.settings.processingMode;
        document.getElementById('maxBookmarks').value = this.settings.maxBookmarks;
        document.getElementById('relevanceThreshold').value = this.settings.relevanceThreshold;
        document.getElementById('thresholdValue').textContent = this.settings.relevanceThreshold;
        
        // Update Azure OpenAI settings if elements exist
        if (document.getElementById('azureApiKey')) {
            document.getElementById('azureApiKey').value = this.settings.azureOpenAI.apiKey || '';
            document.getElementById('azureEndpoint').value = this.settings.azureOpenAI.endpoint || '';
            document.getElementById('azureModel').value = this.settings.azureOpenAI.model || '';
            document.getElementById('azureDeployment').value = this.settings.azureOpenAI.deployment || '';
            document.getElementById('azureApiVersion').value = this.settings.azureOpenAI.apiVersion || '';
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Tab switching
        const tabs = document.querySelectorAll('.tab');
        console.log(`📑 Found ${tabs.length} tabs:`, tabs);
        console.log('Tab elements:', tabs);
        
        tabs.forEach((btn, index) => {
            console.log(`Setting up tab ${index}:`, btn.dataset.tab, btn);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tab clicked:', e.target.closest('.tab').dataset.tab);
                const tabName = e.target.closest('.tab').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchBookmarks(e.target.value);
        });

        // Add bookmark button
        document.getElementById('addBookmarkBtn').addEventListener('click', () => {
            this.showBookmarkModal();
        });

        // Add category button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showCategoryModal();
        });

        // Refresh data button
        document.getElementById('refreshDataBtn').addEventListener('click', async () => {
            await this.loadData();
            this.renderCategories();
            this.renderRecentBookmarks();
            this.showSuccessMessage('Data refreshed!');
        });

        // Debug button
        document.getElementById('debugBtn').addEventListener('click', () => {
            this.showDebugInfo();
        });

        // Settings
        document.getElementById('relevanceThreshold').addEventListener('input', (e) => {
            document.getElementById('thresholdValue').textContent = e.target.value;
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettingsFromUI();
        });

        // Azure OpenAI settings
        document.getElementById('configureAzureBtn').addEventListener('click', () => {
            this.showAzureSettingsModal();
        });

        // Configuration loading buttons
        if (document.getElementById('loadTestConfigBtn')) {
            document.getElementById('loadTestConfigBtn').addEventListener('click', () => {
                this.loadTestConfiguration();
            });
        }
        
        if (document.getElementById('loadDevConfigBtn')) {
            document.getElementById('loadDevConfigBtn').addEventListener('click', () => {
                this.loadDevelopmentConfiguration();
            });
        }
        
        if (document.getElementById('loadProdConfigBtn')) {
            document.getElementById('loadProdConfigBtn').addEventListener('click', () => {
                this.loadProductionConfiguration();
            });
        }

        // Generate Notes modal
        document.getElementById('closeGenerateNotesModal').addEventListener('click', () => {
            this.hideGenerateNotesModal();
        });

        // Azure Settings modal
        document.getElementById('closeAzureSettingsModal').addEventListener('click', () => {
            this.hideAzureSettingsModal();
        });

        document.getElementById('saveAzureSettings').addEventListener('click', () => {
            this.saveAzureSettings();
        });

        document.getElementById('testAzureConnection').addEventListener('click', () => {
            this.testAzureConnection();
        });

        // Modal event listeners
        this.setupModalListeners();

        // Add click handlers for bookmark items using event delegation
        document.addEventListener('click', (e) => {
            // Handle action button clicks
            if (e.target.closest('.bookmark-action-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const button = e.target.closest('.bookmark-action-btn');
                const action = button.dataset.action;
                const bookmarkId = button.dataset.bookmarkId;
                
                console.log(`🎯 Action button clicked: ${action} for bookmark ID: ${bookmarkId}`);
                
                // Handle different actions
                try {
                    switch (action) {
                        case 'toggle':
                            console.log('🔄 Toggling bookmark details...');
                            this.toggleBookmarkDetails(bookmarkId);
                            break;
                        case 'notes':
                            console.log('📝 Opening notes generation...');
                            this.showGenerateNotesModal(bookmarkId);
                            break;
                        case 'edit':
                            console.log('✏️ Opening edit modal...');
                            this.editBookmark(bookmarkId);
                            break;
                        case 'move':
                            console.log('📁 Opening move modal...');
                            this.showMoveBookmarkModal(bookmarkId);
                            break;
                        case 'delete':
                            console.log('🗑️ Deleting bookmark...');
                            this.deleteBookmark(bookmarkId);
                            break;
                        default:
                            console.warn('⚠️ Unknown action:', action);
                    }
                } catch (error) {
                    console.error('❌ Error executing action:', error);
                }
                
                return; // Don't proceed to URL opening
            }
            
            // Handle bookmark item clicks for URL opening
            if (e.target.closest('.bookmark-item')) {
                const bookmarkItem = e.target.closest('.bookmark-item');
                const url = bookmarkItem.dataset.url;
                
                if (url) {
                    console.log('🔗 Opening bookmark URL:', url);
                    chrome.tabs.create({ url: url });
                }
            }
        });
        
        console.log('✅ Event listeners setup complete');
    }

    setupMessageListeners() {
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'openAddBookmarkPopup':
                    this.handleAddCurrentPage(request.bookmark);
                    break;
                case 'openExtensionPopup':
                    // This will open the popup (already open)
                    break;
            }
        });

        // Also check if we should handle a pending bookmark request
        this.checkPendingBookmarkRequest();
    }

    async checkPendingBookmarkRequest() {
        try {
            // Check if there's a pending bookmark request in storage
            const result = await chrome.storage.local.get(['pendingBookmarkRequest']);
            if (result.pendingBookmarkRequest) {
                // Clear the pending request
                await chrome.storage.local.remove(['pendingBookmarkRequest']);
                
                // Handle the bookmark request
                this.handleAddCurrentPage(result.pendingBookmarkRequest);
            }
        } catch (error) {
            console.log('Error checking pending bookmark request:', error.message);
        }
    }

    async handleAddCurrentPage(bookmarkData) {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                // Update the bookmark modal with current page data
                document.getElementById('bookmarkTitle').value = bookmarkData.title || tab.title;
                document.getElementById('bookmarkUrl').value = bookmarkData.url || tab.url;
                
                // Show the bookmark modal
                this.showBookmarkModal();
                
                // Auto-analyze content if real-time mode is selected
                if (this.settings.processingMode === 'realtime') {
                    this.analyzeCurrentPageContent();
                }
            }
        } catch (error) {
            console.error('Error handling add current page:', error);
        }
    }

    switchTab(tabName) {
        console.log('🔄 Switching to tab:', tabName);
        
        // Update active tab button
        const tabs = document.querySelectorAll('.tab');
        console.log('Found tabs:', tabs.length);
        tabs.forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            console.log(`Tab ${btn.dataset.tab}: setting active = ${isActive}`);
            btn.classList.toggle('active', isActive);
        });

        // Update active tab content
        const panes = document.querySelectorAll('.tab-pane');
        console.log('Found panes:', panes.length);
        panes.forEach(pane => {
            const isActive = pane.id === tabName;
            console.log(`Pane ${pane.id}: setting active = ${isActive}`);
            pane.classList.toggle('active', isActive);
            
            // Force display update
            if (isActive) {
                pane.style.display = 'block';
                pane.style.opacity = '1';
                pane.style.transform = 'translateY(0)';
            } else {
                pane.style.display = 'none';
                pane.style.opacity = '0';
                pane.style.transform = 'translateY(10px)';
            }
        });

        this.currentTab = tabName;
        console.log('Current tab set to:', this.currentTab);

        // Load related bookmarks if on related tab
        if (tabName === 'related') {
            this.loadRelatedBookmarks();
        }
        
        // Load recent bookmarks if on recent tab
        if (tabName === 'recent') {
            this.renderRecentBookmarks();
        }
        
        // Load categories if on categories tab
        if (tabName === 'categories') {
            this.renderCategories();
        }
        
        console.log('✅ Tab switch complete');
    }

    async loadRelatedBookmarks() {
        try {
            console.log('🔍 Loading related bookmarks...');
            
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url || !tab.url.startsWith('http')) {
                console.log('Invalid tab or URL');
                this.renderRelatedBookmarks([]);
                return;
            }
            
            console.log('Current tab:', tab.url);
            
            // Extract content from current page
            const content = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        text: document.body.innerText.substring(0, 8000),
                        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent).join(' '),
                        keywords: document.querySelector('meta[name="keywords"]')?.content || ''
                    };
                }
            });

            if (!content || !content[0] || !content[0].result) {
                console.log('Failed to extract content from page');
                this.renderRelatedBookmarks([]);
                return;
            }

            const pageContent = content[0].result;
            console.log('Page content extracted:', pageContent.title);
            
            // Find related bookmarks using simple keyword matching
            const relatedBookmarks = this.findRelatedBookmarksSimple(pageContent);
            
            console.log('Found related bookmarks:', relatedBookmarks.length);
            this.renderRelatedBookmarks(relatedBookmarks);
            
        } catch (error) {
            console.error('Error loading related bookmarks:', error);
            this.renderRelatedBookmarks([]);
        }
    }

    findRelatedBookmarksSimple(pageContent) {
        const relatedBookmarks = [];
        const pageText = `${pageContent.title} ${pageContent.text} ${pageContent.metaDescription} ${pageContent.headings}`.toLowerCase();
        
        console.log('Analyzing page text:', pageText.substring(0, 200) + '...');
        console.log('Total bookmarks to check:', this.bookmarks.length);
        
        this.bookmarks.forEach(bookmark => {
            // Get category keywords for this bookmark
            const category = this.categories.find(c => c.id === bookmark.categoryId);
            if (!category) return;
            
            // Combine bookmark title, notes, and category keywords
            const bookmarkText = `${bookmark.title} ${bookmark.notes || ''} ${category.keywords.join(' ')}`.toLowerCase();
            
            // Calculate simple keyword overlap
            const relevanceScore = this.calculateSimpleRelevance(pageText, bookmarkText);
            
            console.log(`Bookmark "${bookmark.title}": ${(relevanceScore * 100).toFixed(1)}% relevance`);
            
            // Only include bookmarks with ≥0.5% relevance
            if (relevanceScore >= 0.005) {
                relatedBookmarks.push({
                    ...bookmark,
                    relevanceScore: relevanceScore,
                    categoryName: category.name
                });
            }
        });
        
        // Sort by relevance score (highest first) and return top 10
        return relatedBookmarks
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10);
    }

    calculateSimpleRelevance(pageText, bookmarkText) {
        // Simple word overlap calculation
        const pageWords = pageText.split(/\s+/).filter(word => word.length > 2);
        const bookmarkWords = bookmarkText.split(/\s+/).filter(word => word.length > 2);
        
        if (pageWords.length === 0 || bookmarkWords.length === 0) return 0;
        
        // Count matching words
        let matches = 0;
        const pageWordSet = new Set(pageWords);
        
        bookmarkWords.forEach(word => {
            if (pageWordSet.has(word)) {
                matches++;
            }
        });
        
        // Calculate relevance as percentage of matching words
        const relevance = matches / bookmarkWords.length;
        
        return relevance;
    }

    renderRelatedBookmarks(bookmarks) {
        const container = document.getElementById('relatedContent');
        
        if (bookmarks.length === 0) {
            container.innerHTML = `
                <h3>Related Bookmarks</h3>
                <p>No related bookmarks found for this page.</p>
                <p>Try adding some bookmarks first, or browse to a page with similar content.</p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
                    <h4>Debug Info:</h4>
                    <p><strong>Total Bookmarks:</strong> ${this.bookmarks.length}</p>
                    <p><strong>Total Categories:</strong> ${this.categories.length}</p>
                    <p><strong>Current URL:</strong> ${window.location.href}</p>
                    <button id="showDebugDetailsBtn" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Show Debug Details</button>
                    <div class="debug-details" style="display: none; margin-top: 10px;">
                        <p><strong>Bookmarks:</strong></p>
                        <pre style="background: white; padding: 10px; border-radius: 4px; font-size: 12px; max-height: 200px; overflow-y: auto;">${JSON.stringify(this.bookmarks.slice(0, 5), null, 2)}</pre>
                        <p><strong>Categories:</strong></p>
                        <pre style="background: white; padding: 10px; border-radius: 4px; font-size: 12px; max-height: 200px; overflow-y: auto;">${JSON.stringify(this.categories, null, 2)}</pre>
                    </div>
                </div>
            `;
            
            // Add event listener for debug button
            const debugBtn = container.querySelector('#showDebugDetailsBtn');
            if (debugBtn) {
                debugBtn.addEventListener('click', () => {
                    const debugDetails = container.querySelector('.debug-details');
                    if (debugDetails) {
                        debugDetails.style.display = 'block';
                        debugBtn.style.display = 'none';
                    }
                });
            }
            
            return;
        }

        container.innerHTML = `
            <h3>Related Bookmarks (${bookmarks.length})</h3>
            <div class="related-bookmarks-list">
                ${bookmarks.map(bookmark => `
                    <div class="related-bookmark-item" data-url="${bookmark.url}">
                        <div class="related-bookmark-icon"></div>
                        <div class="related-bookmark-info">
                            <div class="related-bookmark-title">${bookmark.title}</div>
                            <div class="related-bookmark-url-mini">${this.truncateUrl(bookmark.url)}</div>
                            <div class="related-bookmark-details" style="display: none;">
                                <div class="related-bookmark-url-full">${bookmark.url}</div>
                                <div class="related-bookmark-meta">
                                    <span class="related-bookmark-category">${bookmark.categoryName || 'Unknown'}</span>
                                    <span class="related-bookmark-match">${Math.round((bookmark.relevanceScore || 0) * 100)}% match</span>
                                </div>
                            </div>
                        </div>
                        <div class="related-bookmark-actions">
                            <button class="bookmark-action-btn bookmark-action-toggle" title="Toggle Details" data-action="toggle" data-bookmark-id="${bookmark.id}">▼</button>
                            <button class="bookmark-action-btn bookmark-action-notes" title="Generate Notes" data-action="notes" data-bookmark-id="${bookmark.id}">📝</button>
                            <button class="bookmark-action-btn bookmark-action-edit" title="Edit Bookmark" data-action="edit" data-bookmark-id="${bookmark.id}">✏️</button>
                            <button class="bookmark-action-btn bookmark-action-move" title="Move Bookmark" data-action="move" data-bookmark-id="${bookmark.id}">📁</button>
                            <button class="bookmark-action-btn bookmark-action-delete" title="Delete Bookmark" data-action="delete" data-bookmark-id="${bookmark.id}">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners for related bookmark items
        container.querySelectorAll('.related-bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't open URL if clicking on action buttons
                if (e.target.closest('.related-bookmark-actions')) {
                    return;
                }
                
                const url = item.dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
            });
        });
        
        // Add event listeners for action buttons with proper event handling
        container.querySelectorAll('.bookmark-action-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkItem = e.target.closest('.related-bookmark-item');
                const toggleBtn = e.target.closest('.bookmark-action-toggle');
                const details = bookmarkItem.querySelector('.related-bookmark-details');
                
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    toggleBtn.textContent = '▲';
                    toggleBtn.title = 'Hide Details';
                    bookmarkItem.classList.add('expanded');
                } else {
                    details.style.display = 'none';
                    toggleBtn.textContent = '▼';
                    toggleBtn.title = 'Show Details';
                    bookmarkItem.classList.remove('expanded');
                }
            });
        });
        
        container.querySelectorAll('.bookmark-action-notes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkId = btn.dataset.bookmarkId;
                if (bookmarkId) {
                    this.generateNotesForBookmark(bookmarkId);
                }
            });
        });

        container.querySelectorAll('.bookmark-action-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkId = btn.dataset.bookmarkId;
                if (bookmarkId) {
                    this.editBookmark(bookmarkId);
                }
            });
        });
        
        container.querySelectorAll('.bookmark-action-move').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkId = btn.dataset.bookmarkId;
                if (bookmarkId) {
                    this.showMoveBookmarkModal(bookmarkId);
                }
            });
        });

        container.querySelectorAll('.bookmark-action-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const bookmarkId = btn.dataset.bookmarkId;
                if (bookmarkId) {
                    this.deleteBookmark(bookmarkId);
                }
            });
        });
    }

    setupModalListeners() {
        // Category modal
        document.getElementById('saveCategoryBtn').addEventListener('click', () => {
            this.saveCategory();
        });

        document.getElementById('cancelCategoryBtn').addEventListener('click', () => {
            this.hideCategoryModal();
        });

        // Bookmark modal
        document.getElementById('saveBookmarkBtn').addEventListener('click', () => {
            this.saveBookmark();
        });

        document.getElementById('cancelBookmarkBtn').addEventListener('click', () => {
            this.hideBookmarkModal();
        });

        // Category type change
        document.getElementById('categoryType').addEventListener('change', (e) => {
            const parentGroup = document.getElementById('parentCategoryGroup');
            if (e.target.value === 'sub') {
                parentGroup.style.display = 'block';
                this.populateParentCategories();
            } else {
                parentGroup.style.display = 'none';
            }
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    showCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
        document.getElementById('categoryName').focus();
        this.populateParentCategories();
    }

    hideCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryKeywords').value = '';
        document.getElementById('categoryType').value = 'main';
        document.getElementById('parentCategoryGroup').style.display = 'none';
    }

    showBookmarkModal() {
        this.populateCategorySelect();
        document.getElementById('bookmarkModal').classList.add('active');
        
        // Get current tab info if not already set
        if (!document.getElementById('bookmarkTitle').value) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    document.getElementById('bookmarkTitle').value = tabs[0].title;
                    document.getElementById('bookmarkUrl').value = tabs[0].url;
                    
                    // Auto-analyze content if real-time mode is selected
                    if (this.settings.processingMode === 'realtime') {
                        this.analyzeCurrentPageContent();
                    }
                }
            });
        }
    }

    hideBookmarkModal() {
        document.getElementById('bookmarkModal').classList.remove('active');
        document.getElementById('bookmarkTitle').value = '';
        document.getElementById('bookmarkUrl').value = '';
        document.getElementById('bookmarkCategory').value = '';
        document.getElementById('bookmarkNotes').value = '';
        document.getElementById('bookmarkProcessingMode').value = 'realtime';
        document.getElementById('editCategoryName').value = '';
        document.getElementById('editCategoryGroup').style.display = 'none';
    }

    async analyzeCurrentPageContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            // Show processing modal
            this.showProcessingModal('Analyzing page content...');

            // Extract content from current page
            const content = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        text: document.body.innerText.substring(0, 8000),
                        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent).join(' '),
                        keywords: document.querySelector('meta[name="keywords"]')?.content || ''
                    };
                }
            });

            if (content && content[0] && content[0].result) {
                const pageContent = content[0].result;
                
                // Analyze content for bookmark
                chrome.runtime.sendMessage({
                    action: 'analyzeContentForBookmark',
                    content: pageContent
                }, (response) => {
                    this.hideProcessingModal();
                    
                    if (response && response.success) {
                        this.updateBookmarkModalWithAnalysis(response);
                    }
                });
            }
        } catch (error) {
            console.error('Error analyzing content:', error);
            this.hideProcessingModal();
        }
    }

    updateBookmarkModalWithAnalysis(analysis) {
        if (analysis.categorySuggestion) {
            const categorySelect = document.getElementById('bookmarkCategory');
            const editCategoryGroup = document.getElementById('editCategoryGroup');
            
            if (analysis.categorySuggestion.shouldCreateSubCategory && analysis.categorySuggestion.category) {
                // Suggest creating sub-category
                categorySelect.innerHTML = `
                    <option value="">Auto-detect (Recommended)</option>
                    <option value="auto">${analysis.categorySuggestion.suggestedName}</option>
                `;
                editCategoryGroup.style.display = 'block';
                document.getElementById('editCategoryName').value = analysis.categorySuggestion.suggestedName;
            } else if (analysis.categorySuggestion.category) {
                // Suggest existing category
                categorySelect.value = analysis.categorySuggestion.category.id;
                editCategoryGroup.style.display = 'none';
            } else {
                // Suggest new main category
                categorySelect.innerHTML = `
                    <option value="">Auto-detect (Recommended)</option>
                    <option value="auto">${analysis.categorySuggestion.suggestedName}</option>
                `;
                editCategoryGroup.style.display = 'block';
                document.getElementById('editCategoryName').value = analysis.categorySuggestion.suggestedName;
            }
            
            // Re-populate with existing categories and "Others" option
            this.populateCategorySelect();
            
            // Restore the suggested selection if it was auto-detect
            if (analysis.categorySuggestion.shouldCreateSubCategory && analysis.categorySuggestion.category) {
                categorySelect.value = 'auto';
                editCategoryGroup.style.display = 'block';
            } else if (analysis.categorySuggestion.category) {
                categorySelect.value = analysis.categorySuggestion.category.id;
                editCategoryGroup.style.display = 'none';
            } else {
                categorySelect.value = 'auto';
                editCategoryGroup.style.display = 'block';
            }
        }

        if (analysis.description) {
            document.getElementById('bookmarkNotes').value = analysis.description;
        }
    }

    showProcessingModal(message) {
        document.getElementById('processingMessage').textContent = message;
        document.getElementById('processingModal').classList.add('active');
    }

    hideProcessingModal() {
        document.getElementById('processingModal').classList.remove('active');
    }

    async saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const type = document.getElementById('categoryType').value;
        const parentId = type === 'sub' ? document.getElementById('parentCategory').value : null;
        const keywords = document.getElementById('categoryKeywords').value.trim();

        if (!name) return;

        const newCategory = {
            id: Date.now().toString(),
            name: name,
            keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
            parentId: parentId,
            type: type
        };

        this.categories.push(newCategory);
        await this.saveData();
        this.renderCategories();
        this.hideCategoryModal();
    }

    async saveBookmark() {
        const title = document.getElementById('bookmarkTitle').value.trim();
        const url = document.getElementById('bookmarkUrl').value.trim();
        const categoryId = document.getElementById('bookmarkCategory').value;
        const notes = document.getElementById('bookmarkNotes').value.trim();
        const processingMode = document.getElementById('bookmarkProcessingMode').value;
        const customCategoryName = document.getElementById('editCategoryName').value.trim();

        console.log('💾 Save bookmark called with:', { title, url, categoryId, notes, processingMode, customCategoryName });

        if (!title || !url) {
            console.log('❌ Missing title or URL, returning');
            return;
        }

        // Check if we're editing an existing bookmark
        const editBookmarkId = document.getElementById('bookmarkModal').dataset.editBookmarkId;
        const isEditing = !!editBookmarkId;

        console.log('Save bookmark called:', { isEditing, editBookmarkId, title, url, categoryId });

        if (isEditing) {
            console.log('Processing as EDIT mode');
            
            // Update existing bookmark locally (no need for background script)
            const existingBookmark = this.bookmarks.find(b => b.id === editBookmarkId);
            if (!existingBookmark) {
                console.error('Existing bookmark not found for editing');
                return;
            }

            console.log('Found existing bookmark:', existingBookmark);

            // When editing, we don't need to check for duplicates since we're updating an existing bookmark
            // The URL might be the same or changed, but it's the same bookmark

            // Update bookmark data locally
            const success = await this.updateBookmark(editBookmarkId, {
                title: title,
                url: url,
                categoryId: categoryId || null,
                notes: notes
            });

            if (success) {
                console.log('Bookmark update successful');
                
                // Hide modal
                this.hideBookmarkModal();
                
                // Show success message
                this.showSuccessMessage('Bookmark updated successfully!');
                
                // Reset button text
                document.getElementById('saveBookmarkBtn').textContent = 'Save Bookmark';
                
                // Clear edit bookmark ID
                delete document.getElementById('bookmarkModal').dataset.editBookmarkId;
            } else {
                console.error('Bookmark update failed');
                this.showErrorMessage('Failed to update bookmark. Please try again.');
            }
            
            return;
        }

        console.log('Processing as NEW bookmark mode');

        // Check for duplicate URL for new bookmarks
        const existingBookmark = this.bookmarks.find(b => b.url === url);
        if (existingBookmark) {
            this.showErrorMessage(`This URL is already bookmarked as "${existingBookmark.title}" in the ${this.getCategoryName(existingBookmark.categoryId)} category.`);
            return;
        }

        const newBookmark = {
            id: Date.now().toString(),
            title: title,
            url: url,
            categoryId: categoryId || null,
            notes: notes,
            createdAt: new Date().toISOString(),
            processingMode: processingMode,
            isEdit: false // Mark as new bookmark
        };

        // If user wants to create a custom category
        if (categoryId === 'auto' && customCategoryName) {
            newBookmark.customCategoryName = customCategoryName;
        } else if (categoryId === 'others' && customCategoryName) {
            // User selected "Others" and provided a custom name
            newBookmark.customCategoryName = customCategoryName;
            newBookmark.categoryId = null; // Will be set when creating new category
        } else if (categoryId === 'others' && !customCategoryName) {
            // User selected "Others" but didn't provide a name
            this.showErrorMessage('Please enter a category name when selecting "Others"');
            return;
        }

        // Show processing modal
        this.showProcessingModal('Adding bookmark...');

        try {
            // Try to send message to background script
            const result = await new Promise((resolve, reject) => {
                // Set a timeout to prevent hanging
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout - background script not responding'));
                }, 5000);

                chrome.runtime.sendMessage({
                    action: 'addBookmark',
                    bookmark: newBookmark,
                    processingMode: processingMode
                }, (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });

            this.hideProcessingModal();

            if (result && result.success) {
                // Add bookmark to local array if not already there
                const existingBookmark = this.bookmarks.find(b => b.id === result.bookmark.id);
                if (!existingBookmark) {
                    this.bookmarks.push(result.bookmark);
                }
                
                // Update categories if new ones were created
                if (result.categories) {
                    this.categories = result.categories;
                }
                
                // Save to storage
                await this.saveData();
                
                // Update UI
                this.renderCategories();
                this.renderRecentBookmarks();
                this.hideBookmarkModal();
                
                // Show success message
                this.showSuccessMessage('Bookmark added successfully!');
                
                console.log('Bookmark saved:', result.bookmark);
                console.log('Total bookmarks:', this.bookmarks.length);
                console.log('Bookmarks in System Design category:', this.bookmarks.filter(b => b.categoryId === 'system-design').length);
                
                // Force refresh of all data
                await this.loadData();
                this.renderCategories();
                this.renderRecentBookmarks();
            } else {
                // Handle error from background script
                const errorMsg = result?.error || 'Unknown error occurred';
                this.showErrorMessage('Error adding bookmark: ' + errorMsg);
            }
        } catch (error) {
            this.hideProcessingModal();
            console.error('Error adding bookmark:', error);
            
            // Fallback: add bookmark locally without background processing
            try {
                await this.addBookmarkLocally(newBookmark);
                this.showSuccessMessage('Bookmark added locally (background processing failed)');
            } catch (fallbackError) {
                this.showErrorMessage('Failed to add bookmark: ' + error.message);
            }
        }
    }

    async addBookmarkLocally(bookmark) {
        console.log('📝 Adding bookmark locally:', bookmark);
        
        // Add bookmark to local array
        this.bookmarks.push(bookmark);
        console.log('Bookmark added to local array. Total bookmarks:', this.bookmarks.length);
        
        // Save to storage
        await this.saveData();
        console.log('Bookmark saved to storage');
        
        // Update UI
        this.renderCategories();
        this.renderRecentBookmarks();
        this.hideBookmarkModal();
        
        console.log('✅ Bookmark added locally successfully');
    }

    async updateBookmark(bookmarkId, updatedData) {
        try {
            const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
            if (!bookmark) return false;

            // Update bookmark data
            bookmark.title = updatedData.title;
            bookmark.url = updatedData.url;
            bookmark.categoryId = updatedData.categoryId;
            bookmark.notes = updatedData.notes;
            bookmark.updatedAt = new Date().toISOString();

            // Save to storage
            await this.saveData();
            
            // Update UI
            this.renderCategories();
            this.renderRecentBookmarks();
            
            console.log('Bookmark updated successfully:', bookmark);
            return true;
        } catch (error) {
            console.error('Error updating bookmark:', error);
            return false;
        }
    }

    async editBookmark(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        console.log('Editing bookmark:', bookmark);

        // Populate the bookmark modal with existing data
        document.getElementById('bookmarkTitle').value = bookmark.title;
        document.getElementById('bookmarkUrl').value = bookmark.url;
        document.getElementById('bookmarkNotes').value = bookmark.notes || '';
        document.getElementById('bookmarkProcessingMode').value = bookmark.processingMode || 'realtime';
        
        // Set the current category
        if (bookmark.categoryId) {
            document.getElementById('bookmarkCategory').value = bookmark.categoryId;
        }
        
        // Store the bookmark ID for editing
        document.getElementById('bookmarkModal').dataset.editBookmarkId = bookmarkId;
        
        // Change button text
        document.getElementById('saveBookmarkBtn').textContent = 'Update Bookmark';
        
        console.log('Bookmark modal prepared for editing, ID:', bookmarkId);
        
        // Show the modal
        this.showBookmarkModal();
    }

    showMoveBookmarkModal(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        // Create move bookmark modal
        const modal = document.createElement('div');
        modal.id = 'moveBookmarkModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Move Bookmark</h3>
                <p><strong>Moving:</strong> ${bookmark.title}</p>
                <div class="form-group">
                    <label for="moveBookmarkCategory">New Category:</label>
                    <select id="moveBookmarkCategory" required>
                        <option value="">Select Category</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button id="confirmMoveBtn" class="btn-primary">Move Bookmark</button>
                    <button id="cancelMoveBtn" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Populate categories
        this.populateMoveCategorySelect();
        
        // Add event listeners
        document.getElementById('confirmMoveBtn').addEventListener('click', () => {
            this.moveBookmark(bookmarkId);
        });
        
        document.getElementById('cancelMoveBtn').addEventListener('click', () => {
            this.hideMoveBookmarkModal();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideMoveBookmarkModal();
            }
        });
    }

    hideMoveBookmarkModal() {
        const modal = document.getElementById('moveBookmarkModal');
        if (modal) {
            modal.remove();
        }
    }

    populateMoveCategorySelect() {
        const select = document.getElementById('moveBookmarkCategory');
        select.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.type === 'sub' ? `  ${category.name}` : category.name;
            select.appendChild(option);
        });
    }

    async moveBookmark(bookmarkId) {
        const newCategoryId = document.getElementById('moveBookmarkCategory').value;
        if (!newCategoryId) return;

        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        const oldCategoryId = bookmark.categoryId;
        bookmark.categoryId = newCategoryId;
        bookmark.updatedAt = new Date().toISOString();

        // Save to storage
        await this.saveData();
        
        // Update UI
        this.renderCategories();
        this.renderRecentBookmarks();
        
        // Hide modal
        this.hideMoveBookmarkModal();
        
        // Show success message
        const oldCategory = this.categories.find(c => c.id === oldCategoryId);
        const newCategory = this.categories.find(c => c.id === newCategoryId);
        this.showSuccessMessage(`Bookmark moved from "${oldCategory?.name || 'Uncategorized'}" to "${newCategory?.name}"`);
    }

    async deleteBookmark(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        // Show confirmation modal
        const modal = document.createElement('div');
        modal.id = 'deleteBookmarkModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🗑️ Delete Bookmark</h3>
                <p><strong>Are you sure you want to delete this bookmark?</strong></p>
                <div class="bookmark-preview">
                    <p><strong>Title:</strong> ${bookmark.title}</p>
                    <p><strong>URL:</strong> ${bookmark.url}</p>
                    <p><strong>Category:</strong> ${this.categories.find(c => c.id === bookmark.categoryId)?.name || 'Uncategorized'}</p>
                </div>
                <div class="warning-message">
                    <p>⚠️ This action cannot be undone!</p>
                </div>
                <div class="modal-actions">
                    <button id="confirmDeleteBtn" class="btn-danger">🗑️ Delete Permanently</button>
                    <button id="cancelDeleteBtn" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
            await this.confirmDeleteBookmark(bookmarkId);
        });
        
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.hideDeleteBookmarkModal();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideDeleteBookmarkModal();
            }
        });
    }

    hideDeleteBookmarkModal() {
        const modal = document.getElementById('deleteBookmarkModal');
        if (modal) {
            modal.remove();
        }
    }

    async confirmDeleteBookmark(bookmarkId) {
        try {
            // Find and remove the bookmark
            const bookmarkIndex = this.bookmarks.findIndex(b => b.id === bookmarkId);
            if (bookmarkIndex === -1) return;

            const deletedBookmark = this.bookmarks[bookmarkIndex];
            const categoryName = this.categories.find(c => c.id === deletedBookmark.categoryId)?.name || 'Uncategorized';
            
            // Remove the bookmark
            this.bookmarks.splice(bookmarkIndex, 1);
            
            // Save to storage
            await this.saveData();
            
            // Update UI
            this.renderCategories();
            this.renderRecentBookmarks();
            
            // Hide modal
            this.hideDeleteBookmarkModal();
            
            // Show success message
            this.showSuccessMessage(`Bookmark "${deletedBookmark.title}" deleted from "${categoryName}"`);
            
            console.log('✅ Bookmark deleted successfully:', deletedBookmark.title);
        } catch (error) {
            console.error('❌ Error deleting bookmark:', error);
            this.showErrorMessage('Failed to delete bookmark. Please try again.');
        }
    }

    showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <span class="message-icon">✅</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(successDiv);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove();
            }
        }, 4000);
    }

    showErrorMessage(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <span class="message-icon">❌</span>
            <span class="message-text">${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 6 seconds (errors should stay longer)
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 6000);
    }

    populateCategorySelect() {
        const select = document.getElementById('bookmarkCategory');
        select.innerHTML = '<option value="">Auto-detect (Recommended)</option>';
        
        // Add existing categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.type === 'sub' ? `  ${category.name}` : category.name;
            select.appendChild(option);
        });
        
        // Add "Others" option
        const othersOption = document.createElement('option');
        othersOption.value = 'others';
        othersOption.textContent = 'Others';
        select.appendChild(othersOption);
        
        // Add event listener to show/hide edit category field
        select.addEventListener('change', (e) => {
            const editCategoryGroup = document.getElementById('editCategoryGroup');
            if (e.target.value === 'others') {
                editCategoryGroup.style.display = 'block';
                document.getElementById('editCategoryName').focus();
            } else {
                editCategoryGroup.style.display = 'none';
                document.getElementById('editCategoryName').value = '';
            }
        });
    }

    populateParentCategories() {
        const select = document.getElementById('parentCategory');
        select.innerHTML = '<option value="">Select Parent Category</option>';
        
        this.categories.forEach(category => {
            if (category.type === 'main') {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            }
        });
    }

    renderCategories() {
        const container = document.getElementById('categoryList');
        container.innerHTML = '';
        
        console.log('🎯 Rendering categories...');
        console.log('Categories:', this.categories);
        console.log('Bookmarks:', this.bookmarks);
        
        if (this.categories.length === 0) {
            container.innerHTML = '<div class="no-categories">No categories found. Add some categories to get started!</div>';
            return;
        }

        // Group categories by parent
        const mainCategories = this.categories.filter(cat => !cat.parentId);
        const subCategories = this.categories.filter(cat => cat.parentId);
        
        console.log('Main categories:', mainCategories);
        console.log('Sub categories:', subCategories);

        mainCategories.forEach(category => {
            const categoryBookmarks = this.bookmarks.filter(bookmark => bookmark.categoryId === category.id);
            const categorySubCategories = subCategories.filter(sub => sub.parentId === category.id);
            
            console.log(`Category "${category.name}" has ${categoryBookmarks.length} bookmarks and ${categorySubCategories.length} sub-categories`);
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.innerHTML = `
                <div class="category-header">
                    <h3>${category.name}</h3>
                    <span class="category-count">${categoryBookmarks.length}</span>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="bookmark-list" style="display: none;">
                    ${categoryBookmarks.length > 0 ? 
                        categoryBookmarks.map(bookmark => `
                            <div class="bookmark-item" data-bookmark-id="${bookmark.id}" data-url="${bookmark.url}">
                                <div class="bookmark-icon"></div>
                                <div class="bookmark-info">
                                    <div class="bookmark-title">${bookmark.title}</div>
                                    <div class="bookmark-url-mini">${this.truncateUrl(bookmark.url)}</div>
                                    <div class="bookmark-details" style="display: none;">
                                        <div class="bookmark-url-full">${bookmark.url}</div>
                                        ${bookmark.notes ? `<div class="bookmark-notes">${bookmark.notes}</div>` : ''}
                                        <div class="bookmark-meta">
                                            <small>Added: ${new Date(bookmark.createdAt).toLocaleDateString()}</small>
                                        </div>
                                    </div>
                                </div>
                                                        <div class="bookmark-actions">
                            <button class="bookmark-action-btn bookmark-action-toggle" title="Toggle Details" data-action="toggle" data-bookmark-id="${bookmark.id}">▼</button>
                            <button class="bookmark-action-btn bookmark-action-notes" title="Generate Notes" data-action="notes" data-bookmark-id="${bookmark.id}">📝</button>
                            <button class="bookmark-action-btn bookmark-action-edit" title="Edit Bookmark" data-action="edit" data-bookmark-id="${bookmark.id}">✏️</button>
                            <button class="bookmark-action-btn bookmark-action-move" title="Move Bookmark" data-action="move" data-bookmark-id="${bookmark.id}">📁</button>
                            <button class="bookmark-action-btn bookmark-action-delete" title="Delete Bookmark" data-action="delete" data-bookmark-id="${bookmark.id}">🗑️</button>
                        </div>
                            </div>
                        `).join('') : 
                        '<div class="no-bookmarks">No bookmarks in this category yet.</div>'
                    }
                </div>
            `;
            
            container.appendChild(categoryElement);
        });
        
        // Add click handlers for expand/collapse
        this.setupCategoryExpandHandlers();
        
        console.log('✅ Categories rendered successfully');
    }

    setupCategoryExpandHandlers() {
        // Add click handlers for category headers
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const categoryItem = header.closest('.category-item, .sub-category-item');
                const bookmarkList = categoryItem.querySelector('.bookmark-list');
                const expandIcon = header.querySelector('.expand-icon');
                
                if (bookmarkList.style.display === 'none') {
                    bookmarkList.style.display = 'block';
                    expandIcon.textContent = '▲';
                    categoryItem.classList.add('expanded');
                } else {
                    bookmarkList.style.display = 'none';
                    expandIcon.textContent = '▼';
                    categoryItem.classList.remove('expanded');
                }
            });
        });
        
        // Handle bookmark item clicks (only if not clicking on actions)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.bookmark-item') && !e.target.closest('.bookmark-actions')) {
                const bookmarkItem = e.target.closest('.bookmark-item');
                const url = bookmarkItem.dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
            }
        });
    }

    renderRecentBookmarks() {
        const container = document.getElementById('recentBookmarks');
        container.innerHTML = '';

        const recentBookmarks = this.bookmarks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        recentBookmarks.forEach(bookmark => {
            const category = this.categories.find(c => c.id === bookmark.categoryId);
            const bookmarkElement = document.createElement('div');
            bookmarkElement.className = 'bookmark-item';
            bookmarkElement.dataset.url = bookmark.url;
            bookmarkElement.innerHTML = `
                <div class="bookmark-icon"></div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-url">${bookmark.url}</div>
                    <small style="color: #999;">${category ? category.name : 'Uncategorized'}</small>
                </div>
            `;
            container.appendChild(bookmarkElement);
        });
    }

    searchBookmarks(query) {
        if (!query.trim()) {
            this.renderCategories();
            return;
        }

        const filteredBookmarks = this.bookmarks.filter(bookmark => {
            const searchText = `${bookmark.title} ${bookmark.notes}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        const container = document.getElementById('categoryList');
        container.innerHTML = '';

        if (filteredBookmarks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No bookmarks found</div>';
            return;
        }

        filteredBookmarks.forEach(bookmark => {
            const category = this.categories.find(c => c.id === bookmark.categoryId);
            const bookmarkElement = document.createElement('div');
            bookmarkElement.className = 'bookmark-item';
            bookmarkElement.dataset.url = bookmark.url;
            bookmarkElement.innerHTML = `
                <div class="bookmark-icon"></div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-url">${bookmark.url}</div>
                    <small style="color: #999;">${category ? category.name : 'Uncategorized'}</small>
                </div>
            `;
            container.appendChild(bookmarkElement);
        });
    }

    async saveSettingsFromUI() {
        this.settings.processingMode = document.getElementById('processingMode').value;
        this.settings.maxBookmarks = parseInt(document.getElementById('maxBookmarks').value);
        this.settings.relevanceThreshold = parseFloat(document.getElementById('relevanceThreshold').value);
        
        await this.saveSettings();
        
        // Show success message
        const btn = document.getElementById('saveSettingsBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Settings Saved!';
        btn.style.background = '#4caf50';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#667eea';
        }, 2000);
    }

    async saveData() {
        try {
            console.log('💾 Saving data to storage:', {
                categoriesCount: this.categories.length,
                bookmarksCount: this.bookmarks.length
            });
            
            await chrome.storage.local.set({
                categories: this.categories,
                bookmarks: this.bookmarks
            });
            
            console.log('✅ Data saved successfully to storage');
        } catch (error) {
            console.error('❌ Error saving data:', error);
        }
    }

    getCategoryName(categoryId) {
        if (!categoryId) return 'Uncategorized';
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown Category';
    }

    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) {
            return url;
        }
        return url.substring(0, maxLength) + '...';
    }

    showAzureSettingsModal() {
        const modal = document.getElementById('azureSettingsModal');
        const apiKey = document.getElementById('azureApiKey');
        const endpoint = document.getElementById('azureEndpoint');
        const model = document.getElementById('azureModel');
        const deployment = document.getElementById('azureDeployment');
        
        // Pre-fill with existing settings
        apiKey.value = this.settings.azureOpenAI.apiKey;
        endpoint.value = this.settings.azureOpenAI.endpoint;
        model.value = this.settings.azureOpenAI.model;
        deployment.value = this.settings.azureOpenAI.deployment;
        
        modal.style.display = 'block';
    }

    hideAzureSettingsModal() {
        document.getElementById('azureSettingsModal').style.display = 'none';
    }

    showGenerateNotesModal(bookmarkId) {
        console.log('🔍 Opening notes modal for bookmark:', bookmarkId);
        
        const modal = document.getElementById('generateNotesModal');
        const content = document.getElementById('notesGenerationContent');
        
        console.log('📋 Modal element:', modal);
        console.log('📝 Content element:', content);
        
        if (!modal) {
            console.error('❌ Notes modal not found in DOM');
            return;
        }
        
        if (!content) {
            console.error('❌ Notes content element not found in DOM');
            return;
        }
        
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) {
            console.error('❌ Bookmark not found:', bookmarkId);
            return;
        }
        
        console.log('📚 Found bookmark:', bookmark);
        console.log('🔑 Azure settings:', this.settings.azureOpenAI);
        
        // Check if Azure is configured
        if (!this.settings.azureOpenAI.apiKey || !this.settings.azureOpenAI.endpoint) {
            console.log('⚠️ Azure OpenAI not configured, showing configuration prompt');
            content.innerHTML = `
                <div class="azure-not-configured">
                    <h4>Azure OpenAI Not Configured</h4>
                    <p>Please configure Azure OpenAI settings first to generate AI notes.</p>
                    <div class="form-actions">
                        <button id="configureAzureFromNotes" class="btn btn-primary">Configure Azure OpenAI</button>
                        <button id="testNotesGeneration" class="btn btn-secondary">Test Notes Generation (Demo)</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            setTimeout(() => {
                const configureBtn = document.getElementById('configureAzureFromNotes');
                const testBtn = document.getElementById('testNotesGeneration');
                
                if (configureBtn) {
                    configureBtn.addEventListener('click', () => {
                        console.log('🔧 Configure Azure button clicked');
                        this.hideGenerateNotesModal();
                        this.showAzureSettingsModal();
                    });
                } else {
                    console.error('❌ Configure Azure button not found');
                }
                
                if (testBtn) {
                    testBtn.addEventListener('click', () => {
                        console.log('🧪 Test notes generation clicked');
                        this.showTestNotesGeneration(bookmarkId);
                    });
                } else {
                    console.error('❌ Test notes button not found');
                }
            }, 100);
        } else {
            // Show confirmation with Azure details
            content.innerHTML = `
                <div class="notes-generation-confirmation">
                    <h4>Generate AI Notes for: ${bookmark.title}</h4>
                    <p><strong>URL:</strong> ${bookmark.url}</p>
                    <div class="azure-credentials-info">
                        <h5>AI Model:</h5>
                        <p><strong>Model:</strong> ${this.settings.azureOpenAI.model || 'Not specified'}</p>
                    </div>
                    <p>This will:</p>
                    <ul>
                        <li>Scrape the webpage content</li>
                        <li>Generate comprehensive study notes using AI</li>
                        <li>Save notes to your Downloads folder</li>
                    </ul>
                    <div class="form-actions">
                        <button id="confirmGenerateNotes" class="btn btn-primary">Generate Notes</button>
                        <button id="editAzureSettings" class="btn btn-secondary">Edit Azure Settings</button>
                        <button id="cancelGenerateNotes" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            setTimeout(() => {
                document.getElementById('confirmGenerateNotes').addEventListener('click', () => {
                    this.startNotesGeneration(bookmarkId);
                });
                
                document.getElementById('editAzureSettings').addEventListener('click', () => {
                    this.hideGenerateNotesModal();
                    this.showAzureSettingsModal();
                });
                
                document.getElementById('cancelGenerateNotes').addEventListener('click', () => {
                    this.hideGenerateNotesModal();
                });
            }, 100);
        }
        
        console.log('🎯 Setting modal display to block');
        modal.style.display = 'block';
        console.log('✅ Modal display set, current style:', modal.style.display);
        console.log('👁️ Modal visibility:', window.getComputedStyle(modal).visibility);
        console.log('🎨 Modal opacity:', window.getComputedStyle(modal).opacity);
    }

    hideGenerateNotesModal() {
        document.getElementById('generateNotesModal').style.display = 'none';
    }

    showTestNotesGeneration(bookmarkId) {
        const content = document.getElementById('notesGenerationContent');
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        
        if (!bookmark) return;
        
        content.innerHTML = `
            <div class="notes-generation-progress">
                <h4>🧪 Demo Notes Generation</h4>
                <p><strong>URL:</strong> ${bookmark.url}</p>
                <div class="progress-steps">
                    <div class="step active" id="step1">
                        <span class="step-number">1</span>
                        <span class="step-text">Simulating webpage scraping...</span>
                    </div>
                    <div class="step" id="step2">
                        <span class="step-number">2</span>
                        <span class="step-text">Generating demo AI notes...</span>
                    </div>
                    <div class="step" id="step3">
                        <span class="step-number">3</span>
                        <span class="step-text">Creating demo file...</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>
        `;
        
        // Simulate the process
        setTimeout(() => {
            this.updateProgressStep(1, 'completed');
            this.updateProgressBar(33);
            
            setTimeout(() => {
                this.updateProgressStep(2, 'completed');
                this.updateProgressBar(66);
                
                setTimeout(() => {
                    this.updateProgressStep(3, 'completed');
                    this.updateProgressBar(100);
                    
                    // Show demo success
                    setTimeout(() => {
                        content.innerHTML = `
                            <div class="notes-generation-success">
                                <h4>✅ Demo Notes Generated!</h4>
                                <p><strong>This is a demonstration of the notes generation feature.</strong></p>
                                <div class="notes-preview">
                                    <h5>Demo Notes Preview:</h5>
                                    <div class="notes-content">
                                        # ${bookmark.title}

                                        ## Overview
                                        This is a demo of the AI notes generation feature. In the full version, this would contain:
                                        
                                        - Comprehensive analysis of the webpage content
                                        - Key concepts and takeaways
                                        - Study notes and summaries
                                        - Related topics and resources
                                        
                                        ## Technical Details
                                        - URL: ${bookmark.url}
                                        - Generated: ${new Date().toLocaleString()}
                                        - Model: Custom model (when configured)
                                        
                                        ## Next Steps
                                        To use the real notes generation:
                                        1. Configure Azure OpenAI settings
                                        2. Add your API key and endpoint
                                        3. Click "Generate Notes" again
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button id="closeDemoModal" class="btn btn-secondary">Close Demo</button>
                                </div>
                            </div>
                        `;
                        
                        // Add event listener
                        document.getElementById('closeDemoModal').addEventListener('click', () => {
                            this.hideGenerateNotesModal();
                        });
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }

    async saveAzureSettings() {
        const apiKey = document.getElementById('azureApiKey').value.trim();
        const endpoint = document.getElementById('azureEndpoint').value.trim();
        const model = document.getElementById('azureModel').value;
        const deployment = document.getElementById('azureDeployment').value.trim();
        const apiVersion = document.getElementById('azureApiVersion').value.trim();
        
        if (!apiKey || !endpoint || !deployment) {
            alert('Please fill in all required fields: API Key, Endpoint, and Deployment Name');
            return;
        }
        
        // Update settings
        this.settings.azureOpenAI = {
            apiKey,
            endpoint,
            model,
            deployment,
            apiVersion
        };
        
        // Save to storage
        await this.saveSettings();
        
        // Update UI
        this.updateAzureStatus();
        this.hideAzureSettingsModal();
        
        // Show success message
        this.showSuccessMessage('Azure OpenAI settings saved successfully!');
    }

    async testAzureConnection() {
        const testBtn = document.getElementById('testAzureConnection');
        const originalText = testBtn.textContent;
        
        try {
            // Validate required fields first
            if (!this.settings.azureOpenAI.apiKey || !this.settings.azureOpenAI.endpoint || !this.settings.azureOpenAI.deployment) {
                this.showErrorMessage('Please fill in all required fields: API Key, Endpoint, and Deployment Name');
                return;
            }
            
            testBtn.textContent = 'Testing...';
            testBtn.disabled = true;
            
            console.log('🧪 Testing Azure OpenAI connection with config:', this.settings.azureOpenAI);
            
            // Test the connection by sending a simple request
            const response = await this.testAzureOpenAIConnection();
            
            console.log('📡 Test response:', response);
            
            if (response && response.success) {
                this.showSuccessMessage('✅ Azure OpenAI connection successful! Your configuration is working correctly.');
                // Update the Azure status indicator
                this.updateAzureStatus();
            } else {
                const errorMsg = response?.error || 'Unknown error occurred';
                this.showErrorMessage(`❌ Connection failed: ${errorMsg}`);
                console.error('Connection test failed:', errorMsg);
            }
        } catch (error) {
            console.error('Connection test error:', error);
            this.showErrorMessage(`❌ Connection test failed: ${error.message}`);
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    async testAzureOpenAIConnection() {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({
                    action: 'testAzureConnection',
                    config: this.settings.azureOpenAI
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        resolve(response);
                    }
                });
            } catch (error) {
                console.error('Error testing Azure connection:', error);
                resolve({ success: false, error: error.message });
            }
        });
    }

    generateNotesForBookmark(bookmarkId) {
        console.log('Generating notes for bookmark:', bookmarkId);
        this.showGenerateNotesModal(bookmarkId);
    }

    async startNotesGeneration(bookmarkId) {
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) {
            console.error('Bookmark not found:', bookmarkId);
            return;
        }
        
        // Update modal to show progress
        const content = document.getElementById('notesGenerationContent');
        content.innerHTML = `
            <div class="notes-generation-progress">
                <h4>Generating AI Notes...</h4>
                <p><strong>URL:</strong> ${bookmark.url}</p>
                <div class="progress-steps">
                    <div class="step active" id="step1">
                        <span class="step-number">1</span>
                        <span class="step-text">Scraping webpage content...</span>
                    </div>
                    <div class="step" id="step2">
                        <span class="step-number">2</span>
                        <span class="step-text">Generating AI notes...</span>
                    </div>
                    <div class="step" id="step3">
                        <span class="step-number">3</span>
                        <span class="step-text">Saving to Downloads folder...</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>
        `;
        
        try {
            // Step 1: Scrape webpage content
            this.updateProgressStep(1, 'active');
            const scrapedContent = await this.scrapeWebpageContent(bookmark.url);
            this.updateProgressStep(1, 'completed');
            this.updateProgressBar(33);
            
            // Step 2: Generate AI notes
            this.updateProgressStep(2, 'active');
            const aiNotes = await this.generateAINotes(scrapedContent, bookmark.title);
            this.updateProgressStep(2, 'completed');
            this.updateProgressBar(66);
            
            // Step 3: Save notes to Downloads folder
            this.updateProgressStep(3, 'active');
            const savedPath = await this.saveNotesToDownloads(aiNotes, bookmark.title);
            this.updateProgressStep(3, 'completed');
            this.updateProgressBar(100);
            
            // Show success
            setTimeout(() => {
                content.innerHTML = `
                    <div class="notes-generation-success">
                        <h4>✅ Notes Generated Successfully!</h4>
                        <p><strong>File saved to:</strong> ${savedPath}</p>
                        <div class="notes-preview">
                            <h5>Generated Notes Preview:</h5>
                            <div class="notes-content">${aiNotes.substring(0, 500)}${aiNotes.length > 500 ? '...' : ''}</div>
                        </div>
                        <div class="form-actions">
                            <button id="openNotesFile" class="btn btn-primary">Open Notes File</button>
                            <button id="closeNotesModal" class="btn btn-secondary">Close</button>
                        </div>
                    </div>
                `;
                
                // Add event listeners
                document.getElementById('openNotesFile').addEventListener('click', () => {
                    this.openNotesFile(savedPath);
                });
                
                document.getElementById('closeNotesModal').addEventListener('click', () => {
                    this.hideGenerateNotesModal();
                });
            }, 1000);
            
        } catch (error) {
            console.error('Error generating notes:', error);
            
            // Enhanced error display with more details
            let errorDetails = error.message;
            if (error.message.includes('URL.createObjectURL')) {
                errorDetails = 'File download error: Chrome extension compatibility issue. Please try again or check console for details.';
            } else if (error.message.includes('401')) {
                errorDetails = 'Authentication failed: Please check your Azure OpenAI API key and settings.';
            } else if (error.message.includes('404')) {
                errorDetails = 'Deployment not found: Please check your Azure OpenAI deployment name.';
            }
            
            content.innerHTML = `
                <div class="notes-generation-error">
                    <h4>❌ Error Generating Notes</h4>
                    <p><strong>Error:</strong> ${errorDetails}</p>
                    <div class="error-details">
                        <p><strong>Technical Details:</strong> ${error.message}</p>
                        <p><strong>Bookmark:</strong> ${bookmark.title}</p>
                        <p><strong>URL:</strong> ${bookmark.url}</p>
                    </div>
                    <div class="form-actions">
                        <button id="retryGenerateNotes" class="btn btn-primary">Retry</button>
                        <button id="configureAzureBtn" class="btn btn-secondary">Configure Azure</button>
                        <button id="closeNotesModal" class="btn btn-secondary">Close</button>
                    </div>
                `;
            
            // Add event listeners
            document.getElementById('retryGenerateNotes').addEventListener('click', () => {
                this.startNotesGeneration(bookmarkId);
            });
            
            document.getElementById('configureAzureBtn').addEventListener('click', () => {
                this.hideGenerateNotesModal();
                this.showAzureSettingsModal();
            });
            
            document.getElementById('closeNotesModal').addEventListener('click', () => {
                this.hideGenerateNotesModal();
            });
        }
    }

    async scrapeWebpageContent(url) {
        try {
            console.log('Scraping content from:', url);
            
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('Could not get active tab for scraping.');
            }

            // Execute script to scrape content
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    return {
                        title: document.title,
                        url: window.location.href,
                        text: document.body.innerText.substring(0, 8000), // Limit text size
                        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent).join(' '),
                        keywords: document.querySelector('meta[name="keywords"]')?.content || ''
                    };
                }
            });

            if (results && results.length > 0 && results[0].result) {
                console.log('Content scraped successfully');
                return results[0].result;
            } else {
                throw new Error('Failed to scrape webpage content.');
            }
        } catch (error) {
            console.error('Error scraping content:', error);
            throw error;
        }
    }

    async generateAINotes(content, title) {
        try {
            console.log('Generating AI notes for:', title);
            
            // Send message to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'generateNotes',
                    content: content,
                    title: title,
                    model: this.settings.azureOpenAI.model,
                    deployment: this.settings.azureOpenAI.deployment
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response && response.success) {
                        resolve(response.notes);
                    } else {
                        reject(new Error(response?.error || 'Failed to generate AI notes.'));
                    }
                });
            });
            
            console.log('AI notes generated successfully');
            return response;
        } catch (error) {
            console.error('Error generating AI notes:', error);
            throw error;
        }
    }

    async saveNotesToDownloads(notes, title) {
        try {
            console.log('Saving notes to Downloads folder:', title);
            
            // Send message to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'saveNotesToDownloads',
                    notes: notes,
                    title: title
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response && response.success) {
                        resolve(response.path);
                    } else {
                        reject(new Error(response?.error || 'Failed to save notes to downloads.'));
                    }
                });
            });
            
            console.log('Notes saved successfully to:', response);
            return response;
        } catch (error) {
            console.error('Error saving notes to Downloads:', error);
            throw error;
        }
    }

    updateProgressStep(stepNumber, status) {
        const step = document.getElementById(`step${stepNumber}`);
        if (step) {
            step.classList.remove('active', 'completed');
            if (status === 'active') {
                step.classList.add('active');
            } else if (status === 'completed') {
                step.classList.add('completed');
            }
        }
    }

    updateProgressBar(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    openNotesFile(filePath) {
        chrome.runtime.sendMessage({ action: 'openFile', path: filePath });
    }

    toggleBookmarkDetails(bookmarkId) {
        const bookmarkItem = document.querySelector(`[data-bookmark-id="${bookmarkId}"]`);
        if (!bookmarkItem) return;
        
        const details = bookmarkItem.querySelector('.bookmark-details');
        const toggleBtn = bookmarkItem.querySelector('.action-toggle');
        
        if (details.style.display === 'none') {
            details.style.display = 'block';
            toggleBtn.textContent = '▲ Hide Details';
            bookmarkItem.classList.add('expanded');
        } else {
            details.style.display = 'none';
            toggleBtn.textContent = '▼ Show Details';
            bookmarkItem.classList.remove('expanded');
        }
    }

    showDebugInfo() {
        const debugDetails = document.getElementById('debugDetails');
        const debugCategories = document.getElementById('debugCategories');
        const debugBookmarks = document.getElementById('debugBookmarks');
        const debugEventListeners = document.getElementById('debugEventListeners');
        
        if (debugDetails) {
            debugDetails.style.display = 'block';
            
            // Update debug info
            debugCategories.textContent = `${this.categories.length} categories: ${this.categories.map(c => c.name).join(', ')}`;
            debugBookmarks.textContent = `${this.bookmarks.length} bookmarks`;
            
            // Check if event listeners are working
            const actionMenus = document.querySelectorAll('.bookmark-action-menu');
            const dropdowns = document.querySelectorAll('.bookmark-action-dropdown');
            debugEventListeners.textContent = `${actionMenus.length} action menus, ${dropdowns.length} dropdowns found`;
            
            console.log('🔍 Debug Info:', {
                categories: this.categories,
                bookmarks: this.bookmarks,
                actionMenus: actionMenus.length,
                dropdowns: dropdowns.length
            });
        }
        
        // Add test dropdown button functionality
        const testDropdownBtn = document.getElementById('testDropdownBtn');
        if (testDropdownBtn) {
            testDropdownBtn.addEventListener('click', () => {
                this.testDropdownFunctionality();
            });
        }
    }
    
        testDropdownFunctionality() {
        console.log('🧪 Testing dropdown functionality...');
        
        // Find the first action menu
        const firstActionMenu = document.querySelector('.bookmark-action-menu');
        if (firstActionMenu) {
            console.log('✅ Found action menu:', firstActionMenu);
            
            // Simulate a click
            firstActionMenu.click();
            
            // Check if dropdown appeared
            setTimeout(() => {
                const dropdown = firstActionMenu.nextElementSibling;
                if (dropdown && dropdown.classList.contains('show')) {
                    console.log('✅ Dropdown test successful!');
                    this.showSuccessMessage('Dropdown test successful!');
                } else {
                    console.log('❌ Dropdown test failed');
                    this.showErrorMessage('Dropdown test failed - check console for details');
                }
            }, 100);
        } else {
            console.log('❌ No action menus found');
            this.showErrorMessage('No action menus found - check if bookmarks are rendered');
        }
    }

    loadTestConfiguration() {
        // Load the test configuration from config file
        if (window.SMART_BOOKMARKS_CONFIG && window.SMART_BOOKMARKS_CONFIG.azureOpenAI.test) {
            this.settings.azureOpenAI = { ...window.SMART_BOOKMARKS_CONFIG.azureOpenAI.test };
        } else {
            // Fallback to hardcoded values if config not available
            this.settings.azureOpenAI = {
                apiKey: 'YOUR_API_KEY_HERE',
                endpoint: 'https://YOUR_RESOURCE.openai.azure.com/',
                model: 'gpt-4o',
                deployment: 'YOUR_DEPLOYMENT_NAME',
                apiVersion: '2025-01-01-preview'
            };
        }
        
        // Update the UI
        this.updateSettingsUI();
        
        // Save to storage
        this.saveSettings();
        
        // Show success message
        this.showSuccessMessage('✅ Test configuration loaded! Click "Test Connection" to verify.');
        
        console.log('🧪 Test configuration loaded:', this.settings.azureOpenAI);
    }

    loadProductionConfiguration() {
        // Load the production configuration from config file
        if (window.SMART_BOOKMARKS_CONFIG && window.SMART_BOOKMARKS_CONFIG.azureOpenAI.production) {
            this.settings.azureOpenAI = { ...window.SMART_BOOKMARKS_CONFIG.azureOpenAI.production };
            this.updateSettingsUI();
            this.saveSettings();
            this.showSuccessMessage('✅ Production configuration loaded!');
            console.log('🚀 Production configuration loaded:', this.settings.azureOpenAI);
        } else {
            this.showErrorMessage('❌ Production configuration not found in config file');
        }
    }

    loadDevelopmentConfiguration() {
        // Load the development configuration from config file
        if (window.SMART_BOOKMARKS_CONFIG && window.SMART_BOOKMARKS_CONFIG.azureOpenAI.development) {
            this.settings.azureOpenAI = { ...window.SMART_BOOKMARKS_CONFIG.azureOpenAI.development };
            this.updateSettingsUI();
            this.saveSettings();
            this.showSuccessMessage('✅ Development configuration loaded!');
            console.log('🔧 Development configuration loaded:', this.settings.azureOpenAI);
        } else {
            this.showErrorMessage('❌ Development configuration not found in config file');
        }
    }
}

        // Initialize the bookmark organizer when the popup opens
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Popup DOM loaded - initializing BookmarkOrganizer...');
            const organizer = new BookmarkOrganizer();
            
            // Ensure initial tab is properly set
            setTimeout(() => {
                console.log('🔧 Setting initial tab state...');
                organizer.switchTab('categories');
            }, 100);
        }); 