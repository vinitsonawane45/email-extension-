// document.addEventListener('DOMContentLoaded', () => {
//     const loginButton = document.getElementById('login-button');
//     const logoutButton = document.getElementById('logout-button');
//     const fetchEmailsButton = document.getElementById('fetch-emails-button');
//     const generateEmailButton = document.getElementById('generate-email-button');
//     const editEmailButton = document.getElementById('edit-email-button');
//     const sendGeneratedEmailButton = document.getElementById('send-generated-email-button');
//     const darkModeToggle = document.getElementById('dark-mode-toggle');
//     const userStatus = document.getElementById('user-status');
//     const profileIcon = document.getElementById('profile-icon');
//     const profileDropdownContent = document.getElementById('profile-dropdown-content');
//     const settingsButton = document.getElementById('settings-button');
//     const userNameSpan = document.getElementById('user-name');
//     const userEmailSpan = document.getElementById('user-email');
//     const profileInfo = document.getElementById('profile-info');

//     const promptInput = document.getElementById('prompt');
//     const generatedEmailOutput = document.getElementById('generated-email');
//     const emailList = document.getElementById('email-list');
//     const loadingSpinner = document.getElementById('loading');
//     const messageDiv = document.getElementById('message');

//     // Email Composer Elements
//     const emailComposerModal = document.getElementById('email-composer-modal');
//     const closeModal = document.getElementById('close-modal');
//     const recipientInput = document.getElementById('recipient-input');
//     const subjectInput = document.getElementById('subject-input');
//     const messageInput = document.getElementById('message-input');
//     const sendEmailButton = document.getElementById('send-email-button');
//     const saveDraftButton = document.getElementById('save-draft-button');
//     const boldButton = document.getElementById('bold-button');
//     const italicButton = document.getElementById('italic-button');

//     let selectedEmail = null;
//     let isEditing = false;

//     // Load Dark Mode Preference
//     if (localStorage.getItem('darkMode') === 'enabled') {
//         document.body.classList.add('dark-mode');
//         darkModeToggle.querySelector('.dark-icon').style.display = 'none';
//         darkModeToggle.querySelector('.light-icon').style.display = 'inline';
//     }

//     // Toggle Dark Mode
//     darkModeToggle.addEventListener('click', () => {
//         document.body.classList.toggle('dark-mode');
//         const isDarkMode = document.body.classList.contains('dark-mode');
//         localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
//         darkModeToggle.querySelector('.dark-icon').style.display = isDarkMode ? 'none' : 'inline';
//         darkModeToggle.querySelector('.light-icon').style.display = isDarkMode ? 'inline' : 'none';
//     });

//     // Toggle Profile Dropdown
//     profileIcon.addEventListener('click', (event) => {
//         event.stopPropagation();
//         const isVisible = profileDropdownContent.style.display === 'block';
//         profileDropdownContent.style.display = isVisible ? 'none' : 'block';
//         profileDropdownContent.classList.toggle('active', !isVisible);
//     });

//     // Close Dropdown When Clicking Outside
//     document.addEventListener('click', (event) => {
//         if (!event.target.closest('.profile-dropdown')) {
//             profileDropdownContent.style.display = 'none';
//             profileDropdownContent.classList.remove('active');
//         }
//     });

//     // Keyboard Accessibility for Dropdown
//     profileIcon.addEventListener('keydown', (event) => {
//         if (event.key === 'Enter' || event.key === ' ') {
//             event.preventDefault();
//             const isVisible = profileDropdownContent.style.display === 'block';
//             profileDropdownContent.style.display = isVisible ? 'none' : 'block';
//             profileDropdownContent.classList.toggle('active', !isVisible);
//         }
//     });

//     // Show Loading Spinner
//     function showLoading(show) {
//         loadingSpinner.style.display = show ? 'block' : 'none';
//     }

//     // Show Notification Message
//     function showMessage(type, text) {
//         messageDiv.textContent = text;
//         messageDiv.className = `message ${type}`;
//         setTimeout(() => messageDiv.textContent = '', 3000);
//     }

//     // Update User Status and Profile Icon
//     function updateUserStatus(userData) {
//         console.log("Updating user status with:", userData);
//         if (userData?.email) {
//             userStatus.innerHTML = `Logged in as: <span class="email-text">${userData.email}</span>`;
//             const initials = userData.email.split('@')[0].substring(0, 2).toUpperCase();
//             profileIcon.innerHTML = initials;
//             profileIcon.classList.add('initials');
//             profileInfo.style.display = 'block';
//             userNameSpan.textContent = userData.name || 'User';
//             userEmailSpan.textContent = userData.email;
//             loginButton.style.display = 'none';
//             logoutButton.style.display = 'block';
//         } else {
//             userStatus.textContent = "Not logged in.";
//             profileIcon.innerHTML = '<i class="fas fa-user"></i>';
//             profileIcon.classList.remove('initials');
//             profileInfo.style.display = 'none';
//             loginButton.style.display = 'block';
//             logoutButton.style.display = 'none';
//         }
//     }

//     // Check Initial Login State
//     chrome.storage.local.get(['accessToken', 'userEmail', 'userName'], (data) => {
//         console.log("Initial storage data:", data);
//         updateUserStatus({ email: data.userEmail, name: data.userName });
//     });

//     // Handle Login
//     loginButton.addEventListener('click', () => {
//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'login' }, (response) => {
//             showLoading(false);
//             console.log("Login response:", response);
//             if (response?.status === "success" && response?.email) {
//                 chrome.storage.local.set({ userEmail: response.email, userName: response.name }, () => {
//                     updateUserStatus({ email: response.email, name: response.name });
//                     showMessage("success", "Logged in successfully!");
//                 });
//             } else {
//                 showMessage("error", response?.message || "Login failed.");
//             }
//         });
//     });

//     // Handle Logout
//     logoutButton.addEventListener('click', () => {
//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
//             showLoading(false);
//             console.log("Logout response:", response);
//             if (response?.status === "success") {
//                 chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], () => {
//                     console.log("Storage cleared in popup.");
//                     updateUserStatus(null);
//                     showMessage("success", "Logged out successfully!");
//                 });
//             } else {
//                 console.error("Logout failed:", response?.message);
//                 chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], () => {
//                     updateUserStatus(null);
//                     showMessage("error", response?.message || "Logout failed, but UI reset.");
//                 });
//             }
//         });
//     });

//     // Handle Settings (Placeholder)
//     settingsButton.addEventListener('click', () => {
//         showMessage("info", "Settings feature coming soon!");
//         profileDropdownContent.style.display = 'none';
//         profileDropdownContent.classList.remove('active');
//     });

//     // Fetch Emails
//     fetchEmailsButton.addEventListener('click', () => {
//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'fetchEmails' }, (response) => {
//             showLoading(false);
//             if (response?.emails) {
//                 emailList.innerHTML = '';
//                 response.emails.forEach(email => {
//                     const emailItem = document.createElement('div');
//                     emailItem.className = 'email-item';
//                     emailItem.innerHTML = `<strong>${email.sender}</strong> - ${email.subject}<p>${email.snippet}</p>`;
//                     emailItem.addEventListener('click', () => {
//                         selectedEmail = email;
//                         emailList.querySelectorAll('.email-item').forEach(item => item.classList.remove('selected'));
//                         emailItem.classList.add('selected');
//                     });
//                     emailList.appendChild(emailItem);
//                 });
//             } else {
//                 showMessage("error", response?.error || "Failed to fetch emails.");
//             }
//         });
//     });

//     // Generate Email
//     generateEmailButton.addEventListener('click', () => {
//         const prompt = promptInput.value;
//         if (!prompt) {
//             showMessage("error", "Please enter a prompt.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'generateEmail', prompt }, (response) => {
//             showLoading(false);
//             if (response?.emailDraft) {
//                 generatedEmailOutput.value = response.emailDraft;
//                 generatedEmailOutput.readOnly = true;
//                 isEditing = false;
//                 editEmailButton.textContent = "Edit Email";
//             } else {
//                 showMessage("error", response?.error || "Failed to generate email.");
//             }
//         });
//     });

//     // Edit AI-Generated Email
//     editEmailButton.addEventListener('click', () => {
//         isEditing = !isEditing;
//         generatedEmailOutput.readOnly = !isEditing;
//         editEmailButton.textContent = isEditing ? "Lock Editing" : "Edit Email";
//     });

//     // Open Email Composer Modal
//     sendGeneratedEmailButton.addEventListener('click', () => {
//         if (!generatedEmailOutput.value) {
//             showMessage("error", "No email content to send.");
//             return;
//         }
//         recipientInput.value = '';
//         subjectInput.value = '';
//         messageInput.value = generatedEmailOutput.value;
//         emailComposerModal.style.display = 'block';
//     });

//     // Close Email Composer Modal
//     closeModal.addEventListener('click', () => {
//         emailComposerModal.style.display = 'none';
//     });

//     // Close Modal When Clicking Outside
//     window.addEventListener('click', (event) => {
//         if (event.target === emailComposerModal) {
//             emailComposerModal.style.display = 'none';
//         }
//     });

//     // Basic Text Formatting (Bold and Italic)
//     boldButton.addEventListener('click', () => {
//         document.execCommand('bold', false, null);
//         messageInput.focus();
//     });

//     italicButton.addEventListener('click', () => {
//         document.execCommand('italic', false, null);
//         messageInput.focus();
//     });

//     // Send Email from Composer
//     sendEmailButton.addEventListener('click', () => {
//         const recipient = recipientInput.value.trim();
//         const subject = subjectInput.value.trim();
//         const message = messageInput.value.trim();

//         if (!recipient || !subject || !message) {
//             showMessage("error", "Please fill all fields.");
//             return;
//         }

//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(recipient)) {
//             showMessage("error", "Invalid email address.");
//             return;
//         }

//         if (confirm("Are you sure you want to send this email?")) {
//             showLoading(true);
//             chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
//                 showLoading(false);
//                 if (response?.status === "success") {
//                     showMessage("success", response.message);
//                     emailComposerModal.style.display = 'none';
//                 } else {
//                     showMessage("error", response?.message || "Failed to send email.");
//                 }
//             });
//         }
//     });

//     // Save Draft (Placeholder)
//     saveDraftButton.addEventListener('click', () => {
//         const draft = {
//             recipient: recipientInput.value.trim(),
//             subject: subjectInput.value.trim(),
//             message: messageInput.value.trim()
//         };
//         chrome.storage.local.set({ draft }, () => {
//             showMessage("success", "Draft saved!");
//             emailComposerModal.style.display = 'none';
//         });
//     });
// });




document.addEventListener('DOMContentLoaded', function() {
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
    const userNameSpan = document.getElementById('user-name');
    const userEmailSpan = document.getElementById('user-email');
    const profileInfo = document.getElementById('profile-info');
    const promptInput = document.getElementById('prompt');
    const generatedEmailOutput = document.getElementById('generated-email');
    const emailList = document.getElementById('email-list');
    const loadingSpinner = document.getElementById('loading');
    const messageDiv = document.getElementById('message');
    const voiceSelect = document.getElementById('voice-select');
    const speechSpeed = document.getElementById('speech-speed');
    const includeSubjects = document.getElementById('include-subjects');

    // State
    let selectedEmail = null;
    let isEditing = false;
    let voices = [];

    // Initialize
    initDarkMode();
    initProfileDropdown();
    checkLoginStatus();
    initSpeech();

    // Dark Mode
    function initDarkMode() {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            darkModeToggle.querySelector('.dark-icon').style.display = 'none';
            darkModeToggle.querySelector('.light-icon').style.display = 'inline';
        }
    }

    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        darkModeToggle.querySelector('.dark-icon').style.display = isDarkMode ? 'none' : 'inline';
        darkModeToggle.querySelector('.light-icon').style.display = isDarkMode ? 'inline' : 'none';
    });

    // Profile Dropdown
    function initProfileDropdown() {
        profileDropdownContent.style.display = 'none';
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdownContent.style.display = 
                profileDropdownContent.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-dropdown')) {
                profileDropdownContent.style.display = 'none';
            }
        });
        profileDropdownContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Login Status
    function checkLoginStatus() {
        const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
        storage.local.get(['userEmail', 'userName'], function(data) {
            updateUserStatus(data.userEmail ? {
                email: data.userEmail,
                name: data.userName
            } : null);
        });
    }

    function updateUserStatus(userData) {
        userStatus.innerHTML = "Not logged in.";
        profileIcon.innerHTML = '<i class="fas fa-user"></i>';
        profileIcon.classList.remove('initials');
        profileInfo.style.display = 'none';
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';

        if (userData?.email) {
            userStatus.innerHTML = "Logged in as: ";
            const emailSpan = document.createElement("span");
            emailSpan.className = "email-text";
            emailSpan.textContent = userData.email;
            userStatus.appendChild(emailSpan);

            const initials = userData.email.split('@')[0].substring(0, 2).toUpperCase();
            profileIcon.textContent = initials;
            profileIcon.classList.add('initials');
            profileInfo.style.display = 'block';
            userNameSpan.textContent = userData.name || 'User';
            userEmailSpan.textContent = userData.email;
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
        }
    }

    // Speech Initialization
    function initSpeech() {
        voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            populateVoiceSelect();
        };
        populateVoiceSelect();
    }

    function populateVoiceSelect() {
        voiceSelect.innerHTML = '';
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voiceIndex = parseInt(voiceSelect.value);
        const speed = parseFloat(speechSpeed.value);
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        utterance.rate = speed;
        utterance.pitch = 1.0;
        if (voices.length > 0 && voiceIndex < voices.length) {
            utterance.voice = voices[voiceIndex];
        }
        utterance.onend = () => console.log('Speech finished');
        utterance.onerror = (event) => console.error('Speech error:', event.error);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // UI Helpers
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    function showMessage(type, text) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(function() {
            messageDiv.textContent = '';
            messageDiv.style.display = 'none';
        }, 3000);
    }

    // Event Handlers
    loginButton.addEventListener('click', function() {
        showLoading(true);
        const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
        runtime.sendMessage({ action: 'login' }, function(response) {
            showLoading(false);
            if (response?.status === "success") {
                const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
                storage.local.set({
                    userEmail: response.email,
                    userName: response.name
                }, function() {
                    updateUserStatus(response);
                    showMessage("success", "Logged in successfully!");
                    loadUserEmails(response.email);
                });
            } else {
                showMessage("error", response?.message || "Login failed.");
            }
        });
    });

    logoutButton.addEventListener('click', function() {
        showLoading(true);
        const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
        runtime.sendMessage({ action: 'logout' }, function(response) {
            showLoading(false);
            if (response?.status === "success") {
                const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
                storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], function() {
                    updateUserStatus(null);
                    emailList.innerHTML = '';
                    generatedEmailOutput.value = '';
                    showMessage("success", "Logged out successfully!");
                });
            } else {
                showMessage("error", response?.message || "Logout failed.");
            }
        });
    });

    fetchEmailsButton.addEventListener('click', function() {
        showLoading(true);
        const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
        runtime.sendMessage({ action: 'fetchEmails' }, function(response) {
            showLoading(false);
            if (response?.status === "success") {
                displayEmails(response.emails);
                speakEmails(response.emails);
                showMessage("success", "Emails fetched successfully!");
            } else {
                showMessage("error", response?.message || "Failed to fetch emails.");
                speak("Failed to fetch emails.");
            }
        });
    });

    generateEmailButton.addEventListener('click', function() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showMessage("error", "Please enter a prompt.");
            speak("Please enter a prompt.");
            return;
        }
        showLoading(true);
        const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
        runtime.sendMessage({ 
            action: 'generateEmail',
            prompt: prompt
        }, function(response) {
            showLoading(false);
            if (response?.status === "success") {
                generatedEmailOutput.value = response.emailDraft;
                generatedEmailOutput.readOnly = true;
                editEmailButton.textContent = "Edit Email";
                showMessage("success", "Email generated successfully!");
                speakGeneratedEmail(response.emailDraft);
            } else {
                showMessage("error", response?.message || "Failed to generate email.");
                speak("Failed to generate email.");
            }
        });
    });

    editEmailButton.addEventListener('click', function() {
        isEditing = !isEditing;
        generatedEmailOutput.readOnly = !isEditing;
        editEmailButton.textContent = isEditing ? "Lock Editing" : "Edit Email";
    });

    sendGeneratedEmailButton.addEventListener('click', function() {
        const emailContent = generatedEmailOutput.value.trim();
        if (!emailContent) {
            showMessage("error", "No email content to send.");
            speak("No email content to send.");
            return;
        }
        let recipient = "";
        let subject = "No Subject";
        const lines = emailContent.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().startsWith('to:')) {
                recipient = line.substring(3).trim();
            } else if (line.toLowerCase().startsWith('subject:')) {
                subject = line.substring(8).trim();
            }
            if (recipient && subject !== "No Subject") break;
        }
        if (!recipient) {
            showMessage("error", "Could not determine recipient. Please add 'To:' field.");
            speak("Could not determine recipient. Please add a 'To' field.");
            return;
        }
        if (!confirm("Are you sure you want to send this email?")) {
            return;
        }
        showLoading(true);
        const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
        runtime.sendMessage({
            action: 'sendEmail',
            recipient: recipient,
            subject: subject,
            message: emailContent
        }, function(response) {
            showLoading(false);
            if (response?.status === "success") {
                showMessage("success", "Email sent successfully!");
                speak("Email sent successfully!");
                generatedEmailOutput.value = '';
            } else {
                showMessage("error", response?.message || "Failed to send email.");
                speak("Failed to send email.");
            }
        });
    });

    // Helper Functions
    function displayEmails(emails) {
        emailList.innerHTML = '';
        if (!emails || emails.length === 0) {
            emailList.innerHTML = '<div class="email-item">No emails found</div>';
            return;
        }
        emails.forEach(function(email) {
            const emailItem = document.createElement('div');
            emailItem.className = 'email-item';
            emailItem.innerHTML = `
                <strong>${email.from}</strong> - ${email.subject}
                <p>${email.snippet} (Category: ${email.category})</p>
            `;
            emailItem.addEventListener('click', function() {
                document.querySelectorAll('.email-item').forEach(function(item) {
                    item.classList.remove('selected');
                });
                emailItem.classList.add('selected');
                selectedEmail = email;
            });
            emailList.appendChild(emailItem);
        });
    }

    function speakEmails(emails) {
        if (!emails || emails.length === 0) {
            speak("No new emails found.");
            return;
        }
        const maxEmailsToSpeak = 3;
        const emailsToSpeak = emails.slice(0, maxEmailsToSpeak);
        const includeSubjectsChecked = includeSubjects.checked;
        let speechText = emails.length === 1 ? "You have one new email. " :
                        emails.length <= maxEmailsToSpeak ? `You have ${emails.length} new emails. ` :
                        `Here are your ${maxEmailsToSpeak} latest emails out of ${emails.length}. `;
        
        emailsToSpeak.forEach((email, index) => {
            const sender = email.from.split('<')[0].trim();
            const ordinal = ['first', 'second', 'third'][index];
            speechText += `The ${ordinal} email is from ${sender}`;
            if (includeSubjectsChecked && email.subject) {
                speechText += ` about ${email.subject}`;
            }
            if (email.category) {
                speechText += `, categorized as ${email.category}`;
            }
            speechText += '. ';
        });

        if (emails.length > maxEmailsToSpeak) {
            speechText += `You have ${emails.length - maxEmailsToSpeak} more emails to check.`;
        }
        speak(speechText);
    }

    function speakGeneratedEmail(emailDraft) {
        const lines = emailDraft.split('\n');
        let recipient = "", subject = "", body = "";
        for (const line of lines) {
            if (line.toLowerCase().startsWith('to:')) {
                recipient = line.substring(3).trim();
            } else if (line.toLowerCase().startsWith('subject:')) {
                subject = line.substring(8).trim();
            } else if (line.trim() && !recipient && !subject) {
                body += line.trim() + " ";
            } else if (recipient && subject) {
                body += line.trim() + " ";
            }
        }
        const speechText = `Here is your generated email. To: ${recipient}. Subject: ${subject}. Message: ${body.trim()}`;
        speak(speechText);
    }

    function loadUserEmails(userEmail) {
        const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
        runtime.sendMessage({
            action: 'getFromDatabase',
            collection: 'users',
            query: { email: userEmail }
        }, function(response) {
            if (response.status === 'success' && response.data && response.data.length > 0) {
                const userId = response.data[0]._id || response.data[0].id;
                runtime.sendMessage({
                    action: 'getFromDatabase',
                    collection: 'emails',
                    query: { user_id: userId }
                }, function(emailsResponse) {
                    if (emailsResponse.status === 'success') {
                        console.log("User's saved emails:", emailsResponse.data);
                    }
                });
            }
        });
    }
});