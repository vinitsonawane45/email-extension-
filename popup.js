document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const fetchEmailsButton = document.getElementById('fetch-emails-button');
    const generateEmailButton = document.getElementById('generate-email-button');
    const editEmailButton = document.getElementById('edit-email-button');
    const sendGeneratedEmailButton = document.getElementById('send-generated-email-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const userStatus = document.getElementById('user-status');
    const profileIcon = document.getElementById('profile-icon');
    const profileDropdownContent = document.getElementById('profile-dropdown-content');
    const settingsButton = document.getElementById('settings-button');
    const userNameSpan = document.getElementById('user-name');
    const userEmailSpan = document.getElementById('user-email');
    const profileInfo = document.getElementById('profile-info');
    const promptInput = document.getElementById('prompt');
    const generatedEmailOutput = document.getElementById('generated-email');
    const emailList = document.getElementById('email-list');
    const emailDetails = document.getElementById('email-details');
    const emailContent = document.getElementById('email-content');
    const loadingSpinner = document.getElementById('loading');
    const messageDiv = document.getElementById('message');
    const emailComposerModal = document.getElementById('email-composer-modal');
    const closeModal = document.getElementById('close-modal');
    const recipientInput = document.getElementById('recipient-input');
    const subjectInput = document.getElementById('subject-input');
    const messageInput = document.getElementById('message-input');
    const sendEmailButton = document.getElementById('send-email-button');
    const saveDraftButton = document.getElementById('save-draft-button');
    const boldButton = document.getElementById('bold-button');
    const italicButton = document.getElementById('italic-button');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const voiceSelect = document.getElementById('voice-select');
    const speechSpeed = document.getElementById('speech-speed');
    const speedValue = document.getElementById('speed-value');
    const includeSubjects = document.getElementById('include-subjects');
    const enableNotifications = document.getElementById('enable-notifications');
    const saveSettingsButton = document.getElementById('save-settings-button');

    // State
    let selectedEmail = null;
    let isEditing = false;
    let voices = [];
    let currentFilter = 'all';
    let emails = [];
    let settings = {
        speechVoice: 0,
        speechSpeed: 1,
        includeSubjects: true,
        enableNotifications: true
    };

    // Initialize
    initDarkMode();
    initProfileDropdown();
    checkLoginStatus();
    initSpeech();
    initFilters();
    initSuggestionChips();
    loadSettings();

    // Dark Mode
    function initDarkMode() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.querySelector('.dark-icon').style.display = 'none';
            darkModeToggle.querySelector('.light-icon').style.display = 'inline';
        }
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        darkModeToggle.querySelector('.dark-icon').style.display = isDarkMode ? 'none' : 'inline';
        darkModeToggle.querySelector('.light-icon').style.display = isDarkMode ? 'inline' : 'none';
    });

    // Profile Dropdown
    function initProfileDropdown() {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdownContent.style.display = profileDropdownContent.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (!profileDropdownContent.contains(e.target) && !profileIcon.contains(e.target)) {
                profileDropdownContent.style.display = 'none';
            }
        });
        settingsButton.addEventListener('click', () => {
            profileDropdownContent.style.display = 'none';
            settingsModal.classList.add('active');
            populateSettings();
        });
    }

    // Login Status
    function checkLoginStatus() {
        chrome.storage.local.get(['accessToken', 'userEmail', 'userName'], (data) => {
            updateUserStatus(data.userEmail ? { email: data.userEmail, name: data.userName } : null);
        });
    }

    function updateUserStatus(userData) {
        if (userData?.email) {
            userStatus.innerHTML = `Logged in as: <span class="email-text">${userData.email}</span>`;
            const initials = userData.email.split('@')[0].substring(0, 2).toUpperCase();
            profileIcon.textContent = initials;
            profileIcon.classList.add('initials');
            profileInfo.style.display = 'block';
            userNameSpan.textContent = userData.name || 'User';
            userEmailSpan.textContent = userData.email;
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
        } else {
            userStatus.textContent = 'Not logged in.';
            profileIcon.innerHTML = '<i class="fas fa-user"></i>';
            profileIcon.classList.remove('initials');
            profileInfo.style.display = 'none';
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
        }
    }

    // Speech Initialization
    function initSpeech() {
        function populateVoices() {
            voices = window.speechSynthesis.getVoices();
            voiceSelect.innerHTML = '';
            voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            voiceSelect.value = settings.speechVoice;
        }
        populateVoices();
        window.speechSynthesis.onvoiceschanged = populateVoices;

        speechSpeed.addEventListener('input', () => {
            speedValue.textContent = speechSpeed.value;
        });
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voices[settings.speechVoice] || voices[0];
        utterance.rate = settings.speechSpeed;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // Email Filters
    function initFilters() {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentFilter = button.dataset.filter;
                displayEmails(filterEmails(emails, currentFilter));
            });
        });
    }

    function filterEmails(emails, filter) {
        switch (filter) {
            case 'unread':
                return emails.filter(email => email.unread);
            case 'sent':
                return emails.filter(email => email.sent);
            case 'all':
            default:
                return emails;
        }
    }

    // AI Suggestion Chips
    function initSuggestionChips() {
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                promptInput.value = chip.dataset.prompt;
                generateEmailButton.click();
            });
        });
    }

    // Settings Management
    function loadSettings() {
        chrome.storage.local.get('settings', (data) => {
            if (data.settings) {
                settings = { ...settings, ...data.settings };
            }
            updateSettingsUI();
        });
    }

    function updateSettingsUI() {
        voiceSelect.value = settings.speechVoice;
        speechSpeed.value = settings.speechSpeed;
        speedValue.textContent = settings.speechSpeed;
        includeSubjects.checked = settings.includeSubjects;
        enableNotifications.checked = settings.enableNotifications;
    }

    function populateSettings() {
        updateSettingsUI();
    }

    function saveSettings() {
        settings = {
            speechVoice: parseInt(voiceSelect.value),
            speechSpeed: parseFloat(speechSpeed.value),
            includeSubjects: includeSubjects.checked,
            enableNotifications: enableNotifications.checked
        };
        chrome.storage.local.set({ settings }, () => {
            showMessage('success', 'Settings saved!');
            settingsModal.classList.remove('active');
        });
    }

    // UI Helpers
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }

    function showMessage(type, text) {
        if (!settings.enableNotifications && type !== 'error') return;
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    // Event Handlers
    loginButton.addEventListener('click', () => {
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'login' }, (response) => {
            showLoading(false);
            if (response?.status === 'success') {
                chrome.storage.local.set({ userEmail: response.email, userName: response.name }, () => {
                    updateUserStatus({ email: response.email, name: response.name });
                    showMessage('success', 'Logged in successfully!');
                });
            } else {
                showMessage('error', response?.message || 'Login failed.');
            }
        });
    });

    logoutButton.addEventListener('click', () => {
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
            showLoading(false);
            if (response?.status === 'success') {
                chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], () => {
                    updateUserStatus(null);
                    emailList.innerHTML = '';
                    generatedEmailOutput.value = '';
                    showMessage('success', 'Logged out successfully!');
                });
            } else {
                showMessage('error', response?.message || 'Logout failed.');
            }
        });
    });

    fetchEmailsButton.addEventListener('click', fetchEmails);

    function fetchEmails() {
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'fetchEmails', filter: currentFilter }, (response) => {
            showLoading(false);
            if (response?.emails) {
                emails = response.emails; // Store fetched emails
                displayEmails(filterEmails(emails, currentFilter));
                speakEmails(filterEmails(emails, currentFilter));
                showMessage('success', 'Emails fetched successfully!');
            } else {
                showMessage('error', response?.error || 'Failed to fetch emails.');
                speak('Failed to fetch emails.');
            }
        });
    }

    generateEmailButton.addEventListener('click', () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showMessage('error', 'Please enter a prompt.');
            speak('Please enter a prompt.');
            return;
        }
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'generateEmail', prompt }, (response) => {
            showLoading(false);
            if (response?.emailDraft) {
                generatedEmailOutput.value = response.emailDraft;
                generatedEmailOutput.readOnly = true;
                isEditing = false;
                editEmailButton.textContent = 'Edit Email';
                showMessage('success', 'Email generated successfully!');
                speakGeneratedEmail(response.emailDraft);
            } else {
                showMessage('error', response?.error || 'Failed to generate email.');
                speak('Failed to generate email.');
            }
        });
    });

    editEmailButton.addEventListener('click', () => {
        isEditing = !isEditing;
        generatedEmailOutput.readOnly = !isEditing;
        editEmailButton.textContent = isEditing ? 'Lock Editing' : 'Edit Email';
    });

    sendGeneratedEmailButton.addEventListener('click', () => {
        if (!generatedEmailOutput.value) {
            showMessage('error', 'No email content to send.');
            speak('No email content to send.');
            return;
        }
        recipientInput.value = '';
        subjectInput.value = '';
        messageInput.value = generatedEmailOutput.value;
        emailComposerModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        emailComposerModal.classList.remove('active');
    });

    closeSettingsModal.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    window.addEventListener('click', (event) => {
        if (event.target === emailComposerModal) {
            emailComposerModal.classList.remove('active');
        }
        if (event.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    boldButton.addEventListener('click', () => {
        document.execCommand('bold', false, null);
        messageInput.focus();
    });

    italicButton.addEventListener('click', () => {
        document.execCommand('italic', false, null);
        messageInput.focus();
    });

    sendEmailButton.addEventListener('click', () => {
        const recipient = recipientInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        if (!recipient || !subject || !message) {
            showMessage('error', 'Please fill all fields.');
            speak('Please fill all fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipient)) {
            showMessage('error', 'Invalid email address.');
            speak('Invalid email address.');
            return;
        }

        if (confirm('Are you sure you want to send this email?')) {
            showLoading(true);
            chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
                showLoading(false);
                if (response?.status === 'success') {
                    showMessage('success', 'Email sent successfully!');
                    speak('Email sent successfully!');
                    emailComposerModal.classList.remove('active');
                    generatedEmailOutput.value = '';
                    // Add sent email to the list
                    emails.push({
                        sender: 'You',
                        subject,
                        snippet: message.substring(0, 50) + '...',
                        content: message,
                        sent: true,
                        unread: false
                    });
                    if (currentFilter === 'sent') {
                        displayEmails(filterEmails(emails, 'sent'));
                    }
                } else {
                    showMessage('error', response?.message || 'Failed to send email.');
                    speak('Failed to send email.');
                }
            });
        }
    });

    saveDraftButton.addEventListener('click', () => {
        const draft = {
            recipient: recipientInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim()
        };
        chrome.storage.local.set({ draft }, () => {
            showMessage('success', 'Draft saved!');
            speak('Draft saved!');
            emailComposerModal.classList.remove('active');
        });
    });

    saveSettingsButton.addEventListener('click', () => {
        saveSettings();
    });

    // Helper Functions
    function displayEmails(emailsToDisplay) {
        emailList.innerHTML = '';
        if (!emailsToDisplay || emailsToDisplay.length === 0) {
            emailList.innerHTML = '<div class="email-item">No emails found</div>';
            return;
        }
        emailsToDisplay.forEach(email => {
            const emailItem = document.createElement('div');
            emailItem.className = 'email-item';
            emailItem.innerHTML = `<strong>${email.sender || email.from || 'Unknown'}</strong> - ${email.subject || 'No Subject'}<p>${email.snippet || 'No content'}</p>`;
            emailItem.addEventListener('click', () => {
                emailList.querySelectorAll('.email-item').forEach(item => item.classList.remove('selected'));
                emailItem.classList.add('selected');
                selectedEmail = email;
                displayEmailContent(email);
            });
            emailList.appendChild(emailItem);
        });
    }

    function displayEmailContent(email) {
        emailDetails.style.display = 'block';
        let content = email.content || email.snippet || 'No content available.';
        // Basic parsing for links and images
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        content = content.replace(/!\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g, '<img src="$2" alt="$1">');
        emailContent.innerHTML = `
            <p><strong>From:</strong> ${email.sender || email.from || 'Unknown'}</p>
            <p><strong>Subject:</strong> ${email.subject || 'No Subject'}</p>
            <p>${content}</p>
        `;
    }

    function speakEmails(emailsToSpeak) {
        if (!emailsToSpeak || emailsToSpeak.length === 0) {
            speak('No emails found.');
            return;
        }
        const maxEmailsToSpeak = 3;
        const emailsToSpeakLimited = emailsToSpeak.slice(0, maxEmailsToSpeak);
        let speechText = emailsToSpeak.length === 1 ? 'You have one new email. ' :
                        emailsToSpeak.length <= maxEmailsToSpeak ? `You have ${emailsToSpeak.length} new emails. ` :
                        `Here are your ${maxEmailsToSpeak} latest emails out of ${emailsToSpeak.length}. `;
        
        emailsToSpeakLimited.forEach((email, index) => {
            const sender = (email.sender || email.from || 'unknown sender').split('<')[0].trim();
            const ordinal = ['first', 'second', 'third'][index];
            speechText += `The ${ordinal} email is from ${sender}`;
            if (settings.includeSubjects && email.subject) {
                speechText += ` about ${email.subject}`;
            }
            speechText += '. ';
        });

        if (emailsToSpeak.length > maxEmailsToSpeak) {
            speechText += `You have ${emailsToSpeak.length - maxEmailsToSpeak} more emails to check.`;
        }
        speak(speechText);
    }

    function speakGeneratedEmail(emailDraft) {
        const lines = emailDraft.split('\n');
        let recipient = '', subject = '', body = '';
        for (const line of lines) {
            if (line.toLowerCase().startsWith('to:')) {
                recipient = line.substring(3).trim();
            } else if (line.toLowerCase().startsWith('subject:')) {
                subject = line.substring(8).trim();
            } else if (line.trim()) {
                body += line.trim() + ' ';
            }
        }
        const speechText = `Generated email. To: ${recipient || 'unknown recipient'}. Subject: ${subject || 'no subject'}. Message: ${body.trim() || 'no content'}`;
        speak(speechText);
    }
});
