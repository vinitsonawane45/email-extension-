// // background.js

// async function saveToDatabase(collection, data) {
//     try {
//         const endpoint = collection === 'users' ? 'store-tokens' : collection;
//         const response = await fetch(`https://email-extension-production.up.railway.app/api/${endpoint}`, {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//             body: JSON.stringify(data)
//         });
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`Database save failed: ${response.status} - ${errorText}`);
//         }
//         return await response.json();
//     } catch (error) {
//         console.error('Database save error:', error);
//         return { status: 'error', message: error.message };
//     }
// }

// async function getFromDatabase(collection, query = {}) {
//     try {
//         const queryString = Object.keys(query).length ? `?${new URLSearchParams(query)}` : '';
//         const response = await fetch(`https://email-extension-production.up.railway.app/api/${collection}${queryString}`, {
//             headers: { 'Accept': 'application/json' }
//         });
//         if (!response.ok) throw new Error(`Database fetch failed: ${response.status} - ${await response.text()}`);
//         return await response.json();
//     } catch (error) {
//         console.error('Database fetch error:', error);
//         return { status: 'error', message: error.message };
//     }
// }

// async function storeTokens(email, accessToken, refreshToken, name) {
//     try {
//         const response = await fetch('https://email-extension-production.up.railway.app/api/store-tokens', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//             body: JSON.stringify({
//                 email,
//                 accessToken,
//                 refreshToken,
//                 name
//             })
//         });
//         const text = await response.text();
//         console.log('Raw response from store-tokens:', text);
//         const result = JSON.parse(text);
//         if (result.status !== 'success') {
//             throw new Error(result.error || 'Failed to store tokens');
//         }
//         console.log('Tokens stored in database successfully for:', email);
//     } catch (error) {
//         console.error('Error storing tokens:', error);
//         throw error;
//     }
// }

// async function getTokensFromDatabase(email) {
//     try {
//         const response = await fetch(`https://email-extension-production.up.railway.app/api/get-tokens?email=${encodeURIComponent(email)}`, {
//             headers: { 'Accept': 'application/json' }
//         });
//         const text = await response.text();
//         console.log('Raw response from get-tokens:', text);
//         const result = JSON.parse(text);
//         if (result.status !== 'success' || !result.accessToken || !result.refreshToken) {
//             throw new Error(result.error || 'No valid tokens found in database');
//         }
//         const tokens = {
//             accessToken: result.accessToken,
//             refreshToken: result.refreshToken,
//             userEmail: email
//         };
//         await browser.storage.local.set(tokens);
//         console.log('Tokens retrieved from database and stored locally:', { email, accessToken: tokens.accessToken.slice(0, 10) + '...' });
//         return tokens;
//     } catch (error) {
//         console.error('Error retrieving tokens from database:', error);
//         throw error;
//     }
// }

// async function login() {
//     const clientId = '640112157447-raibhokt2qao7bic81sjqqbutl7551bq.apps.googleusercontent.com';
//     const redirectUri = browser.identity.getRedirectURL();
//     const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email&access_type=offline&prompt=consent`;

//     return new Promise((resolve, reject) => {
//         browser.identity.launchWebAuthFlow({
//             url: authUrl,
//             interactive: true
//         }, async (responseUrl) => {
//             if (browser.runtime.lastError) {
//                 console.error('WebAuthFlow error:', browser.runtime.lastError);
//                 reject({ status: "error", message: "Login failed: " + browser.runtime.lastError.message });
//                 return;
//             }

//             if (!responseUrl) {
//                 console.error('No response URL from auth flow');
//                 reject({ status: "error", message: "Authorization failed: No response from Google" });
//                 return;
//             }

//             const urlParams = new URLSearchParams(responseUrl.split('?')[1]);
//             const authCode = urlParams.get('code');

//             if (!authCode) {
//                 console.error('No authorization code in response:', responseUrl);
//                 reject({ status: "error", message: "Authorization failed: No code received" });
//                 return;
//             }

//             try {
//                 console.log('Exchanging auth code for tokens...');
//                 const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
//                     method: 'POST',
//                     headers: { 
//                         'Content-Type': 'application/x-www-form-urlencoded',
//                         'Accept': 'application/json'
//                     },
//                     body: new URLSearchParams({
//                         code: authCode,
//                         client_id: clientId,
//                         client_secret: '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',
//                         redirect_uri: redirectUri,
//                         grant_type: 'authorization_code'
//                     })
//                 }).then(res => res.json());

//                 if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
//                     console.error('Token response missing required fields:', tokenResponse);
//                     reject({ status: "error", message: "Token exchange failed: Missing access or refresh token" });
//                     return;
//                 }

//                 console.log('Fetching user info with access token...');
//                 const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
//                     headers: { 
//                         'Authorization': `Bearer ${tokenResponse.access_token}`,
//                         'Accept': 'application/json'
//                     }
//                 }).then(res => res.json());

//                 if (!userInfoResponse.email) {
//                     console.error('User info response missing email:', userInfoResponse);
//                     reject({ status: "error", message: "Failed to get user info: No email received" });
//                     return;
//                 }

//                 const userData = {
//                     accessToken: tokenResponse.access_token,
//                     refreshToken: tokenResponse.refresh_token,
//                     userEmail: userInfoResponse.email,
//                     userName: userInfoResponse.name || userInfoResponse.given_name || 'User'
//                 };
//                 await browser.storage.local.set(userData);
//                 console.log('Tokens stored locally:', { email: userData.userEmail, accessToken: userData.accessToken.slice(0, 10) + '...' });

//                 await storeTokens(userData.userEmail, userData.accessToken, userData.refreshToken, userData.userName);

//                 const dbResponse = await saveToDatabase('users', {
//                     email: userInfoResponse.email,
//                     name: userInfoResponse.name || '',
//                     lastLogin: new Date().toISOString()
//                 });

//                 resolve({
//                     status: "success",
//                     email: userInfoResponse.email,
//                     name: userInfoResponse.name || 'User',
//                     userId: dbResponse.insertedId || dbResponse.user_id
//                 });
//             } catch (error) {
//                 console.error('Login error:', error);
//                 reject({ status: "error", message: `Login failed: ${error.message}` });
//             }
//         });
//     });
// }

// async function refreshAccessToken() {
//     const data = await browser.storage.local.get(['refreshToken', 'userEmail']);
//     if (!data.refreshToken || !data.userEmail) {
//         console.error('No refresh token or email found in local storage, attempting database fetch');
//         try {
//             return (await getTokensFromDatabase(data.userEmail)).accessToken;
//         } catch (error) {
//             throw new Error("No refresh token available. Please log in again.");
//         }
//     }

//     try {
//         console.log('Attempting to refresh access token...');
//         const response = await fetch('https://oauth2.googleapis.com/token', {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Accept': 'application/json'
//             },
//             body: new URLSearchParams({
//                 client_id: '640112157447-raibhokt2qao7bic81sjqqbutl7551bq.apps.googleusercontent.com',
//                 client_secret: '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',
//                 refresh_token: data.refreshToken,
//                 grant_type: 'refresh_token'
//             })
//         });
//         const tokenData = await response.json();

//         if (!tokenData.access_token) {
//             console.error('Refresh token response missing access token:', tokenData);
//             throw new Error("Failed to refresh token: " + (tokenData.error_description || "Unknown error"));
//         }

//         const updatedData = { accessToken: tokenData.access_token };
//         await browser.storage.local.set(updatedData);
//         await storeTokens(data.userEmail, tokenData.access_token, data.refreshToken, data.userName);
//         console.log('Access token refreshed and stored successfully');
//         return tokenData.access_token;
//     } catch (error) {
//         console.error('Refresh token error:', error);
//         throw error;
//     }
// }

// async function fetchWithRetry(url, options, retries = 3, delayBase = 1000) {
//     for (let i = 0; i < retries; i++) {
//         try {
//             const response = await fetch(url, options);
//             if (response.status === 401) {
//                 console.log(`401 detected on attempt ${i + 1}/${retries}, refreshing token...`);
//                 const errorText = await response.text();
//                 console.log(`401 response body: ${errorText}`);
//                 const newToken = await refreshAccessToken();
//                 options.headers['Authorization'] = `Bearer ${newToken}`;
//                 continue;
//             }
//             if (response.status === 500) {
//                 console.warn(`Server error (500) on attempt ${i + 1}/${retries}`);
//                 if (i === retries - 1) {
//                     const errorText = await response.text();
//                     throw new Error(`Persistent server error (500): ${errorText || 'Unknown server issue'}`);
//                 }
//                 await new Promise(resolve => setTimeout(resolve, delayBase * Math.pow(2, i)));
//                 continue;
//             }
//             if (!response.ok) {
//                 throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
//             }
//             return response;
//         } catch (error) {
//             console.error(`Fetch attempt ${i + 1} failed:`, error.message);
//             if (i === retries - 1) throw error;
//         }
//     }
//     throw new Error('All retry attempts failed');
// }

// async function checkAuthentication() {
//     let data = await browser.storage.local.get(['accessToken', 'refreshToken', 'userEmail']);
//     if (!data.accessToken || !data.refreshToken || !data.userEmail) {
//         console.warn('Tokens missing locally, attempting to fetch from database');
//         if (!data.userEmail) {
//             console.error('No user email available to fetch tokens');
//             throw new Error("Not authenticated. Please log in again.");
//         }
//         try {
//             data = await getTokensFromDatabase(data.userEmail);
//         } catch (error) {
//             console.error('Failed to retrieve tokens from database:', error);
//             throw new Error("Not authenticated. Please log in again.");
//         }
//     }
//     console.log('Authentication check passed:', { email: data.userEmail, accessToken: data.accessToken.slice(0, 10) + '...' });
//     return data;
// }

// async function fetchEmails() {
//     const data = await checkAuthentication();

//     try {
//         console.log('Fetching emails with tokens:', { accessToken: data.accessToken.slice(0, 10) + '...', refreshToken: data.refreshToken.slice(0, 10) + '...' });
//         const response = await fetchWithRetry('https://email-extension-production.up.railway.app/api/fetch-emails', {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${data.accessToken}`,
//                 'Refresh-Token': data.refreshToken,
//                 'Accept': 'application/json'
//             }
//         });

//         if (!response) {
//             throw new Error('No response received after retries');
//         }

//         const result = await response.json();
        
//         if (result.newAccessToken && result.newAccessToken !== data.accessToken) {
//             await browser.storage.local.set({ accessToken: result.newAccessToken });
//             await storeTokens(data.userEmail, result.newAccessToken, data.refreshToken, data.userName);
//             console.log('Updated access token from server response');
//         }

//         if (data.userEmail) {
//             const user = await getFromDatabase('users', { email: data.userEmail });
//             if (user.status === 'success' && user.data && user.data.length > 0) {
//                 const userId = user.data[0]._id || user.data[0].id;
//                 await saveToDatabase('emails', {
//                     user_id: userId,
//                     emails: result.emails,
//                     metadata: { 
//                         type: 'fetched', 
//                         count: result.emails.length,
//                         fetchedAt: new Date().toISOString()
//                     }
//                 });
//             }
//         }

//         console.log('Emails fetched successfully:', result.emails.length);
//         return result.emails;
//     } catch (error) {
//         console.error('Fetch emails error:', error);
//         if (error.message.includes('refresh the access token') || error.message.includes('invalid_grant')) {
//             console.log('Persistent authentication issue detected, clearing tokens');
//             await browser.storage.local.remove(['accessToken', 'refreshToken']);
//             throw new Error("Authentication credentials invalid. Please log in again.");
//         }
//         throw new Error(`Failed to fetch emails: ${error.message}`);
//     }
// }

// async function sendEmail(recipient, subject, message) {
//     const data = await checkAuthentication();

//     try {
//         console.log('Sending email with tokens:', { accessToken: data.accessToken.slice(0, 10) + '...', refreshToken: data.refreshToken.slice(0, 10) + '...' });
//         const response = await fetchWithRetry('https://email-extension-production.up.railway.app/api/send-email', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${data.accessToken}`,
//                 'Refresh-Token': data.refreshToken,
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//             body: JSON.stringify({ recipient, subject, message })
//         });

//         if (!response) {
//             throw new Error('No response received after retries');
//         }

//         const result = await response.json();

//         if (result.newAccessToken && result.newAccessToken !== data.accessToken) {
//             await browser.storage.local.set({ accessToken: result.newAccessToken });
//             await storeTokens(data.userEmail, result.newAccessToken, data.refreshToken, data.userName);
//             console.log('Updated access token from server response');
//         }

//         if (data.userEmail) {
//             const user = await getFromDatabase('users', { email: data.userEmail });
//             if (user.status === 'success' && user.data && user.data.length > 0) {
//                 const userId = user.data[0]._id || user.data[0].id;
//                 await saveToDatabase('emails', {
//                     user_id: userId,
//                     content: message,
//                     metadata: {
//                         type: 'sent',
//                         recipient: recipient,
//                         subject: subject,
//                         timestamp: new Date().toISOString()
//                     }
//                 });
//             }
//         }

//         console.log('Email sent successfully:', result.message_id);
//         return result;
//     } catch (error) {
//         console.error('Send email error:', error);
//         if (error.message.includes('refresh the access token') || error.message.includes('invalid_grant')) {
//             await browser.storage.local.remove(['accessToken', 'refreshToken']);
//             throw new Error("Authentication credentials invalid. Please log in again.");
//         }
//         throw new Error(`Failed to send email: ${error.message}`);
//     }
// }

// async function generateEmail(prompt) {
//     try {
//         console.log('Generating email with prompt:', prompt);
//         const response = await fetchWithRetry('https://email-extension-production.up.railway.app/api/generate-email', {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//             body: JSON.stringify({ prompt })
//         });

//         if (!response) {
//             throw new Error('No response received after retries');
//         }

//         const result = await response.json();
        
//         const userData = await checkAuthentication();
//         if (userData.userEmail) {
//             const user = await getFromDatabase('users', { email: userData.userEmail });
//             if (user.status === 'success' && user.data && user.data.length > 0) {
//                 const userId = user.data[0]._id || user.data[0].id;
//                 await saveToDatabase('emails', {
//                     user_id: userId,
//                     content: result.emailDraft,
//                     metadata: {
//                         type: 'generated',
//                         prompt: prompt,
//                         timestamp: new Date().toISOString()
//                     }
//                 });
//             }
//         }

//         console.log('Email generated successfully');
//         return result;
//     } catch (error) {
//         console.error('Generate email error:', error);
//         throw new Error(`Failed to generate email: ${error.message}`);
//     }
// }

// browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     const handlers = {
//         'login': () => login().then(sendResponse).catch(error => {
//             sendResponse({ status: "error", message: error.message });
//         }),
//         'logout': () => {
//             browser.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName']);
//             console.log('Logged out successfully');
//             sendResponse({ status: "success" });
//         },
//         'fetchEmails': () => fetchEmails().then(emails => {
//             sendResponse({ status: "success", emails });
//         }).catch(error => {
//             sendResponse({ status: "error", message: error.message });
//         }),
//         'generateEmail': () => generateEmail(request.prompt).then(result => {
//             sendResponse({ status: "success", ...result });
//         }).catch(error => {
//             sendResponse({ status: "error", message: error.message });
//         }),
//         'sendEmail': () => sendEmail(request.recipient, request.subject, request.message).then(result => {
//             sendResponse({ status: "success", ...result });
//         }).catch(error => {
//             sendResponse({ status: "error", message: error.message });
//         }),
//         'saveToDatabase': () => saveToDatabase(request.collection, request.data).then(result => {
//             sendResponse({ status: "success", ...result });
//         }).catch(error => {
//             sendResponse({ status: "error", message: error.message });
//         }),
//         'getFromDatabase': () => getFromDatabase(request.collection, request.query).then(result => {
//             sendResponse({ status: "success", ...result });
//         }).catch(error => {
//             sendResponse({ status: "error", message: error.message });
//         }),
//         'checkAuth': () => checkAuthentication().then(data => {
//             sendResponse({ status: "success", authenticated: true, email: data.userEmail });
//         }).catch(error => {
//             sendResponse({ status: "error", message: error.message, authenticated: false });
//         })
//     };

//     if (handlers[request.action]) {
//         handlers[request.action]();
//         return true; // Indicates async response
//     }

//     console.warn('Unknown action:', request.action);
//     return false;
// });

// console.log("AI Email Assistant background script loaded");

// browser.storage.local.get(['accessToken', 'refreshToken', 'userEmail'], (data) => {
//     console.log('Initial auth state:', {
//         accessToken: data.accessToken ? data.accessToken.slice(0, 10) + '...' : 'missing',
//         refreshToken: data.refreshToken ? data.refreshToken.slice(0, 10) + '...' : 'missing',
//         userEmail: data.userEmail || 'missing'
//     });
// });


// background.js

async function saveToDatabase(collection, data) {
    try {
        const endpoint = collection === 'users' ? 'store-tokens' : collection;
        const response = await fetch(`https://email-extension.onrender.com/api/${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Database save failed: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Database save error:', error);
        return { status: 'error', message: error.message };
    }
}

async function getFromDatabase(collection, query = {}) {
    try {
        const queryString = Object.keys(query).length ? `?${new URLSearchParams(query)}` : '';
        const response = await fetch(`https://email-extension.onrender.com/api/${collection}${queryString}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`Database fetch failed: ${response.status} - ${await response.text()}`);
        return await response.json();
    } catch (error) {
        console.error('Database fetch error:', error);
        return { status: 'error', message: error.message };
    }
}

async function storeTokens(email, accessToken, refreshToken, name) {
    try {
        const response = await fetch('https://email-extension.onrender.com/api/store-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email,
                accessToken,
                refreshToken,
                name
            })
        });
        const text = await response.text();
        console.log('Raw response from store-tokens:', text);
        const result = JSON.parse(text);
        if (result.status !== 'success') {
            throw new Error(result.error || 'Failed to store tokens');
        }
        console.log('Tokens stored in database successfully for:', email);
    } catch (error) {
        console.error('Error storing tokens:', error);
        throw error;
    }
}

async function getTokensFromDatabase(email) {
    try {
        const response = await fetch(`https://email-extension.onrender.com/api/get-tokens?email=${encodeURIComponent(email)}`, {
            headers: { 'Accept': 'application/json' }
        });
        const text = await response.text();
        console.log('Raw response from get-tokens:', text);
        const result = JSON.parse(text);
        if (result.status !== 'success' || !result.accessToken || !result.refreshToken) {
            throw new Error(result.error || 'No valid tokens found in database');
        }
        const tokens = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            userEmail: email
        };
        await browser.storage.local.set(tokens);
        console.log('Tokens retrieved from database and stored locally:', { email, accessToken: tokens.accessToken.slice(0, 10) + '...' });
        return tokens;
    } catch (error) {
        console.error('Error retrieving tokens from database:', error);
        throw error;
    }
}

async function login() {
    const clientId = '640112157447-raibhokt2qao7bic81sjqqbutl7551bq.apps.googleusercontent.com';
    const redirectUri = browser.identity.getRedirectURL();
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email&access_type=offline&prompt=consent`;

    return new Promise((resolve, reject) => {
        browser.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (responseUrl) => {
            if (browser.runtime.lastError) {
                console.error('WebAuthFlow error:', browser.runtime.lastError);
                reject({ status: "error", message: "Login failed: " + browser.runtime.lastError.message });
                return;
            }

            if (!responseUrl) {
                console.error('No response URL from auth flow');
                reject({ status: "error", message: "Authorization failed: No response from Google" });
                return;
            }

            const urlParams = new URLSearchParams(responseUrl.split('?')[1]);
            const authCode = urlParams.get('code');

            if (!authCode) {
                console.error('No authorization code in response:', responseUrl);
                reject({ status: "error", message: "Authorization failed: No code received" });
                return;
            }

            try {
                console.log('Exchanging auth code for tokens...');
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    body: new URLSearchParams({
                        code: authCode,
                        client_id: clientId,
                        client_secret: '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',
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code'
                    })
                }).then(res => res.json());

                if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
                    console.error('Token response missing required fields:', tokenResponse);
                    reject({ status: "error", message: "Token exchange failed: Missing access or refresh token" });
                    return;
                }

                console.log('Fetching user info with access token...');
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 
                        'Authorization': `Bearer ${tokenResponse.access_token}`,
                        'Accept': 'application/json'
                    }
                }).then(res => res.json());

                if (!userInfoResponse.email) {
                    console.error('User info response missing email:', userInfoResponse);
                    reject({ status: "error", message: "Failed to get user info: No email received" });
                    return;
                }

                const userData = {
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    userEmail: userInfoResponse.email,
                    userName: userInfoResponse.name || userInfoResponse.given_name || 'User'
                };
                await browser.storage.local.set(userData);
                console.log('Tokens stored locally:', { email: userData.userEmail, accessToken: userData.accessToken.slice(0, 10) + '...' });

                await storeTokens(userData.userEmail, userData.accessToken, userData.refreshToken, userData.userName);

                const dbResponse = await saveToDatabase('users', {
                    email: userInfoResponse.email,
                    name: userInfoResponse.name || '',
                    lastLogin: new Date().toISOString()
                });

                resolve({
                    status: "success",
                    email: userInfoResponse.email,
                    name: userInfoResponse.name || 'User',
                    userId: dbResponse.insertedId || dbResponse.user_id
                });
            } catch (error) {
                console.error('Login error:', error);
                reject({ status: "error", message: `Login failed: ${error.message}` });
            }
        });
    });
}

async function refreshAccessToken() {
    const data = await browser.storage.local.get(['refreshToken', 'userEmail']);
    if (!data.refreshToken || !data.userEmail) {
        console.error('No refresh token or email found in local storage, attempting database fetch');
        try {
            return (await getTokensFromDatabase(data.userEmail)).accessToken;
        } catch (error) {
            throw new Error("No refresh token available. Please log in again.");
        }
    }

    try {
        console.log('Attempting to refresh access token...');
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_id: '640112157447-raibhokt2qao7bic81sjqqbutl7551bq.apps.googleusercontent.com',
                client_secret: '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',
                refresh_token: data.refreshToken,
                grant_type: 'refresh_token'
            })
        });
        const tokenData = await response.json();

        if (!tokenData.access_token) {
            console.error('Refresh token response missing access token:', tokenData);
            throw new Error("Failed to refresh token: " + (tokenData.error_description || "Unknown error"));
        }

        const updatedData = { accessToken: tokenData.access_token };
        await browser.storage.local.set(updatedData);
        await storeTokens(data.userEmail, tokenData.access_token, data.refreshToken, data.userName);
        console.log('Access token refreshed and stored successfully');
        return tokenData.access_token;
    } catch (error) {
        console.error('Refresh token error:', error);
        throw error;
    }
}

async function fetchWithRetry(url, options, retries = 3, delayBase = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 401) {
                console.log(`401 detected on attempt ${i + 1}/${retries}, refreshing token...`);
                const errorText = await response.text();
                console.log(`401 response body: ${errorText}`);
                const newToken = await refreshAccessToken();
                options.headers['Authorization'] = `Bearer ${newToken}`;
                continue;
            }
            if (response.status === 500) {
                console.warn(`Server error (500) on attempt ${i + 1}/${retries}`);
                if (i === retries - 1) {
                    const errorText = await response.text();
                    throw new Error(`Persistent server error (500): ${errorText || 'Unknown server issue'}`);
                }
                await new Promise(resolve => setTimeout(resolve, delayBase * Math.pow(2, i)));
                continue;
            }
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
            }
            return response;
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
        }
    }
    throw new Error('All retry attempts failed');
}

async function checkAuthentication() {
    let data = await browser.storage.local.get(['accessToken', 'refreshToken', 'userEmail']);
    if (!data.accessToken || !data.refreshToken || !data.userEmail) {
        console.warn('Tokens missing locally, attempting to fetch from database');
        if (!data.userEmail) {
            console.error('No user email available to fetch tokens');
            throw new Error("Not authenticated. Please log in again.");
        }
        try {
            data = await getTokensFromDatabase(data.userEmail);
        } catch (error) {
            console.error('Failed to retrieve tokens from database:', error);
            throw new Error("Not authenticated. Please log in again.");
        }
    }
    console.log('Authentication check passed:', { email: data.userEmail, accessToken: data.accessToken.slice(0, 10) + '...' });
    return data;
}

async function fetchEmails() {
    const data = await checkAuthentication();

    try {
        console.log('Fetching emails with tokens:', { accessToken: data.accessToken.slice(0, 10) + '...', refreshToken: data.refreshToken.slice(0, 10) + '...' });
        const response = await fetchWithRetry('https://email-extension.onrender.com/api/fetch-emails', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${data.accessToken}`,
                'Refresh-Token': data.refreshToken,
                'Accept': 'application/json'
            }
        });

        if (!response) {
            throw new Error('No response received after retries');
        }

        const result = await response.json();
        
        if (result.newAccessToken && result.newAccessToken !== data.accessToken) {
            await browser.storage.local.set({ accessToken: result.newAccessToken });
            await storeTokens(data.userEmail, result.newAccessToken, data.refreshToken, data.userName);
            console.log('Updated access token from server response');
        }

        if (data.userEmail) {
            const user = await getFromDatabase('users', { email: data.userEmail });
            if (user.status === 'success' && user.data && user.data.length > 0) {
                const userId = user.data[0]._id || user.data[0].id;
                await saveToDatabase('emails', {
                    user_id: userId,
                    emails: result.emails,
                    metadata: { 
                        type: 'fetched', 
                        count: result.emails.length,
                        fetchedAt: new Date().toISOString()
                    }
                });
            }
        }

        console.log('Emails fetched successfully:', result.emails.length);
        return result.emails;
    } catch (error) {
        console.error('Fetch emails error:', error);
        if (error.message.includes('refresh the access token') || error.message.includes('invalid_grant')) {
            console.log('Persistent authentication issue detected, clearing tokens');
            await browser.storage.local.remove(['accessToken', 'refreshToken']);
            throw new Error("Authentication credentials invalid. Please log in again.");
        }
        throw new Error(`Failed to fetch emails: ${error.message}`);
    }
}

async function sendEmail(recipient, subject, message) {
    const data = await checkAuthentication();

    try {
        console.log('Sending email with tokens:', { accessToken: data.accessToken.slice(0, 10) + '...', refreshToken: data.refreshToken.slice(0, 10) + '...' });
        const response = await fetchWithRetry('https://email-extension.onrender.com/api/send-email', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${data.accessToken}`,
                'Refresh-Token': data.refreshToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ recipient, subject, message })
        });

        if (!response) {
            throw new Error('No response received after retries');
        }

        const result = await response.json();

        if (result.newAccessToken && result.newAccessToken !== data.accessToken) {
            await browser.storage.local.set({ accessToken: result.newAccessToken });
            await storeTokens(data.userEmail, result.newAccessToken, data.refreshToken, data.userName);
            console.log('Updated access token from server response');
        }

        if (data.userEmail) {
            const user = await getFromDatabase('users', { email: data.userEmail });
            if (user.status === 'success' && user.data && user.data.length > 0) {
                const userId = user.data[0]._id || user.data[0].id;
                await saveToDatabase('emails', {
                    user_id: userId,
                    content: message,
                    metadata: {
                        type: 'sent',
                        recipient: recipient,
                        subject: subject,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }

        console.log('Email sent successfully:', result.message_id);
        return result;
    } catch (error) {
        console.error('Send email error:', error);
        if (error.message.includes('refresh the access token') || error.message.includes('invalid_grant')) {
            await browser.storage.local.remove(['accessToken', 'refreshToken']);
            throw new Error("Authentication credentials invalid. Please log in again.");
        }
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

async function generateEmail(prompt) {
    try {
        console.log('Generating email with prompt:', prompt);
        const response = await fetchWithRetry('https://email-extension.onrender.com/api/generate-email', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        if (!response) {
            throw new Error('No response received after retries');
        }

        const result = await response.json();
        
        const userData = await checkAuthentication();
        if (userData.userEmail) {
            const user = await getFromDatabase('users', { email: userData.userEmail });
            if (user.status === 'success' && user.data && user.data.length > 0) {
                const userId = user.data[0]._id || user.data[0].id;
                await saveToDatabase('emails', {
                    user_id: userId,
                    content: result.emailDraft,
                    metadata: {
                        type: 'generated',
                        prompt: prompt,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }

        console.log('Email generated successfully');
        return result;
    } catch (error) {
        console.error('Generate email error:', error);
        throw new Error(`Failed to generate email: ${error.message}`);
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handlers = {
        'login': () => login().then(sendResponse).catch(error => {
            sendResponse({ status: "error", message: error.message });
        }),
        'logout': () => {
            browser.storage.local.remove(['accessToken', 'refreshToken', 'userEmail', 'userName']);
            console.log('Logged out successfully');
            sendResponse({ status: "success" });
        },
        'fetchEmails': () => fetchEmails().then(emails => {
            sendResponse({ status: "success", emails });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        }),
        'generateEmail': () => generateEmail(request.prompt).then(result => {
            sendResponse({ status: "success", ...result });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        }),
        'sendEmail': () => sendEmail(request.recipient, request.subject, request.message).then(result => {
            sendResponse({ status: "success", ...result });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        }),
        'saveToDatabase': () => saveToDatabase(request.collection, request.data).then(result => {
            sendResponse({ status: "success", ...result });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        }),
        'getFromDatabase': () => getFromDatabase(request.collection, request.query).then(result => {
            sendResponse({ status: "success", ...result });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message });
        }),
        'checkAuth': () => checkAuthentication().then(data => {
            sendResponse({ status: "success", authenticated: true, email: data.userEmail });
        }).catch(error => {
            sendResponse({ status: "error", message: error.message, authenticated: false });
        })
    };

    if (handlers[request.action]) {
        handlers[request.action]();
        return true; // Indicates async response
    }

    console.warn('Unknown action:', request.action);
    return false;
});

console.log("AI Email Assistant background script loaded");

browser.storage.local.get(['accessToken', 'refreshToken', 'userEmail'], (data) => {
    console.log('Initial auth state:', {
        accessToken: data.accessToken ? data.accessToken.slice(0, 10) + '...' : 'missing',
        refreshToken: data.refreshToken ? data.refreshToken.slice(0, 10) + '...' : 'missing',
        userEmail: data.userEmail || 'missing'
    });
});
