// Content script for Smart Bookmark Organizer
// This script runs on web pages to show related bookmarks
console.log('📜 Content script loaded and executing...');
console.log('🔍 Current page:', window.location.href);
console.log('📅 Timestamp:', new Date().toISOString());

class ContentBookmarkManager {
    constructor() {
        console.log('🏗️ ContentBookmarkManager constructor called');
        this.relatedBookmarks = [];
        this.isVisible = false;
        this.isHidden = false;
        this.currentTabId = null;
        console.log('📋 Properties initialized, calling init()...');
        this.init();
    }

    async init() {
        console.log('🚀 ContentBookmarkManager: Initializing...');
        try {
            await this.waitForPageLoad();
            console.log('✅ Page loaded');
            
            await this.getCurrentTabId();
            console.log('✅ Tab ID obtained:', this.currentTabId);
            
            this.analyzePage();
            console.log('✅ Page analysis started');
            
            this.createRelatedBookmarksPanel();
            console.log('✅ Related bookmarks panel created');
            
            this.createToggleButton();
            console.log('✅ Toggle button created');
            
            this.setupKeyboardShortcuts();
            console.log('✅ Keyboard shortcuts setup');
            
            this.checkHiddenStatus();
            console.log('✅ Hidden status checked');
            
            console.log('🎉 ContentBookmarkManager: Initialization complete!');
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }

    waitForPageLoad() {
        return new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    async getCurrentTabId() {
        try {
            // Check if chrome.tabs API is available
            if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs && tabs.length > 0) {
                    this.currentTabId = tabs[0].id;
                }
            } else {
                console.log('Chrome tabs API not available');
            }
        } catch (error) {
            console.log('Error getting tab ID:', error.message);
        }
    }

    async analyzePage() {
        try {
            const content = this.extractPageContent();
            console.log('🔍 Content script: Analyzing page:', content.title);
            
            // Get bookmarks and categories from storage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get(['bookmarks', 'categories']);
                const bookmarks = result.bookmarks || [];
                const categories = result.categories || [];
                
                console.log('📚 Found bookmarks:', bookmarks.length);
                console.log('📁 Found categories:', categories.length);
                
                // Find related bookmarks locally
                const relatedBookmarks = this.findRelatedBookmarksLocal(content, bookmarks, categories);
                
                this.relatedBookmarks = relatedBookmarks;
                this.updateRelatedBookmarksPanel();
                console.log('✅ Found related bookmarks:', relatedBookmarks.length);
            } else {
                console.log('❌ Chrome storage not available');
                this.relatedBookmarks = [];
                this.updateRelatedBookmarksPanel();
            }
        } catch (error) {
            console.log('❌ Error analyzing page:', error.message);
            this.relatedBookmarks = [];
            this.updateRelatedBookmarksPanel();
        }
    }

    findRelatedBookmarksLocal(pageContent, bookmarks, categories) {
        const relatedBookmarks = [];
        const pageText = `${pageContent.title} ${pageContent.text} ${pageContent.metaDescription} ${pageContent.headings}`.toLowerCase();
        
        console.log('🔍 Analyzing page text:', pageText.substring(0, 200) + '...');
        console.log('📊 Total bookmarks to check:', bookmarks.length);
        
        bookmarks.forEach(bookmark => {
            // Get category keywords for this bookmark
            const category = categories.find(c => c.id === bookmark.categoryId);
            if (!category) return;
            
            // Combine bookmark title, notes, and category keywords
            const bookmarkText = `${bookmark.title} ${bookmark.notes || ''} ${category.keywords.join(' ')}`.toLowerCase();
            
            // Calculate simple keyword overlap
            const relevanceScore = this.calculateSimpleRelevance(pageText, bookmarkText);
            
            console.log(`📚 Bookmark "${bookmark.title}": ${(relevanceScore * 100).toFixed(1)}% relevance`);
            
            // Only include bookmarks with ≥0.5% relevance
            if (relevanceScore >= 0.005) {
                relatedBookmarks.push({
                    ...bookmark,
                    relevanceScore: relevanceScore,
                    category: category.name
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

    extractPageContent() {
        return {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.substring(0, 8000),
            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
            headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent).join(' '),
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            timestamp: new Date().toISOString()
        };
    }

    createRelatedBookmarksPanel() {
        // Create the main panel
        const panel = document.createElement('div');
        panel.id = 'smart-bookmarks-panel';
        panel.className = 'smart-bookmarks-panel';
        panel.innerHTML = `
            <div class="smart-bookmarks-header">
                <span class="smart-bookmarks-title">📚 Related Bookmarks</span>
                <button class="smart-bookmarks-close" title="Close (Esc)">×</button>
            </div>
            <div class="smart-bookmarks-content">
                <div class="smart-bookmarks-list" id="relatedBookmarksList">
                    <!-- Related bookmarks will be populated here -->
                </div>
                <div class="smart-bookmarks-empty" id="emptyBookmarks" style="display: none;">
                    <p>No related bookmarks found</p>
                    <p class="smart-bookmarks-hint">Add bookmarks to see related content here</p>
                </div>
            </div>
            <div class="smart-bookmarks-footer">
                <button class="smart-bookmarks-add" id="addCurrentPageBtn">
                    + Add This Page
                </button>
                <button class="smart-bookmarks-hide" id="hideFloatingIconBtn">
                    🚫 Hide Icon
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(panel);

        // Setup event listeners
        this.setupPanelEventListeners(panel);
    }

    createToggleButton() {
        const toggle = document.createElement('button');
        toggle.className = 'smart-bookmarks-toggle';
        toggle.innerHTML = '📚';
        toggle.title = 'Show Related Bookmarks (Ctrl+Shift+B)';
        
        toggle.addEventListener('click', () => {
            if (this.isVisible) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        });

        document.body.appendChild(toggle);
    }

    setupPanelEventListeners(panel) {
        // Close button
        panel.querySelector('.smart-bookmarks-close').addEventListener('click', () => {
            this.hidePanel();
        });

        // Add current page button
        panel.querySelector('#addCurrentPageBtn').addEventListener('click', () => {
            this.addCurrentPage();
        });

        // Hide floating icon button
        panel.querySelector('#hideFloatingIconBtn').addEventListener('click', () => {
            this.hideFloatingIcon();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !e.target.classList.contains('smart-bookmarks-toggle')) {
                this.hidePanel();
            }
        });
    }

    updateRelatedBookmarksPanel() {
        const list = document.getElementById('relatedBookmarksList');
        const empty = document.getElementById('emptyBookmarks');

        if (!list || !empty) {
            console.log('❌ Related bookmarks list elements not found');
            return;
        }

        console.log('🔄 Updating related bookmarks panel with', this.relatedBookmarks.length, 'bookmarks');

        if (this.relatedBookmarks.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'block';
            console.log('📭 No related bookmarks to display');
            return;
        }

        list.style.display = 'block';
        empty.style.display = 'none';

        list.innerHTML = this.relatedBookmarks.map(bookmark => `
            <div class="smart-bookmark-item" onclick="window.open('${bookmark.url}', '_blank')">
                <div class="smart-bookmark-icon">📚</div>
                <div class="smart-bookmark-info">
                    <div class="smart-bookmark-title">${bookmark.title}</div>
                    <div class="smart-bookmark-url">${this.truncateUrl(bookmark.url)}</div>
                    <span class="smart-bookmark-category">${bookmark.category || 'Unknown'}</span>
                    <div class="smart-bookmark-relevance">${Math.round((bookmark.relevanceScore || 0) * 100)}% match</div>
                </div>
            </div>
        `).join('');

        console.log('✅ Related bookmarks panel updated successfully');
    }

    truncateUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname.substring(0, 30) + (urlObj.pathname.length > 30 ? '...' : '');
        } catch (e) {
            return url.substring(0, 50) + (url.length > 50 ? '...' : '');
        }
    }

    showPanel() {
        if (this.isHidden) return;
        
        const panel = document.getElementById('smart-bookmarks-panel');
        const toggle = document.querySelector('.smart-bookmarks-toggle');
        
        if (panel) {
            panel.classList.add('visible');
        }
        if (toggle) {
            toggle.classList.remove('hidden'); // Remove hidden class to show
        }
        
        this.isVisible = true;
    }

    hidePanel() {
        const panel = document.getElementById('smart-bookmarks-panel');
        const toggle = document.querySelector('.smart-bookmarks-toggle');
        
        if (panel) {
            panel.classList.remove('visible');
        }
        if (toggle) {
            toggle.classList.add('hidden'); // Add hidden class to hide
        }
        
        this.isVisible = false;
    }

    async hideFloatingIcon() {
        try {
            if (this.currentTabId && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                await chrome.runtime.sendMessage({
                    action: 'hideFloatingIcon',
                    tabId: this.currentTabId
                });
            }
            
            // Hide both the panel and the toggle button
            this.hidePanel();
            this.isHidden = true;
            
            // Also hide the toggle button directly
            const toggle = document.querySelector('.smart-bookmarks-toggle');
            if (toggle) {
                toggle.style.display = 'none';
            }
            
            // Store hidden status if chrome.storage is available
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                try {
                    await chrome.storage.local.set({
                        [`hidden_${this.currentTabId}`]: true
                    });
                } catch (error) {
                    console.log('Error saving hidden status:', error.message);
                }
            }
            
            // Show a message
            this.showHideMessage();
        } catch (error) {
            console.log('Error hiding floating icon:', error.message);
            // Still hide locally even if message fails
            this.hidePanel();
            this.isHidden = true;
            
            // Hide toggle button directly
            const toggle = document.querySelector('.smart-bookmarks-toggle');
            if (toggle) {
                toggle.style.display = 'none';
            }
        }
    }

    async checkHiddenStatus() {
        try {
            if (this.currentTabId && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get([`hidden_${this.currentTabId}`]);
                if (result[`hidden_${this.currentTabId}`]) {
                    this.isHidden = true;
                    this.hidePanel();
                    
                    // Also hide the toggle button
                    const toggle = document.querySelector('.smart-bookmarks-toggle');
                    if (toggle) {
                        toggle.style.display = 'none';
                    }
                }
            }
        } catch (error) {
            console.log('Error checking hidden status:', error.message);
        }
    }

    showHideMessage() {
        const message = document.createElement('div');
        message.className = 'smart-bookmarks-message';
        message.innerHTML = `
            <div class="message-content">
                <p>Floating icon hidden for this page</p>
                <p><small>Press <strong>Ctrl+Shift+H</strong> to show it again</small></p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Auto-remove after 5 seconds (increased for better readability)
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 5000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+B to toggle panel (only if icon is visible)
            if (e.ctrlKey && e.shiftKey && e.key === 'B') {
                if (!this.isHidden) {
                    if (this.isVisible) {
                        this.hidePanel();
                    } else {
                        this.showPanel();
                    }
                }
            }
            
            // Ctrl+Shift+H to show hidden floating icon
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                if (this.isHidden) {
                    this.showFloatingIcon();
                }
            }
            
            // Esc to close panel
            if (e.key === 'Escape' && this.isVisible) {
                this.hidePanel();
            }
        });
    }

    addCurrentPage() {
        try {
            // Get current page info
            const pageInfo = {
                title: document.title,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };

            // Check if URL is already bookmarked
            this.checkDuplicateURL(pageInfo);
        } catch (error) {
            console.log('Error adding current page:', error.message);
            this.showAddBookmarkMessage('Error opening extension. Please open manually.');
        }
    }

    async checkDuplicateURL(pageInfo) {
        try {
            // Check if chrome.runtime API is available
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                // Ask background script to check for duplicates
                chrome.runtime.sendMessage({
                    action: 'checkDuplicateURL',
                    url: pageInfo.url
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Runtime error:', chrome.runtime.lastError.message);
                        this.proceedWithAddBookmark(pageInfo);
                        return;
                    }
                    
                    if (response && response.isDuplicate) {
                        // Show fun duplicate message
                        this.showDuplicateMessage(response.existingBookmark);
                    } else {
                        // Proceed with opening popup
                        this.proceedWithAddBookmark(pageInfo);
                    }
                });
            } else {
                this.proceedWithAddBookmark(pageInfo);
            }
        } catch (error) {
            console.log('Error checking duplicate:', error.message);
            this.proceedWithAddBookmark(pageInfo);
        }
    }

    proceedWithAddBookmark(pageInfo) {
        // Send message to background script to open popup
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                action: 'openExtensionPopup',
                bookmark: pageInfo
            });
            
            // Show a brief message that popup is opening
            this.showAddBookmarkMessage('Opening Smart Bookmarks...');
        } else {
            this.showAddBookmarkMessage('Extension not available. Please open manually.');
        }
    }

    showDuplicateMessage(existingBookmark) {
        const funMessages = [
            `🎯 Oops! You've already bookmarked this!`,
            `🔄 Been there, bookmarked that!`,
            `📚 This page is already in your collection!`,
            `💾 Duplicate detected! Already saved!`,
            `🎪 This URL is already in the show!`,
            `🚫 No duplicates allowed! Already exists!`,
            `🎭 This page is already starring in your bookmarks!`,
            `🎨 This masterpiece is already in your gallery!`
        ];
        
        const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];
        const categoryName = existingBookmark.category || 'Uncategorized';
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'smart-bookmarks-duplicate';
        messageDiv.className = 'smart-bookmarks-duplicate';
        messageDiv.innerHTML = `
            <div class="duplicate-content">
                <div class="duplicate-icon">🎯</div>
                <div class="duplicate-text">
                    <div class="duplicate-title">${randomMessage}</div>
                    <div class="duplicate-details">
                        <strong>Already saved as:</strong> "${existingBookmark.title}"
                        <br><strong>Category:</strong> ${categoryName}
                    </div>
                    <div class="duplicate-actions">
                        <button class="duplicate-edit" id="editExistingBookmark">✏️ Edit Existing</button>
                        <button class="duplicate-close" id="closeDuplicateMessage">✕</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(messageDiv);

        // Add event listeners
        const editBtn = messageDiv.querySelector('#editExistingBookmark');
        const closeBtn = messageDiv.querySelector('#closeDuplicateMessage');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Open extension popup to edit existing bookmark
                this.openExtensionForEdit(existingBookmark);
                messageDiv.remove();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                messageDiv.remove();
            });
        }

        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 8000);
    }

    openExtensionForEdit(existingBookmark) {
        // Send message to open extension popup for editing
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                action: 'openExtensionForEdit',
                bookmark: existingBookmark
            });
            
            this.showAddBookmarkMessage('Opening Smart Bookmarks for editing...');
        }
    }

    sendBookmarkRequest(pageInfo) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                action: 'openAddBookmarkPopup',
                bookmark: pageInfo
            });
            
            // Show a brief message that the request was sent
            this.showAddBookmarkMessage();
        }
    }

    showAddBookmarkMessage(message = 'Opening Smart Bookmarks...') {
        // Remove any existing message
        const existingMessage = document.getElementById('smart-bookmarks-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.id = 'smart-bookmarks-message';
        messageDiv.className = 'smart-bookmarks-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <span>${message}</span>
                    <small style="display: block; margin-top: 4px; opacity: 0.9;">Press Ctrl+Shift+B or click the extension icon</small>
                </div>
                <button class="message-close">×</button>
            </div>
        `;

        document.body.appendChild(messageDiv);

        // Auto-hide after 5 seconds (longer to read instructions)
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);

        // Close button functionality
        const closeBtn = messageDiv.querySelector('.message-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                messageDiv.remove();
            });
        }
    }

    // Method to refresh related bookmarks
    async refreshRelatedBookmarks() {
        await this.analyzePage();
    }

    showFloatingIcon() {
        this.isHidden = false;
        
        // Show the toggle button
        const toggle = document.querySelector('.smart-bookmarks-toggle');
        if (toggle) {
            toggle.style.display = 'block';
        }
        
        // Clear hidden status from storage
        if (this.currentTabId && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove([`hidden_${this.currentTabId}`]);
        }
        
        // Show success message
        this.showShowMessage();
    }

    showShowMessage() {
        const message = document.createElement('div');
        message.className = 'smart-bookmarks-message';
        message.innerHTML = `
            <div class="message-content">
                <p>Floating icon restored</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 3000);
    }
}

// Initialize the content bookmark manager
const bookmarkManager = new ContentBookmarkManager();

// Listen for messages from popup or background
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'showRelatedBookmarks':
                bookmarkManager.showPanel();
                break;
            case 'hideFloatingIcon':
                bookmarkManager.hideFloatingIcon();
                break;
            case 'refreshRelatedBookmarks':
                bookmarkManager.refreshRelatedBookmarks();
                break;
        }
    });
}

// Listen for storage changes to update related bookmarks
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            // Check if bookmarks or categories changed
            if (changes.bookmarks || changes.categories) {
                // Refresh related bookmarks after a short delay
                setTimeout(() => {
                    bookmarkManager.refreshRelatedBookmarks();
                }, 1000);
            }
        }
    });
} 