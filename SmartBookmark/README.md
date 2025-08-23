# Smart Bookmark Organizer



A Chrome extension that intelligently organizes your bookmarks by intent and shows related content while browsing.

## Features

### 🎯 Smart Categorization
- **Pre-defined Categories**: AI & Machine Learning, System Design, New Technology, Programming
- **Custom Categories**: Create your own categories with custom keywords
- **Auto-tagging**: Automatically categorize bookmarks based on content analysis

### 🔍 Intelligent Search & Discovery
- **Related Content**: See related bookmarks while reading similar topics
- **Smart Search**: Search through bookmarks by title, notes, and category
- **Relevance Scoring**: Bookmarks are ranked by relevance to current content

### 🚀 Easy Management
- **Quick Add**: Add bookmarks with one click from any webpage
- **Organized View**: Browse bookmarks by category or view recent additions
- **Notes Support**: Add personal notes to each bookmark for better context

### 💡 Smart Browsing
- **Floating Panel**: Access related bookmarks without leaving the current page
- **Keyboard Shortcuts**: Use Ctrl+Shift+B to toggle the related bookmarks panel
- **Contextual Suggestions**: Get bookmark recommendations based on what you're reading

## Installation

### Method 1: Load Unpacked Extension
1. Download or clone this repository
2. **Configure Azure OpenAI** (see Configuration section below)
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked" and select the `Segregate Bookmarks` folder
6. The extension icon should appear in your toolbar

### Method 2: Create Icons (Required)
Before loading the extension, you need to create icon files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

You can use any image editor or online tools to create these icons.

## Configuration

### Azure OpenAI Setup (Required for AI Features)

The extension requires Azure OpenAI credentials to generate AI-powered notes and perform intelligent categorization.

#### Step 1: Copy Configuration Template
```bash
cp config.template.js config.js
```

#### Step 2: Update Configuration
Edit `config.js` and replace the placeholder values:

```javascript
azureOpenAI: {
    production: {
        apiKey: 'YOUR_ACTUAL_API_KEY',
        endpoint: 'https://YOUR_RESOURCE.openai.azure.com/',
        model: 'gpt-4o',
        deployment: 'YOUR_DEPLOYMENT_NAME',
        apiVersion: '2025-01-01-preview'
    }
}
```

#### Step 3: Load Configuration in Extension
1. Open the extension popup
2. Go to Settings tab
3. Click "🚀 Load Prod Config" to load your production settings
4. Click "Test Connection" to verify everything works

#### Environment-Specific Configurations
- **Production**: Live Azure OpenAI resources
- **Test**: Dedicated test environment  
- **Development**: Local development resources

**⚠️ Security Note**: Never commit `config.js` to version control. It's already included in `.gitignore`.

## Usage

### Adding Bookmarks
1. **From Extension Popup**: Click the extension icon and use the "+" button
2. **From Webpage**: Use the floating bookmark button (📚) that appears on every page
3. **Quick Add**: Right-click on any page and select "Add to Smart Bookmarks"

### Managing Categories
1. Open the extension popup
2. Go to the "Categories" tab
3. Click "+ Add Category" to create custom categories
4. Add relevant keywords for better auto-categorization

### Finding Related Content
1. **While Browsing**: Look for the floating 📚 button on the right side of any webpage
2. **Keyboard Shortcut**: Press `Ctrl+Shift+B` to show/hide the related bookmarks panel
3. **Manual Search**: Use the search bar in the extension popup

### Keyboard Shortcuts
- `Ctrl+Shift+B`: Toggle related bookmarks panel
- `Esc`: Close the related bookmarks panel

## How It Works

### Content Analysis
The extension analyzes webpage content including:
- Page title and meta description
- Headings (H1, H2, H3)
- Body text (first 5000 characters)
- Meta keywords

### Relevance Scoring
Bookmarks are ranked by:
1. **Category Match**: How well the page content matches category keywords
2. **Content Similarity**: Text similarity between current page and bookmark content
3. **Keyword Density**: Frequency of relevant terms in the content

### Smart Grouping
- **Intent-based**: Groups content by purpose rather than just tags
- **Context-aware**: Considers the context of what you're reading
- **Dynamic**: Updates recommendations as you browse

## Customization

### Adding Custom Categories
1. Open the extension popup
2. Click "+ Add Category"
3. Enter category name and relevant keywords
4. Keywords should be comma-separated

### Example Categories
```
AI & Machine Learning: artificial intelligence, machine learning, deep learning, neural networks, AI, ML
System Design: system design, architecture, scalability, distributed systems, microservices
New Technology: new technology, emerging tech, innovation, latest tech, cutting edge
Programming: programming, coding, software development, algorithms, data structures
```

### Modifying Default Categories
Edit the `getDefaultCategories()` function in `popup.js` to change the default categories.

## Technical Details

### Architecture
- **Popup**: User interface for managing bookmarks and categories
- **Background Script**: Handles content analysis and bookmark processing
- **Content Script**: Runs on web pages to show related content
- **Storage**: Uses Chrome's local storage for data persistence

### Data Structure
```javascript
// Category
{
  id: "unique-id",
  name: "Category Name",
  keywords: ["keyword1", "keyword2"]
}

// Bookmark
{
  id: "unique-id",
  title: "Page Title",
  url: "https://example.com",
  categoryId: "category-id",
  notes: "Personal notes",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Permissions
- `bookmarks`: Access to Chrome bookmarks
- `storage`: Save extension data locally
- `activeTab`: Access current tab information
- `tabs`: Monitor tab updates for content analysis
- `scripting`: Inject content scripts for page analysis

## Troubleshooting

### Extension Not Loading
- Ensure all icon files are present
- Check that the manifest.json is valid
- Verify all JavaScript files are present

### Related Bookmarks Not Showing
- Make sure you have bookmarks in relevant categories
- Check that category keywords are properly set
- Try refreshing the page

### Performance Issues
- The extension analyzes content on page load
- Large pages may take a moment to process
- Consider reducing the text analysis limit in `background.js`

## Contributing

Feel free to contribute improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

If you encounter issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all files are properly loaded
4. Try reloading the extension

---

**Happy Bookmarking! 📚✨** 