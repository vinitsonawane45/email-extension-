# import asyncio
# import aiohttp
# import logging
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from google.oauth2.credentials import Credentials
# from google.auth.transport.requests import Request
# from googleapiclient.discovery import build
# from googleapiclient.http import BatchHttpRequest
# import base64
# from dotenv import load_dotenv
# import os
# from cachetools import TTLCache

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Load environment variables
# load_dotenv()

# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for testing; restrict in production
# # CORS(app, origins=["moz-extension://*", "http://localhost:5000", "http://127.0.0.1:5000"])

# # Google API Credentials
# CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
# CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# TOKEN_URI = "https://oauth2.googleapis.com/token"

# # Ollama AI API Endpoint
# OLLAMA_API_URL = "http://localhost:11434/api/generate"

# # Caches: emails (5 min TTL), AI responses (10 min TTL)
# email_cache = TTLCache(maxsize=128, ttl=300)  # 5 minutes
# ai_cache = TTLCache(maxsize=256, ttl=600)    # 10 minutes

# # Function to refresh expired access tokens
# def get_credentials(access_token, refresh_token):
#     try:
#         creds = Credentials(
#             token=access_token,
#             refresh_token=refresh_token,
#             token_uri=TOKEN_URI,
#             client_id=CLIENT_ID,
#             client_secret=CLIENT_SECRET
#         )
#         if creds.expired and creds.refresh_token:
#             creds.refresh(Request())
#             logger.info("✅ Access token refreshed")
#         return creds, creds.token
#     except Exception as e:
#         logger.error(f"Error refreshing credentials: {e}")
#         raise

# # Fetch Emails from Gmail API with Batch Processing
# async def fetch_emails(access_token, refresh_token):
#     cache_key = (access_token, refresh_token)
#     if cache_key in email_cache:
#         logger.info("Returning cached emails")
#         return email_cache[cache_key]

#     try:
#         creds, new_access_token = get_credentials(access_token, refresh_token)
#         service = build('gmail', 'v1', credentials=creds)
#         results = service.users().messages().list(userId='me', maxResults=10).execute()
#         messages = results.get('messages', [])

#         emails = []
#         batch = BatchHttpRequest()

#         def handle_response(request_id, response, exception):
#             if exception is None:
#                 headers = response.get('payload', {}).get('headers', [])
#                 sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), "Unknown")
#                 subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), "No Subject")
#                 emails.append({"id": request_id, "sender": sender, "subject": subject, "snippet": response.get('snippet', "")[:100]})
#             else:
#                 logger.error(f"Batch request failed for message {request_id}: {exception}")

#         for message in messages:
#             batch.add(service.users().messages().get(userId='me', id=message['id'], format='metadata', metadataHeaders=['From', 'Subject']), callback=handle_response)

#         batch._batch_uri = "https://www.googleapis.com/batch/gmail/v1"
#         loop = asyncio.get_running_loop()
#         await loop.run_in_executor(None, batch.execute)
#         email_cache[cache_key] = (emails, new_access_token)
#         logger.info("Emails fetched successfully")
#         return emails, new_access_token
#     except Exception as e:
#         logger.error(f"Error fetching emails: {e}")
#         raise

# # AI-Powered Email Generation
# async def generate_email(prompt):
#     if prompt in ai_cache:
#         logger.info("Returning cached email draft")
#         return ai_cache[prompt]
#     try:
#         async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
#             data = {"model": "mistral", "prompt": f"You are a professional AI assistant. Write a detailed email based on this:\n\n{prompt}", "stream": False}
#             async with session.post(OLLAMA_API_URL, json=data) as response:
#                 result = (await response.json()).get("response") if response.status == 200 else "Failed to generate email."
#                 ai_cache[prompt] = result
#                 logger.info("Email generated successfully")
#                 return result
#     except Exception as e:
#         logger.error(f"Error generating email: {e}")
#         raise

# # AI Email Summarization
# async def summarize_email(email_body):
#     if email_body in ai_cache:
#         logger.info("Returning cached summary")
#         return ai_cache[email_body]
#     try:
#         async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
#             data = {"model": "mistral", "prompt": f"Summarize this email in a short and clear way:\n\n{email_body}", "stream": False}
#             async with session.post(OLLAMA_API_URL, json=data) as response:
#                 result = (await response.json()).get("response") if response.status == 200 else "Failed to summarize email."
#                 ai_cache[email_body] = result
#                 logger.info("Email summarized successfully")
#                 return result
#     except Exception as e:
#         logger.error(f"Error summarizing email: {e}")
#         raise

# # AI Email Categorization
# async def categorize_email(email_body):
#     if email_body in ai_cache:
#         logger.info("Returning cached category")
#         return ai_cache[email_body]
#     try:
#         async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
#             data = {"model": "mistral", "prompt": f"Classify this email into Work, Personal, Spam, or Important:\n\n{email_body}", "stream": False}
#             async with session.post(OLLAMA_API_URL, json=data) as response:
#                 result = (await response.json()).get("response").strip() if response.status == 200 else "Failed to categorize email."
#                 ai_cache[email_body] = result
#                 logger.info("Email categorized successfully")
#                 return result
#     except Exception as e:
#         logger.error(f"Error categorizing email: {e}")
#         raise

# # AI Smart Reply
# async def smart_reply(email_body):
#     if email_body in ai_cache:
#         logger.info("Returning cached smart reply")
#         return ai_cache[email_body]
#     try:
#         async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
#             data = {"model": "mistral", "prompt": f"Generate a professional reply to this email:\n\n{email_body}", "stream": False}
#             async with session.post(OLLAMA_API_URL, json=data) as response:
#                 result = (await response.json()).get("response") if response.status == 200 else "Failed to generate smart reply."
#                 ai_cache[email_body] = result
#                 logger.info("Smart reply generated successfully")
#                 return result
#     except Exception as e:
#         logger.error(f"Error generating smart reply: {e}")
#         raise

# # Send an email using Gmail API
# async def send_email(access_token, refresh_token, recipient, subject, message):
#     try:
#         creds, new_access_token = get_credentials(access_token, refresh_token)
#         service = build('gmail', 'v1', credentials=creds)

#         email_msg = f"To: {recipient}\r\nSubject: {subject}\r\n\r\n{message}"
#         encoded_msg = base64.urlsafe_b64encode(email_msg.encode("utf-8")).decode("utf-8")

#         loop = asyncio.get_running_loop()
#         send_request = await loop.run_in_executor(None, service.users().messages().send(
#             userId="me",
#             body={"raw": encoded_msg}
#         ).execute)

#         logger.info("Email sent successfully")
#         return send_request.get("id"), new_access_token
#     except Exception as e:
#         logger.error(f"Error sending email: {e}")
#         raise

# # API Endpoints
# @app.route('/fetch-emails', methods=['GET'])
# async def fetch_emails_endpoint():
#     access_token = request.headers.get('Authorization')
#     refresh_token = request.headers.get('Refresh-Token')

#     if not access_token or not refresh_token:
#         return jsonify({"error": "Missing access token or refresh token"}), 401

#     try:
#         emails, new_access_token = await fetch_emails(access_token, refresh_token)
#         return jsonify({"emails": emails, "newAccessToken": new_access_token})
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

# @app.route('/generate-email', methods=['POST'])
# async def generate_email_endpoint():
#     data = request.get_json(silent=True)
#     if not data or 'prompt' not in data:
#         return jsonify({"error": "Prompt is required"}), 400
#     prompt = data['prompt']
#     try:
#         email_draft = await generate_email(prompt)
#         return jsonify({"emailDraft": email_draft})
#     except Exception as e:
#         return jsonify({"error": f"Failed to generate email: {str(e)}"}), 500

# @app.route('/summarize-email', methods=['POST'])
# async def summarize_email_endpoint():
#     data = request.get_json(silent=True)
#     if not data or 'emailBody' not in data:
#         return jsonify({"error": "Email body is required"}), 400
#     email_body = data['emailBody']
#     try:
#         summary = await summarize_email(email_body)
#         return jsonify({"summary": summary})
#     except Exception as e:
#         return jsonify({"error": f"Failed to summarize email: {str(e)}"}), 500

# @app.route('/categorize-email', methods=['POST'])
# async def categorize_email_endpoint():
#     data = request.get_json(silent=True)
#     if not data or 'emailBody' not in data:
#         return jsonify({"error": "Email body is required"}), 400
#     email_body = data['emailBody']
#     try:
#         category = await categorize_email(email_body)
#         return jsonify({"category": category})
#     except Exception as e:
#         return jsonify({"error": f"Failed to categorize email: {str(e)}"}), 500

# @app.route('/smart-reply', methods=['POST'])
# async def smart_reply_endpoint():
#     data = request.get_json(silent=True)
#     if not data or 'emailBody' not in data:
#         return jsonify({"error": "Email body is required"}), 400
#     email_body = data['emailBody']
#     try:
#         smart_reply_text = await smart_reply(email_body)
#         return jsonify({"smartReply": smart_reply_text})
#     except Exception as e:
#         return jsonify({"error": f"Failed to generate smart reply: {str(e)}"}), 500

# @app.route('/send-email', methods=['POST'])
# async def send_email_endpoint():
#     access_token = request.headers.get('Authorization')
#     refresh_token = request.headers.get('Refresh-Token')

#     if not access_token or not refresh_token:
#         return jsonify({"error": "Missing access token or refresh token"}), 401

#     data = request.get_json(silent=True)
#     if not data or not all(k in data for k in ['recipient', 'subject', 'message']):
#         return jsonify({"error": "Missing fields"}), 400

#     recipient = data['recipient']
#     subject = data['subject']
#     message = data['message']

#     try:
#         email_id, new_access_token = await send_email(access_token, refresh_token, recipient, subject, message)
#         return jsonify({"status": "success", "message_id": email_id, "newAccessToken": new_access_token})
#     except Exception as e:
#         return jsonify({"error": f"Failed to send email: {str(e)}"}), 500

# # Main entry point for async server
# # async def main():
# #     from hypercorn.config import Config
# #     from hypercorn.asyncio import serve
# #     config = Config()
# #     config.bind = ["127.0.0.1:5000"]
# #     config.workers = 1  # Single worker to simplify loop management
# #     await serve(app, config)

# # if __name__ == '__main__':
# #     asyncio.run(main())

# async def main():
#     from hypercorn.config import Config
#     from hypercorn.asyncio import serve
#     import os

#     config = Config()
#     port = os.environ.get("PORT", "5000")  # Use Railway-assigned port
#     config.bind = [f"0.0.0.0:{port}"]
#     config.workers = 1  # Single worker to simplify loop management

#     await serve(app, config)

# if __name__ == '__main__':
#     import asyncio
#     asyncio.run(main())


import asyncio
import aiohttp
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import base64
from dotenv import load_dotenv
import os
from cachetools import TTLCache
from functools import wraps
from pymongo import MongoClient
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["moz-extension://*", "https://email-extension-production.up.railway.app", "http://localhost:*"]}})

# Environment Variables
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
TOKEN_URI = "https://oauth2.googleapis.com/token"
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "https://ollama-production-e78b.up.railway.app")
MONGO_URI_RAW = os.getenv("MONGO_URI", "mongodb://mongo:CZRyLpoTQNPPeQpcoMPyjYwNIoBmCdbi@shinkansen.proxy.rlwy.net:14794")
# Clean up MONGO_URI if it contains mongosh or quotes
MONGO_URI = MONGO_URI_RAW.replace('mongosh', '').replace('"', '').strip()
DB_NAME = "ai_email_agent"
EMAIL_CACHE_TTL = int(os.getenv("EMAIL_CACHE_TTL", 60))
AI_CACHE_TTL = int(os.getenv("AI_CACHE_TTL", 300))

# Database Configuration
try:
    logger.info(f"Attempting to connect to MongoDB with URI: {MONGO_URI}")
    if not MONGO_URI.startswith("mongodb://") and not MONGO_URI.startswith("mongodb+srv://"):
        raise ValueError(f"Invalid MONGO_URI after cleanup: '{MONGO_URI}' must start with 'mongodb://' or 'mongodb+srv://'")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    users_collection = db.users
    emails_collection = db.emails
    templates_collection = db.templates
    client.server_info()  # Test connection
    logger.info("Connected to MongoDB successfully at {}".format(MONGO_URI))
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}", exc_info=True)
    raise

# Caches
email_cache = TTLCache(maxsize=128, ttl=EMAIL_CACHE_TTL)
ai_cache = TTLCache(maxsize=256, ttl=AI_CACHE_TTL)

# Helper Functions
def get_credentials(access_token, refresh_token):
    try:
        if not all([access_token, refresh_token, TOKEN_URI, CLIENT_ID, CLIENT_SECRET]):
            missing = [k for k, v in {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_uri': TOKEN_URI,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET
            }.items() if not v]
            logger.error(f"Missing credential fields: {missing}")
            raise ValueError(f"Missing required credential fields: {missing}")

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri=TOKEN_URI,
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET
        )
        
        if creds.expired and creds.refresh_token:
            logger.debug("Access token expired, refreshing...")
            creds.refresh(Request())
            logger.info("Access token refreshed successfully")
            access_token = creds.token
            user = users_collection.find_one({"email": {"$exists": True}, "refreshToken": refresh_token})
            if user:
                users_collection.update_one(
                    {"email": user['email']},
                    {"$set": {"accessToken": access_token, "updated_at": datetime.now(timezone.utc)}}
                )
                logger.info(f"Updated access token in database for {user['email']}")
        
        service = build('gmail', 'v1', credentials=creds)
        service.users().getProfile(userId='me').execute()
        return creds, access_token
    except Exception as e:
        logger.error(f"Credential error: {str(e)}", exc_info=True)
        raise Exception(f"Authentication failed: {str(e)}")

def async_route(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return asyncio.run(func(*args, **kwargs))
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    return wrapper

async def fetch_emails(access_token, refresh_token):
    try:
        creds, new_access_token = get_credentials(access_token, refresh_token)
        service = build('gmail', 'v1', credentials=creds)
        
        logger.debug("Fetching Gmail messages")
        results = service.users().messages().list(
            userId='me',
            maxResults=10,
            labelIds=['INBOX']
        ).execute()
        
        messages = results.get('messages', [])
        emails = []
        
        for message in messages:
            msg = service.users().messages().get(
                userId='me',
                id=message['id'],
                format='metadata',
                metadataHeaders=['From', 'Subject', 'Date']
            ).execute()
            
            headers = {h['name']: h['value'] for h in msg['payload']['headers']}
            email_data = {
                'id': message['id'],
                'from': headers.get('From', ''),
                'subject': headers.get('Subject', ''),
                'date': headers.get('Date', ''),
                'snippet': msg.get('snippet', '')
            }
            try:
                email_data['category'] = await categorize_email(email_data['snippet'])
                email_data['summary'] = await summarize_email(email_data['snippet'])
            except Exception as e:
                logger.warning(f"AI features unavailable: {str(e)}. Proceeding without categorization/summary.")
                email_data['category'] = 'Other'
                email_data['summary'] = email_data['snippet'][:100] + '...'
            emails.append(email_data)
            save_email_to_db(email_data)
        
        logger.info(f"Fetched {len(emails)} emails successfully")
        return emails, new_access_token
    
    except Exception as e:
        logger.error(f"Failed to fetch emails: {str(e)}", exc_info=True)
        raise

def save_email_to_db(email_data):
    try:
        existing_email = emails_collection.find_one({'id': email_data['id']})
        if not existing_email:
            email_data['created_at'] = datetime.now(timezone.utc)
            email_data['updated_at'] = datetime.now(timezone.utc)
            emails_collection.insert_one(email_data)
    except Exception as e:
        logger.error(f"Failed to save email to DB: {str(e)}")

async def generate_email(prompt):
    cache_key = f"generate_{hash(prompt)}"
    if cache_key in ai_cache:
        return ai_cache[cache_key]
    
    try:
        async with aiohttp.ClientSession() as session:
            # Check available models first
            logger.debug(f"Checking available models at {OLLAMA_API_URL}/api/tags")
            async with session.get(f"{OLLAMA_API_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as model_response:
                if model_response.status != 200:
                    raise Exception(f"Failed to fetch models: {model_response.status} {await model_response.text()}")
                models_data = await model_response.json()
                available_models = [model["name"] for model in models_data.get("models", [])]
                required_model = "mistral"
                if required_model not in available_models:
                    raise Exception(f"Required model '{required_model}' not found in available models: {available_models}")

            # Proceed with generation
            payload = {
                "model": required_model,
                "prompt": f"Generate a professional email about: {prompt}",
                "stream": False
            }
            logger.debug(f"Sending request to Ollama at {OLLAMA_API_URL}")
            async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                response_text = await response.text()
                if response.status != 200:
                    raise Exception(f"AI API returned {response.status}: {response_text}")
                result = await response.json()
                response_text = result.get("response", "Could not generate email content")
                ai_cache[cache_key] = response_text
                logger.info("Email generated successfully")
                return response_text
    except Exception as e:
        error_msg = f"Failed to generate email: {str(e)}"
        logger.error(error_msg, exc_info=True)
        # Fallback to a basic response if Ollama fails
        fallback_response = f"Subject: {prompt}\n\nDear [Recipient],\n\nI am writing regarding {prompt.lower()}. Please let me know if you need further details.\n\nBest regards,\n[Your Name]"
        ai_cache[cache_key] = fallback_response
        return fallback_response

async def summarize_email(email_body):
    cache_key = f"summarize_{hash(email_body)}"
    if cache_key in ai_cache:
        return ai_cache[cache_key]
    
    try:
        async with aiohttp.ClientSession() as session:
            # Check available models
            logger.debug(f"Checking available models at {OLLAMA_API_URL}/api/tags")
            async with session.get(f"{OLLAMA_API_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as model_response:
                if model_response.status != 200:
                    raise Exception(f"Failed to fetch models: {model_response.status} {await model_response.text()}")
                models_data = await model_response.json()
                available_models = [model["name"] for model in models_data.get("models", [])]
                required_model = "mistral"
                if required_model not in available_models:
                    raise Exception(f"Required model '{required_model}' not found in available models: {available_models}")

            payload = {
                "model": required_model,
                "prompt": f"Summarize this email in 2-3 sentences: {email_body}",
                "stream": False
            }
            async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                response_text = await response.text()
                if response.status != 200:
                    raise Exception(f"AI API returned {response.status}: {response_text}")
                result = await response.json()
                summary = result.get("response", "Could not summarize email")
                ai_cache[cache_key] = summary
                return summary
    except Exception as e:
        logger.error(f"Failed to summarize email: {str(e)}")
        raise

async def categorize_email(email_body):
    cache_key = f"categorize_{hash(email_body)}"
    if cache_key in ai_cache:
        return ai_cache[cache_key]
    
    try:
        async with aiohttp.ClientSession() as session:
            # Check available models
            logger.debug(f"Checking available models at {OLLAMA_API_URL}/api/tags")
            async with session.get(f"{OLLAMA_API_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as model_response:
                if model_response.status != 200:
                    raise Exception(f"Failed to fetch models: {model_response.status} {await model_response.text()}")
                models_data = await model_response.json()
                available_models = [model["name"] for model in models_data.get("models", [])]
                required_model = "mistral"
                if required_model not in available_models:
                    raise Exception(f"Required model '{required_model}' not found in available models: {available_models}")

            payload = {
                "model": required_model,
                "prompt": f"Categorize this email into one of these categories: [Work, Personal, Newsletter, Spam, Other]. Just respond with the category name: {email_body}",
                "stream": False
            }
            async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                response_text = await response.text()
                if response.status != 200:
                    raise Exception(f"AI API returned {response.status}: {response_text}")
                result = await response.json()
                category = result.get("response", "Other").strip()
                ai_cache[cache_key] = category
                return category
    except Exception as e:
        logger.error(f"Failed to categorize email: {str(e)}")
        raise

async def send_email(access_token, refresh_token, recipient, subject, message):
    try:
        creds, new_access_token = get_credentials(access_token, refresh_token)
        service = build('gmail', 'v1', credentials=creds)
        
        email_msg = f"To: {recipient}\nSubject: {subject}\n\n{message}"
        message_bytes = email_msg.encode('utf-8')
        base64_bytes = base64.urlsafe_b64encode(message_bytes)
        base64_message = base64_bytes.decode('utf-8')
        
        sent_msg = service.users().messages().send(
            userId='me',
            body={'raw': base64_message}
        ).execute()
        
        save_sent_email_to_db(recipient, subject, message)
        return sent_msg['id'], new_access_token
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise

def save_sent_email_to_db(recipient, subject, message):
    try:
        email_data = {
            'type': 'sent',
            'recipient': recipient,
            'subject': subject,
            'message': message,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        emails_collection.insert_one(email_data)
    except Exception as e:
        logger.error(f"Failed to save sent email to DB: {str(e)}")

# Routes
@app.route('/api/store-tokens', methods=['POST'])
def store_tokens():
    data = request.get_json()
    if not data or not all(k in data for k in ['email', 'accessToken', 'refreshToken']):
        logger.error("Missing required fields in store-tokens request")
        return jsonify({"error": "Missing required fields: email, accessToken, refreshToken"}), 400
    
    try:
        email = data['email']
        user_data = {
            "email": email,
            "accessToken": data['accessToken'],
            "refreshToken": data['refreshToken'],
            "name": data.get('name', ''),
            "lastLogin": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = users_collection.update_one(
            {"email": email},
            {"$set": user_data},
            upsert=True
        )
        logger.info(f"Tokens stored/updated for {email}: {result.modified_count} modified, {result.upserted_id}")
        return jsonify({"status": "success", "message": "Tokens stored successfully"})
    except Exception as e:
        logger.error(f"Failed to store tokens: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to store tokens: {str(e)}"}), 500

@app.route('/api/get-tokens', methods=['GET'])
def get_tokens():
    email = request.args.get('email')
    if not email:
        logger.error("Missing email parameter in get-tokens request")
        return jsonify({"error": "Missing email parameter"}), 400
    
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"No user found with email: {email}")
            return jsonify({"error": "User not found"}), 404
        logger.info(f"Retrieved tokens for {email}")
        return jsonify({
            "status": "success",
            "accessToken": user.get("accessToken"),
            "refreshToken": user.get("refreshToken")
        })
    except Exception as e:
        logger.error(f"Failed to retrieve tokens: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to retrieve tokens: {str(e)}"}), 500

@app.route('/api/fetch-emails', methods=['GET'])
@async_route
async def fetch_emails_endpoint():
    auth_header = request.headers.get('Authorization')
    refresh_token = request.headers.get('Refresh-Token')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.error("Missing or invalid Authorization header")
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
    access_token = auth_header.split('Bearer ')[1].strip()
    if not refresh_token:
        logger.error("Missing Refresh-Token header")
        return jsonify({"error": "Missing Refresh-Token header"}), 401
    
    try:
        emails, new_access_token = await fetch_emails(access_token, refresh_token)
        return jsonify({
            "status": "success",
            "emails": emails,
            "newAccessToken": new_access_token
        })
    except Exception as e:
        logger.error(f"Fetch emails failed: {str(e)}", exc_info=True)
        if "Authentication failed" in str(e):
            return jsonify({"error": str(e)}), 401
        return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

@app.route('/api/generate-email', methods=['POST'])
@async_route
async def generate_email_endpoint():
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Prompt is required"}), 400
    
    try:
        email_draft = await generate_email(data['prompt'])
        return jsonify({
            "status": "success",
            "emailDraft": email_draft
        })
    except Exception as e:
        logger.error(f"Generate email endpoint failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to generate email: {str(e)}"}), 500

@app.route('/api/send-email', methods=['POST'])
@async_route
async def send_email_endpoint():
    auth_header = request.headers.get('Authorization')
    refresh_token = request.headers.get('Refresh-Token')
    data = request.get_json()

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    access_token = auth_header.split('Bearer ')[1].strip()
    if not refresh_token:
        return jsonify({"error": "Missing Refresh-Token header"}), 401
    if not data or not all(k in data for k in ['recipient', 'subject', 'message']):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        email_id, new_access_token = await send_email(
            access_token, refresh_token,
            data['recipient'], data['subject'], data['message']
        )
        return jsonify({
            "status": "success",
            "message_id": email_id,
            "newAccessToken": new_access_token
        })
    except Exception as e:
        logger.error(f"Send email failed: {str(e)}")
        if "Authentication failed" in str(e):
            return jsonify({"error": str(e)}), 401
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    logger.error(f"404 error: {request.path}")
    return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ('true', '1', 't')
    app.run(host="0.0.0.0", port=port, debug=debug)
