// document.addEventListener('DOMContentLoaded', () => {
//     const loginButton = document.getElementById('login-button');
//     const logoutButton = document.getElementById('logout-button');
//     const fetchEmailsButton = document.getElementById('fetch-emails-button');
//     const emailList = document.getElementById('email-list');
//     const generateEmailButton = document.getElementById('generate-email-button');
//     const summarizeEmailButton = document.getElementById('summarize-email-button');
//     const categorizeEmailButton = document.getElementById('categorize-email-button');
//     const smartReplyButton = document.getElementById('smart-reply-button');
//     const promptInput = document.getElementById('prompt');
//     const generatedEmailOutput = document.getElementById('generated-email');
//     const emailSummaryOutput = document.getElementById('email-summary');
//     const emailCategoryOutput = document.getElementById('email-category');
//     const smartReplyOutput = document.getElementById('smart-reply');

//     let selectedEmail = null; // Store the currently selected email

//     // Check if the user is logged in
//     chrome.storage.local.get(['accessToken', 'userId'], (data) => {
//         const statusDiv = document.getElementById('status');
//         if (statusDiv) {
//             if (data.accessToken && data.userId) {
//                 statusDiv.textContent = `Logged in as: ${data.userId}`;
//             } else {
//                 statusDiv.textContent = "Not logged in.";
//             }
//         }
//     });

//     // Handle login button click
//     if (loginButton) {
//         loginButton.addEventListener('click', () => {
//             chrome.runtime.sendMessage({ action: 'login' }, (response) => {
//                 const statusDiv = document.getElementById('status');
//                 if (statusDiv) {
//                     if (response && response.status) {
//                         statusDiv.textContent = response.status;
//                     } else {
//                         statusDiv.textContent = "Login failed.";
//                     }
//                 }
//             });
//         });
//     }

//     // Handle logout button click
//     if (logoutButton) {
//         logoutButton.addEventListener('click', () => {
//             chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
//                 const statusDiv = document.getElementById('status');
//                 if (statusDiv) {
//                     if (response && response.status) {
//                         statusDiv.textContent = response.status;
//                     } else {
//                         statusDiv.textContent = "Logout failed.";
//                     }
//                 }
//             });
//         });
//     }

//     // Fetch Emails and Display in Left Column
//     if (fetchEmailsButton) {
//         fetchEmailsButton.addEventListener('click', () => {
//             chrome.runtime.sendMessage({ action: 'fetchEmails' }, (response) => {
//                 if (response && response.emails) {
//                     emailList.innerHTML = ''; // Clear previous emails
//                     response.emails.forEach(email => {
//                         const emailItem = document.createElement('div');
//                         emailItem.className = 'email-item';
//                         emailItem.innerHTML = `
//                             <strong>${email.sender}</strong> - ${email.subject}
//                             <p>${email.snippet}</p>
//                         `;
//                         emailItem.addEventListener('click', () => {
//                             selectedEmail = email; // Store selected email
//                             emailList.querySelectorAll('.email-item').forEach(item => item.classList.remove('selected'));
//                             emailItem.classList.add('selected');
//                         });
//                         emailList.appendChild(emailItem);
//                     });
//                 } else {
//                     console.error("Failed to fetch emails.");
//                 }
//             });
//         });
//     }

//     // Generate Email (Right Column)
//     if (generateEmailButton) {
//         generateEmailButton.addEventListener('click', () => {
//             const prompt = promptInput.value;
//             if (!prompt) {
//                 alert("Please enter a prompt to generate an email.");
//                 return;
//             }
//             chrome.runtime.sendMessage({ action: 'generateEmail', prompt }, (response) => {
//                 if (generatedEmailOutput) {
//                     if (response && response.emailDraft) {
//                         generatedEmailOutput.value = response.emailDraft;
//                     } else {
//                         console.error("Failed to generate email.");
//                     }
//                 }
//             });
//         });
//     }

//     // Summarize Email (Right Column)
//     if (summarizeEmailButton) {
//         summarizeEmailButton.addEventListener('click', () => {
//             if (!selectedEmail) {
//                 alert("Please select an email first.");
//                 return;
//             }
//             chrome.runtime.sendMessage({ action: 'summarizeEmail', emailBody: selectedEmail.snippet }, (response) => {
//                 if (emailSummaryOutput) {
//                     if (response && response.summary) {
//                         emailSummaryOutput.textContent = response.summary;
//                     } else {
//                         console.error("Failed to summarize email.");
//                     }
//                 }
//             });
//         });
//     }

//     // Categorize Email (Right Column)
//     if (categorizeEmailButton) {
//         categorizeEmailButton.addEventListener('click', () => {
//             if (!selectedEmail) {
//                 alert("Please select an email first.");
//                 return;
//             }
//             chrome.runtime.sendMessage({ action: 'categorizeEmail', emailBody: selectedEmail.snippet }, (response) => {
//                 if (emailCategoryOutput) {
//                     if (response && response.category) {
//                         emailCategoryOutput.textContent = `Category: ${response.category}`;
//                     } else {
//                         console.error("Failed to categorize email.");
//                     }
//                 }
//             });
//         });
//     }

//     // Smart Reply (Right Column)
//     if (smartReplyButton) {
//         smartReplyButton.addEventListener('click', () => {
//             if (!selectedEmail) {
//                 alert("Please select an email first.");
//                 return;
//             }
//             chrome.runtime.sendMessage({ action: 'smartReply', emailBody: selectedEmail.snippet }, (response) => {
//                 if (smartReplyOutput) {
//                     if (response && response.smartReply) {
//                         smartReplyOutput.textContent = response.smartReply;
//                     } else {
//                         console.error("Failed to generate smart reply.");
//                     }
//                 }
//             });
//         });
//     }
// });




// document.addEventListener('DOMContentLoaded', () => {
//     const loginButton = document.getElementById('login-button');
//     const logoutButton = document.getElementById('logout-button');
//     const fetchEmailsButton = document.getElementById('fetch-emails-button');
//     const generateEmailButton = document.getElementById('generate-email-button');
//     const editEmailButton = document.getElementById('edit-email-button');
//     const sendGeneratedEmailButton = document.getElementById('send-generated-email-button');
//     const summarizeEmailButton = document.getElementById('summarize-email-button');
//     const categorizeEmailButton = document.getElementById('categorize-email-button');
//     const smartReplyButton = document.getElementById('smart-reply-button');
//     const sendEmailButton = document.getElementById('send-email-button');
//     const darkModeToggle = document.getElementById('dark-mode-toggle');
//     const fabButton = document.getElementById('fab');

//     const promptInput = document.getElementById('prompt');
//     const generatedEmailOutput = document.getElementById('generated-email');
//     const emailSummaryOutput = document.getElementById('email-summary');
//     const emailCategoryOutput = document.getElementById('email-category');
//     const smartReplyOutput = document.getElementById('smart-reply');
//     const recipientInput = document.getElementById('recipient');
//     const subjectInput = document.getElementById('subject');
//     const messageInput = document.getElementById('message');
//     const emailList = document.getElementById('email-list');
//     const loadingSpinner = document.getElementById('loading');
//     const messageDiv = document.getElementById('message');

//     let selectedEmail = null;
//     let isEditing = false;

//     // Load Dark Mode Preference
//     if (localStorage.getItem('darkMode') === 'enabled') {
//         document.body.classList.add('dark-mode');
//     }

//     // Toggle Dark Mode
//     darkModeToggle.addEventListener('click', () => {
//         document.body.classList.toggle('dark-mode');
//         localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
//     });

//     // Floating Action Button (FAB) - Opens Compose Email Section
//     fabButton.addEventListener('click', () => {
//         recipientInput.focus();
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

//     // Handle Login
//     loginButton.addEventListener('click', () => {
//         chrome.runtime.sendMessage({ action: 'login' }, (response) => {
//             document.getElementById('status').textContent = response?.status || "Login failed.";
//         });
//     });

//     // Handle Logout
//     logoutButton.addEventListener('click', () => {
//         chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
//             document.getElementById('status').textContent = response?.status || "Logout failed.";
//         });
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
//                 showMessage("error", "Failed to fetch emails.");
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
//             generatedEmailOutput.value = response?.emailDraft || "Failed to generate email.";
//             generatedEmailOutput.readOnly = true;
//             isEditing = false;
//             editEmailButton.textContent = "Edit Email";
//         });
//     });

//     // Edit AI-Generated Email
//     editEmailButton.addEventListener('click', () => {
//         isEditing = !isEditing;
//         generatedEmailOutput.readOnly = !isEditing;
//         editEmailButton.textContent = isEditing ? "Lock Editing" : "Edit Email";
//     });

//     // Send AI-Generated Email
//     sendGeneratedEmailButton.addEventListener('click', () => {
//         const recipient = prompt("Enter recipient email:");
//         const subject = prompt("Enter email subject:");
//         const message = generatedEmailOutput.value;

//         if (!recipient || !subject || !message) {
//             showMessage("error", "Please fill all fields.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
//             showLoading(false);
//             showMessage(response?.status === "success" ? "success" : "error", response?.message);
//         });
//     });

//     // Send Custom Composed Email
//     sendEmailButton.addEventListener('click', () => {
//         const recipient = recipientInput.value;
//         const subject = subjectInput.value;
//         const message = messageInput.value;

//         if (!recipient || !subject || !message) {
//             showMessage("error", "Please fill all fields.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
//             showLoading(false);
//             showMessage(response?.status === "success" ? "success" : "error", response?.message);
//         });
//     });

//     // Summarize Email
//     summarizeEmailButton.addEventListener('click', () => {
//         if (!selectedEmail) {
//             showMessage("error", "Select an email first.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'summarizeEmail', emailBody: selectedEmail.snippet }, (response) => {
//             showLoading(false);
//             emailSummaryOutput.textContent = response?.summary || "Failed to summarize.";
//         });
//     });

//     // Categorize Email
//     categorizeEmailButton.addEventListener('click', () => {
//         if (!selectedEmail) {
//             showMessage("error", "Select an email first.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'categorizeEmail', emailBody: selectedEmail.snippet }, (response) => {
//             showLoading(false);
//             emailCategoryOutput.textContent = response?.category ? `Category: ${response.category}` : "Failed to categorize.";
//         });
//     });

//     // Smart Reply
//     smartReplyButton.addEventListener('click', () => {
//         if (!selectedEmail) {
//             showMessage("error", "Select an email first.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'smartReply', emailBody: selectedEmail.snippet }, (response) => {
//             showLoading(false);
//             smartReplyOutput.textContent = response?.smartReply || "Failed to generate smart reply.";
//         });
//     });
// });




// document.addEventListener('DOMContentLoaded', () => {
//     const loginButton = document.getElementById('login-button');
//     const logoutButton = document.getElementById('logout-button');
//     const fetchEmailsButton = document.getElementById('fetch-emails-button');
//     const generateEmailButton = document.getElementById('generate-email-button');
//     const editEmailButton = document.getElementById('edit-email-button');
//     const sendGeneratedEmailButton = document.getElementById('send-generated-email-button');
//     const summarizeEmailButton = document.getElementById('summarize-email-button');
//     const categorizeEmailButton = document.getElementById('categorize-email-button');
//     const smartReplyButton = document.getElementById('smart-reply-button');
//     const sendEmailButton = document.getElementById('send-email-button');
//     const darkModeToggle = document.getElementById('dark-mode-toggle');
//     const fabButton = document.getElementById('fab');

//     const promptInput = document.getElementById('prompt');
//     const generatedEmailOutput = document.getElementById('generated-email');
//     const emailSummaryOutput = document.getElementById('email-summary');
//     const emailCategoryOutput = document.getElementById('email-category');
//     const smartReplyOutput = document.getElementById('smart-reply');
//     const recipientInput = document.getElementById('recipient');
//     const subjectInput = document.getElementById('subject');
//     const messageInput = document.getElementById('message');
//     const emailList = document.getElementById('email-list');
//     const loadingSpinner = document.getElementById('loading');
//     const messageDiv = document.getElementById('message');

//     let selectedEmail = null;
//     let isEditing = false;

//     // Load Dark Mode Preference
//     if (localStorage.getItem('darkMode') === 'enabled') {
//         document.body.classList.add('dark-mode');
//     }

//     // Toggle Dark Mode
//     darkModeToggle.addEventListener('click', () => {
//         document.body.classList.toggle('dark-mode');
//         localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
//     });

//     // Floating Action Button (FAB) - Opens Compose Email Section
//     fabButton.addEventListener('click', () => {
//         recipientInput.focus();
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

//     // Handle Login
//     loginButton.addEventListener('click', () => {
//         chrome.runtime.sendMessage({ action: 'login' }, (response) => {
//             document.getElementById('status').textContent = response?.status || "Login failed.";
//         });
//     });

//     // Handle Logout
//     logoutButton.addEventListener('click', () => {
//         chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
//             document.getElementById('status').textContent = response?.status || "Logout failed.";
//         });
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
//                 showMessage("error", "Failed to fetch emails.");
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
//             generatedEmailOutput.value = response?.emailDraft || "Failed to generate email.";
//             generatedEmailOutput.readOnly = true;
//             isEditing = false;
//             editEmailButton.textContent = "Edit Email";
//         });
//     });

//     // Edit AI-Generated Email
//     editEmailButton.addEventListener('click', () => {
//         isEditing = !isEditing;
//         generatedEmailOutput.readOnly = !isEditing;
//         editEmailButton.textContent = isEditing ? "Lock Editing" : "Edit Email";
//     });

//     // Send AI-Generated Email
//     sendGeneratedEmailButton.addEventListener('click', () => {
//         const recipient = prompt("Enter recipient email:");
//         const subject = prompt("Enter email subject:");
//         const message = generatedEmailOutput.value;

//         if (!recipient || !subject || !message) {
//             showMessage("error", "Please fill all fields.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
//             showLoading(false);
//             showMessage(response?.status === "success" ? "success" : "error", response?.message);
//         });
//     });

//     // Send Custom Composed Email
//     sendEmailButton.addEventListener('click', () => {
//         const recipient = recipientInput.value;
//         const subject = subjectInput.value;
//         const message = messageInput.value;

//         if (!recipient || !subject || !message) {
//             showMessage("error", "Please fill all fields.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
//             showLoading(false);
//             showMessage(response?.status === "success" ? "success" : "error", response?.message);
//         });
//     });

//     // Summarize Email
//     summarizeEmailButton.addEventListener('click', () => {
//         if (!selectedEmail) {
//             showMessage("error", "Select an email first.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'summarizeEmail', emailBody: selectedEmail.snippet }, (response) => {
//             showLoading(false);
//             emailSummaryOutput.textContent = response?.summary || "Failed to summarize.";
//         });
//     });

//     // Categorize Email
//     categorizeEmailButton.addEventListener('click', () => {
//         if (!selectedEmail) {
//             showMessage("error", "Select an email first.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'categorizeEmail', emailBody: selectedEmail.snippet }, (response) => {
//             showLoading(false);
//             emailCategoryOutput.textContent = response?.category ? `Category: ${response.category}` : "Failed to categorize.";
//         });
//     });

//     // Smart Reply
//     smartReplyButton.addEventListener('click', () => {
//         if (!selectedEmail) {
//             showMessage("error", "Select an email first.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'smartReply', emailBody: selectedEmail.snippet }, (response) => {
//             showLoading(false);
//             smartReplyOutput.textContent = response?.smartReply || "Failed to generate smart reply.";
//         });
//     });
// });




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

//     const promptInput = document.getElementById('prompt');
//     const generatedEmailOutput = document.getElementById('generated-email');
//     const emailList = document.getElementById('email-list');
//     const loadingSpinner = document.getElementById('loading');
//     const messageDiv = document.getElementById('message');

//     let selectedEmail = null;
//     let isEditing = false;

//     // Load Dark Mode Preference
//     if (localStorage.getItem('darkMode') === 'enabled') {
//         document.body.classList.add('dark-mode');
//     }

//     // Toggle Dark Mode
//     darkModeToggle.addEventListener('click', () => {
//         document.body.classList.toggle('dark-mode');
//         localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
//     });

//     // Toggle Profile Dropdown
//     profileIcon.addEventListener('click', (event) => {
//         event.stopPropagation(); // Prevent event from bubbling up
//         profileDropdownContent.style.display = profileDropdownContent.style.display === 'block' ? 'none' : 'block';
//     });

//     // Close Dropdown When Clicking Outside
//     document.addEventListener('click', () => {
//         profileDropdownContent.style.display = 'none';
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
//     function updateUserStatus(email) {
//         if (email) {
//             userStatus.textContent = `Logged in as: ${email}`;
//             // Display user initials in profile icon
//             const initials = email.split('@')[0].substring(0, 2).toUpperCase();
//             profileIcon.innerHTML = initials;
//             profileIcon.classList.add('initials'); // Add class for styling
//         } else {
//             userStatus.textContent = "Not logged in.";
//             // Reset profile icon to default
//             profileIcon.innerHTML = '<i class="fas fa-user"></i>';
//             profileIcon.classList.remove('initials');
//         }
//     }

//     // Handle Login
//     loginButton.addEventListener('click', () => {
//         chrome.runtime.sendMessage({ action: 'login' }, (response) => {
//             if (response?.status === "success" && response?.email) {
//                 updateUserStatus(response.email); // Update user status with email
//             } else {
//                 showMessage("error", "Login failed.");
//             }
//         });
//     });

//     // Handle Logout
//     logoutButton.addEventListener('click', () => {
//         chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
//             if (response?.status === "success") {
//                 updateUserStatus(null); // Clear user status
//             } else {
//                 showMessage("error", "Logout failed.");
//             }
//         });
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
//                 showMessage("error", "Failed to fetch emails.");
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
//             generatedEmailOutput.value = response?.emailDraft || "Failed to generate email.";
//             generatedEmailOutput.readOnly = true;
//             isEditing = false;
//             editEmailButton.textContent = "Edit Email";
//         });
//     });

//     // Edit AI-Generated Email
//     editEmailButton.addEventListener('click', () => {
//         isEditing = !isEditing;
//         generatedEmailOutput.readOnly = !isEditing;
//         editEmailButton.textContent = isEditing ? "Lock Editing" : "Edit Email";
//     });

//     // Send AI-Generated Email
//     sendGeneratedEmailButton.addEventListener('click', () => {
//         const recipient = prompt("Enter recipient email:");
//         const subject = prompt("Enter email subject:");
//         const message = generatedEmailOutput.value;

//         if (!recipient || !subject || !message) {
//             showMessage("error", "Please fill all fields.");
//             return;
//         }

//         showLoading(true);
//         chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
//             showLoading(false);
//             showMessage(response?.status === "success" ? "success" : "error", response?.message);
//         });
//     });
// });



document.addEventListener('DOMContentLoaded', () => {
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
    const loadingSpinner = document.getElementById('loading');
    const messageDiv = document.getElementById('message');

    // Email Composer Elements
    const emailComposerModal = document.getElementById('email-composer-modal');
    const closeModal = document.getElementById('close-modal');
    const recipientInput = document.getElementById('recipient-input');
    const subjectInput = document.getElementById('subject-input');
    const messageInput = document.getElementById('message-input');
    const sendEmailButton = document.getElementById('send-email-button');
    const saveDraftButton = document.getElementById('save-draft-button');
    const boldButton = document.getElementById('bold-button');
    const italicButton = document.getElementById('italic-button');

    let selectedEmail = null;
    let isEditing = false;

    // Load Dark Mode Preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.querySelector('.dark-icon').style.display = 'none';
        darkModeToggle.querySelector('.light-icon').style.display = 'inline';
    }

    // Toggle Dark Mode
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        darkModeToggle.querySelector('.dark-icon').style.display = isDarkMode ? 'none' : 'inline';
        darkModeToggle.querySelector('.light-icon').style.display = isDarkMode ? 'inline' : 'none';
    });

    // Toggle Profile Dropdown
    profileIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        const isVisible = profileDropdownContent.style.display === 'block';
        profileDropdownContent.style.display = isVisible ? 'none' : 'block';
        profileDropdownContent.classList.toggle('active', !isVisible);
    });

    // Close Dropdown When Clicking Outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.profile-dropdown')) {
            profileDropdownContent.style.display = 'none';
            profileDropdownContent.classList.remove('active');
        }
    });

    // Keyboard Accessibility for Dropdown
    profileIcon.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const isVisible = profileDropdownContent.style.display === 'block';
            profileDropdownContent.style.display = isVisible ? 'none' : 'block';
            profileDropdownContent.classList.toggle('active', !isVisible);
        }
    });

    // Show Loading Spinner
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }

    // Show Notification Message
    function showMessage(type, text) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        setTimeout(() => messageDiv.textContent = '', 3000);
    }

    // Update User Status and Profile Icon
    function updateUserStatus(userData) {
        console.log("Updating user status with:", userData);
        if (userData?.email) {
            userStatus.innerHTML = `Logged in as: <span class="email-text">${userData.email}</span>`;
            const initials = userData.email.split('@')[0].substring(0, 2).toUpperCase();
            profileIcon.innerHTML = initials;
            profileIcon.classList.add('initials');
            profileInfo.style.display = 'block';
            userNameSpan.textContent = userData.name || 'User';
            userEmailSpan.textContent = userData.email;
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
        } else {
            userStatus.textContent = "Not logged in.";
            profileIcon.innerHTML = '<i class="fas fa-user"></i>';
            profileIcon.classList.remove('initials');
            profileInfo.style.display = 'none';
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
        }
    }

    // Check Initial Login State
    chrome.storage.local.get(['accessToken', 'userEmail', 'userName'], (data) => {
        console.log("Initial storage data:", data);
        updateUserStatus({ email: data.userEmail, name: data.userName });
    });

    // Handle Login
    loginButton.addEventListener('click', () => {
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'login' }, (response) => {
            showLoading(false);
            console.log("Login response:", response);
            if (response?.status === "success" && response?.email) {
                chrome.storage.local.set({ userEmail: response.email, userName: response.name }, () => {
                    updateUserStatus({ email: response.email, name: response.name });
                    showMessage("success", "Logged in successfully!");
                });
            } else {
                showMessage("error", response?.message || "Login failed.");
            }
        });
    });

    // Handle Logout
    logoutButton.addEventListener('click', () => {
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
            showLoading(false);
            console.log("Logout response:", response);
            if (response?.status === "success") {
                chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], () => {
                    console.log("Storage cleared in popup.");
                    updateUserStatus(null);
                    showMessage("success", "Logged out successfully!");
                });
            } else {
                console.error("Logout failed:", response?.message);
                chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], () => {
                    updateUserStatus(null);
                    showMessage("error", response?.message || "Logout failed, but UI reset.");
                });
            }
        });
    });

    // Handle Settings (Placeholder)
    settingsButton.addEventListener('click', () => {
        showMessage("info", "Settings feature coming soon!");
        profileDropdownContent.style.display = 'none';
        profileDropdownContent.classList.remove('active');
    });

    // Fetch Emails
    fetchEmailsButton.addEventListener('click', () => {
        showLoading(true);
        chrome.runtime.sendMessage({ action: 'fetchEmails' }, (response) => {
            showLoading(false);
            if (response?.emails) {
                emailList.innerHTML = '';
                response.emails.forEach(email => {
                    const emailItem = document.createElement('div');
                    emailItem.className = 'email-item';
                    emailItem.innerHTML = `<strong>${email.sender}</strong> - ${email.subject}<p>${email.snippet}</p>`;
                    emailItem.addEventListener('click', () => {
                        selectedEmail = email;
                        emailList.querySelectorAll('.email-item').forEach(item => item.classList.remove('selected'));
                        emailItem.classList.add('selected');
                    });
                    emailList.appendChild(emailItem);
                });
            } else {
                showMessage("error", response?.error || "Failed to fetch emails.");
            }
        });
    });

    // Generate Email
    generateEmailButton.addEventListener('click', () => {
        const prompt = promptInput.value;
        if (!prompt) {
            showMessage("error", "Please enter a prompt.");
            return;
        }

        showLoading(true);
        chrome.runtime.sendMessage({ action: 'generateEmail', prompt }, (response) => {
            showLoading(false);
            if (response?.emailDraft) {
                generatedEmailOutput.value = response.emailDraft;
                generatedEmailOutput.readOnly = true;
                isEditing = false;
                editEmailButton.textContent = "Edit Email";
            } else {
                showMessage("error", response?.error || "Failed to generate email.");
            }
        });
    });

    // Edit AI-Generated Email
    editEmailButton.addEventListener('click', () => {
        isEditing = !isEditing;
        generatedEmailOutput.readOnly = !isEditing;
        editEmailButton.textContent = isEditing ? "Lock Editing" : "Edit Email";
    });

    // Open Email Composer Modal
    sendGeneratedEmailButton.addEventListener('click', () => {
        if (!generatedEmailOutput.value) {
            showMessage("error", "No email content to send.");
            return;
        }
        recipientInput.value = '';
        subjectInput.value = '';
        messageInput.value = generatedEmailOutput.value;
        emailComposerModal.style.display = 'block';
    });

    // Close Email Composer Modal
    closeModal.addEventListener('click', () => {
        emailComposerModal.style.display = 'none';
    });

    // Close Modal When Clicking Outside
    window.addEventListener('click', (event) => {
        if (event.target === emailComposerModal) {
            emailComposerModal.style.display = 'none';
        }
    });

    // Basic Text Formatting (Bold and Italic)
    boldButton.addEventListener('click', () => {
        document.execCommand('bold', false, null);
        messageInput.focus();
    });

    italicButton.addEventListener('click', () => {
        document.execCommand('italic', false, null);
        messageInput.focus();
    });

    // Send Email from Composer
    sendEmailButton.addEventListener('click', () => {
        const recipient = recipientInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        if (!recipient || !subject || !message) {
            showMessage("error", "Please fill all fields.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipient)) {
            showMessage("error", "Invalid email address.");
            return;
        }

        if (confirm("Are you sure you want to send this email?")) {
            showLoading(true);
            chrome.runtime.sendMessage({ action: 'sendEmail', recipient, subject, message }, (response) => {
                showLoading(false);
                if (response?.status === "success") {
                    showMessage("success", response.message);
                    emailComposerModal.style.display = 'none';
                } else {
                    showMessage("error", response?.message || "Failed to send email.");
                }
            });
        }
    });

    // Save Draft (Placeholder)
    saveDraftButton.addEventListener('click', () => {
        const draft = {
            recipient: recipientInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageInput.value.trim()
        };
        chrome.storage.local.set({ draft }, () => {
            showMessage("success", "Draft saved!");
            emailComposerModal.style.display = 'none';
        });
    });
});