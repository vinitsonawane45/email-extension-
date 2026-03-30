# Email Extension 📧

A powerful Firefox add-on that transforms how you manage and interact with your Gmail. This extension allows you to fetch emails from your Gmail account, get AI-powered summaries with text-to-speech, auto-generate professional replies, and send emails directly from the extension interface.

---

## 🌟 Features

### 📬 Email Management
- **Fetch Gmail Integration** - Securely connect and fetch emails from your Gmail account
- **Email Search & Filter** - Quickly search through your emails using various filters
- **Data Export** - Export your emails in CSV or JSON format for backup or analysis

### 🔊 Smart Email Summaries
- **Text-to-Speech (TTS)** - Listen to 2-4 important emails being read aloud
- **AI-Powered Summaries** - Automatically generate concise summaries of email content
- **Intelligent Selection** - Automatically identifies and prioritizes important emails

### ✍️ Smart Reply Generation
- **Auto-Generate Replies** - Let AI generate professional responses to your emails
- **Customizable Responses** - Edit and customize generated replies before sending
- **Context-Aware** - Generates replies based on email content and tone

### 📤 Direct Email Sending
- **Send from Extension** - Compose and send emails directly from the extension interface
- **Quick Reply** - Send replies without switching to Gmail
- **Template Support** - Use generated templates for faster email composition

### ⚙️ Advanced Settings
- **Customizable Preferences** - Configure extension behavior and features
- **Voice Settings** - Adjust text-to-speech voice, speed, and language
- **Privacy Controls** - Manage data storage and security preferences
- **Email Filters** - Set custom rules for email organization and priority

### 📋 Additional Features
- **Copy to Clipboard** - Quickly copy email content, summaries, or responses
- **Email Preview** - View email content with rich formatting support
- **Multi-language Support** - Support for multiple languages in TTS and summaries

---

## 🚀 Installation

### Prerequisites
- Firefox browser (version 60 or higher)
- Google account with Gmail enabled
- Internet connection

### Steps to Install

1. **Download the Extension**
   ```bash
   git clone https://github.com/vinitsonawane45/email-extension-.git
   cd email-extension-
   ```

2. **Load in Firefox**
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
   - Click on "Load Temporary Add-on"
   - Select the `manifest.json` file from the project directory
   - The extension will be loaded and ready to use

3. **Grant Permissions**
   - Click the extension icon in the Firefox toolbar
   - Authorize access to your Gmail account
   - Follow the OAuth authentication flow

4. **Configure Settings**
   - Open the extension settings
   - Customize voice preferences, export formats, and other options

---

## 📖 How to Use

### Getting Started

1. **Connect Gmail Account**
   - Click the extension icon
   - Select "Connect Gmail"
   - Authenticate with your Google account
   - Grant necessary permissions

2. **View Your Emails**
   - Your emails will automatically load
   - Browse through the email list
   - Click on any email to read full content

### Listening to Email Summaries

1. Navigate to the email you want to hear
2. Click the "📢 Speak Summary" button
3. The extension will read out a 2-4 email summary in audio format
4. Adjust voice speed/language in settings if needed
5. Use pause/resume controls as needed

### Generating Replies

1. Open the email you want to reply to
2. Click "✍️ Generate Reply" button
3. AI will create a professional response
4. Review the suggested reply
5. Edit as needed using the text editor
6. Click "Send Reply" to send directly

### Sending New Emails

1. Click "📝 New Email" button
2. Enter recipient email address
3. Add subject and message content
4. Optionally generate content using AI
5. Click "📤 Send" to send directly from the extension

### Exporting Emails

1. Go to extension settings
2. Click "📥 Export Emails"
3. Select export format:
   - **CSV** - For spreadsheet applications
   - **JSON** - For data processing and integration
4. Choose date range or select specific emails
5. Download file to your computer

### Searching Emails

1. Use the search bar in the extension popup
2. Enter keywords to search
3. Filter by:
   - Date range
   - Sender
   - Subject
   - Email status (read/unread)
4. Results update in real-time

---

## ⚙️ Settings & Configuration

### Voice Settings
- **Voice Language** - Select TTS language (English, Spanish, French, etc.)
- **Playback Speed** - Adjust speech speed (0.5x to 2x)
- **Voice Type** - Choose male/female voice variant

### Email Settings
- **Auto-sync Interval** - Set how often to fetch new emails
- **Summary Length** - Configure summary word count
- **Default Reply Tone** - Choose tone for AI-generated replies (professional, casual, formal)

### Privacy & Security
- **Data Storage** - Local storage only (no server backups)
- **Clear Cache** - Remove cached emails and data
- **Session Timeout** - Auto-logout after inactivity
- **Revoke Access** - Disconnect Gmail account

### Export Settings
- **Default Format** - Choose CSV or JSON as default
- **Include Attachments** - Option to include attachment metadata
- **Encryption** - Enable encryption for exported files

---

## 🔐 Privacy & Security

- **No Data Collection** - We don't collect or store your emails on external servers
- **Local Processing** - All summaries and replies are generated locally
- **Gmail API** - Secure OAuth 2.0 authentication with Gmail
- **End-to-End** - Direct communication between extension and Gmail API
- **No Third Parties** - Your data is never shared with third-party services

---

## 🛠️ Technical Stack

- **Frontend Framework** - HTML5, CSS3, JavaScript (ES6+)
- **Browser API** - Firefox WebExtension API
- **Authentication** - Google OAuth 2.0
- **Email Service** - Gmail API v1
- **Text-to-Speech** - Web Speech API
- **Data Format** - JSON, CSV

### Project Structure
```
email-extension-/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script
├── styles/
│   ├── popup.css         # Popup styling
│   └── settings.css      # Settings page styling
├── js/
│   ├── gmail-api.js      # Gmail API integration
│   ├── tts.js            # Text-to-speech functionality
│   ├── ai-reply.js       # AI reply generation
│   └── utils.js          # Utility functions
├── pages/
│   ├── settings.html     # Settings page
│   └── settings.js       # Settings functionality
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md             # This file
```

---

## 🔄 API Integration

### Gmail API
- Requires Gmail API to be enabled in Google Cloud Console
- Uses OAuth 2.0 for secure authentication
- Scopes: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.send`

### Setup Instructions
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Gmail API
3. Create OAuth 2.0 credentials (Desktop application)
4. Add the client ID to the extension's `manifest.json`
5. Authorize the extension with your Google account

---

## 🐛 Troubleshooting

### Email Not Loading
- Check internet connection
- Verify Gmail account is connected
- Clear browser cache and reload extension
- Check Gmail API quota limits

### Text-to-Speech Not Working
- Verify speaker volume is not muted
- Check browser text-to-speech is enabled
- Select a supported language
- Restart Firefox if needed

### Gmail Authentication Fails
- Clear extension storage and try reconnecting
- Verify Google account has Gmail enabled
- Check if Gmail API quota is exceeded
- Review and update OAuth permissions

### Reply Generation Issues
- Ensure internet connection is stable
- Check that email content is readable
- Try refreshing the email
- Check extension console for error logs

---

## 📋 Requirements & Compatibility

### Browser Requirements
- Firefox 60+
- JavaScript enabled
- Cookies and local storage enabled

### Account Requirements
- Active Google account
- Gmail enabled
- Internet connection

### System Requirements
- Modern operating system (Windows, macOS, Linux)
- Sufficient disk space for cache
- Speaker/headphones for text-to-speech

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/vinitsonawane45/email-extension-.git

# Install dependencies (if any)
npm install

# Load in Firefox for development
# Follow installation steps above
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📧 Support & Contact

For issues, questions, or feature requests:

- **GitHub Issues** - Report bugs or request features
- **Email** - vinitsonawane45@gmail.com
- **GitHub Profile** - [@vinitsonawane45](https://github.com/vinitsonawane45)

---

## 🎯 Roadmap

Future features and improvements:

- [ ] Support for other email providers (Outlook, Yahoo, etc.)
- [ ] Dark mode support
- [ ] Multi-language support for AI replies
- [ ] Advanced email filtering and rules
- [ ] Email scheduling
- [ ] Attachment download/upload
- [ ] Email encryption support
- [ ] Integration with calendar
- [ ] Performance improvements
- [ ] Mobile app version

---

## 📊 Version History

### v1.0.0 (Initial Release)
- Email fetching from Gmail
- Text-to-speech summaries for 2-4 emails
- AI-powered reply generation
- Direct email sending from extension
- Data export (CSV/JSON)
- Search and filtering functionality
- Settings and configuration panel
- Copy to clipboard feature

---

## ⚡ Performance Tips

1. **Optimize Email Loading** - Limit number of emails loaded at once
2. **Clear Cache Regularly** - Remove cached data in settings
3. **Disable Auto-sync** - Reduce auto-sync frequency if not needed
4. **Use Search** - Use filters to find specific emails faster
5. **Update Firefox** - Keep Firefox updated for best performance

---

## 🔍 FAQ

**Q: Is my Gmail password stored?**
A: No. We use secure OAuth 2.0 authentication. Your password is never stored locally.

**Q: Can I use this on mobile?**
A: Firefox for Android supports add-ons, but some features may be limited.

**Q: What information is collected?**
A: Only email metadata for functionality. No content is sent to external servers.

**Q: How do I disconnect my Gmail account?**
A: Go to Settings → Privacy & Security → Revoke Access.

**Q: Can I export all my emails at once?**
A: Yes, use the Export Emails feature and select "All" in the date range.

**Q: What happens when I uninstall the extension?**
A: All local data is automatically removed from your browser.

---

## 📚 Resources

- [Firefox WebExtension Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)

---

## 💡 Tips & Tricks

1. **Keyboard Shortcuts** - Use arrow keys to navigate emails quickly
2. **Voice Customization** - Experiment with different voice speeds
3. **Reply Templates** - Save frequently used reply templates
4. **Batch Export** - Export emails by date range for better organization
5. **Search Operators** - Use specific keywords for precise email searches

---

**Made with ❤️ by [Vinit Sonawane](https://github.com/vinitsonawane45)**

**Star ⭐ this repository if you find it helpful!**
