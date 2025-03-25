// Function to initiate Google OAuth 2.0 login (With Refresh Token Support)
async function login() {
    const clientId = '640112157447-raibhokt2qao7bic81sjqqbutl7551bq.apps.googleusercontent.com';
    const clientSecret = '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';
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email&access_type=offline&prompt=consent`;

    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
            if (chrome.runtime.lastError) {
                console.error("Login failed:", chrome.runtime.lastError.message);
                reject({ status: "error", message: "Login failed! You must approve access." });
                return;
            }

            console.log("Response URL:", responseUrl);
            const urlParams = new URLSearchParams(responseUrl.split('?')[1]);
            const authCode = urlParams.get('code');

            if (authCode) {
                console.log("Authorization code received:", authCode);
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        code: authCode,
                        client_id: clientId,
                        client_secret: clientSecret,
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code'
                    })
                }).then(res => res.json());

                console.log("Token Response:", tokenResponse);
                if (tokenResponse.access_token) {
                    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
                    }).then(res => res.json());

                    console.log("User Info Response:", userInfoResponse);
                    if (userInfoResponse.email) {
                        chrome.storage.local.set({
                            accessToken: tokenResponse.access_token,
                            refreshToken: tokenResponse.refresh_token,
                            userEmail: userInfoResponse.email,
                            userName: userInfoResponse.name || userInfoResponse.given_name || 'User'
                        }, () => {
                            console.log("Tokens and user info stored.");
                            resolve({
                                status: "success",
                                email: userInfoResponse.email,
                                name: userInfoResponse.name || userInfoResponse.given_name || 'User'
                            });
                        });
                    } else {
                        reject({ status: "error", message: "Failed to fetch user info." });
                    }
                } else {
                    console.error("Failed to get access token:", tokenResponse);
                    reject({ status: "error", message: "Failed to get access token." });
                }
            } else {
                console.error("Failed to extract authorization code.");
                reject({ status: "error", message: "Authorization failed. Please try logging in again." });
            }
        });
    });
}

// Function to refresh the access token
function refreshAccessToken(refreshToken) {
    return new Promise((resolve, reject) => {
        if (!refreshToken) {
            reject("No refresh token available. Please log in again.");
            return;
        }

        fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: '640112157447-raibhokt2qao7bic81sjqqbutl7551bq.apps.googleusercontent.com',
                client_secret: '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',
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                chrome.storage.local.set({ accessToken: data.access_token }, () => {
                    console.log("Access token refreshed.");
                    resolve(data.access_token);
                });
            } else {
                reject("Failed to refresh access token.");
            }
        })
        .catch(error => reject(error));
    });
}

// Fetch Emails
function fetchEmails() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['accessToken', 'refreshToken'], (data) => {
            if (!data.accessToken || !data.refreshToken) {
                reject("No access token or refresh token available. Please log in again.");
                return;
            }

            fetch('http://localhost:5000/fetch-emails', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.accessToken}`,
                    'Refresh-Token': data.refreshToken,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            })
            .then(response => {
                if (response.status === 401) {
                    return refreshAccessToken(data.refreshToken)
                        .then(newAccessToken => fetchEmails())
                        .catch(err => Promise.reject("Failed to refresh token: " + err));
                } else if (!response.ok) {
                    return Promise.reject("Error fetching emails: " + response.status);
                } else {
                    return response.json();
                }
            })
            .then(data => resolve(data.emails))
            .catch(error => reject(error));
        });
    });
}

// Function to send an email (Updated to handle formatted text if backend supports it)
function sendEmail(recipient, subject, message) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['accessToken', 'refreshToken'], (data) => {
            if (!data.accessToken || !data.refreshToken) {
                reject("No access token or refresh token available. Please log in again.");
                return;
            }

            fetch('http://localhost:5000/send-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${data.accessToken}`,
                    'Refresh-Token': data.refreshToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipient, subject, message }),
                mode: 'cors'
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    resolve("Email sent successfully!");
                } else if (data.newAccessToken) {
                    chrome.storage.local.set({ accessToken: data.newAccessToken }, () => {
                        sendEmail(recipient, subject, message).then(resolve).catch(reject);
                    });
                } else {
                    reject(data.message || "Failed to send email.");
                }
            })
            .catch(error => reject(error));
        });
    });
}

// Function to send AI feature requests to Flask backend
function sendAIRequest(action, data) {
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:5000/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            mode: 'cors'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data);
            }
        })
        .catch(error => reject(error));
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'login') {
        login()
            .then(response => sendResponse(response))
            .catch(error => sendResponse(error));
        return true;
    } else if (request.action === 'logout') {
        console.log("Logout request received.");
        chrome.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName'], () => {
            if (chrome.runtime.lastError) {
                console.error("Error clearing storage:", chrome.runtime.lastError);
                sendResponse({ status: "error", message: "Failed to clear storage: " + chrome.runtime.lastError.message });
            } else {
                console.log("User logged out, storage cleared.");
                sendResponse({ status: "success", message: "Logged out successfully" });
            }
        });
        return true;
    } else if (request.action === 'fetchEmails') {
        fetchEmails()
            .then(emails => sendResponse({ emails }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true;
    } else if (request.action === 'generateEmail') {
        sendAIRequest('generate-email', { prompt: request.prompt })
            .then(response => sendResponse({ emailDraft: response.emailDraft }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true;
    } else if (request.action === 'summarizeEmail') {
        sendAIRequest('summarize-email', { emailBody: request.emailBody })
            .then(response => sendResponse({ summary: response.summary }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true;
    } else if (request.action === 'categorizeEmail') {
        sendAIRequest('categorize-email', { emailBody: request.emailBody })
            .then(response => sendResponse({ category: response.category }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true;
    } else if (request.action === 'smartReply') {
        sendAIRequest('smart-reply', { emailBody: request.emailBody })
            .then(response => sendResponse({ smartReply: response.smartReply }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true;
    } else if (request.action === 'sendEmail') {
        sendEmail(request.recipient, request.subject, request.message)
            .then(response => sendResponse({ status: "success", message: response }))
            .catch(error => sendResponse({ status: "error", message: error.toString() }));
        return true;
    }
});

