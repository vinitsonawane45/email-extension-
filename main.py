# import asyncio
# import aiohttp
# import logging
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from google.oauth2.credentials import Credentials
# from google.auth.transport.requests import Request
# from googleapiclient.discovery import build
# import base64
# from dotenv import load_dotenv
# import os
# from cachetools import TTLCache
# from functools import wraps
# from pymongo import MongoClient
# from datetime import datetime, timezone

# # Configure logging
# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# # Load environment variables
# load_dotenv()

# app = Flask(__name__)
# CORS(app, resources={r"/api/*": {"origins": ["moz-extension://*", "https://email-extension.onrender.com", "http://localhost:*"]}})

# # Environment Variables
# CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
# CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# TOKEN_URI = "https://oauth2.googleapis.com/token"
# OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "https://ollama.onrender.com")
# MONGO_URI_RAW = os.getenv("MONGO_URI", "mongodb+srv://vinitsonawane76:VPeMCZGJOKEmtgbM@cluster0.on6kpbz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
# # Clean up MONGO_URI if it contains mongosh or quotes
# MONGO_URI = MONGO_URI_RAW.replace('mongosh', '').replace('"', '').strip()
# DB_NAME = "ai_email_agent"
# EMAIL_CACHE_TTL = int(os.getenv("EMAIL_CACHE_TTL", 60))
# AI_CACHE_TTL = int(os.getenv("AI_CACHE_TTL", 300))

# # Database Configuration
# try:
#     logger.info(f"Attempting to connect to MongoDB with URI: {MONGO_URI}")
#     if not MONGO_URI.startswith("mongodb://") and not MONGO_URI.startswith("mongodb+srv://"):
#         raise ValueError(f"Invalid MONGO_URI after cleanup: '{MONGO_URI}' must start with 'mongodb://' or 'mongodb+srv://'")
#     client = MongoClient(MONGO_URI)
#     db = client[DB_NAME]
#     users_collection = db.users
#     emails_collection = db.emails
#     templates_collection = db.templates
#     client.server_info()  # Test connection
#     logger.info("Connected to MongoDB successfully at {}".format(MONGO_URI))
# except Exception as e:
#     logger.error(f"Failed to connect to MongoDB: {str(e)}", exc_info=True)
#     raise

# # Caches
# email_cache = TTLCache(maxsize=128, ttl=EMAIL_CACHE_TTL)
# ai_cache = TTLCache(maxsize=256, ttl=AI_CACHE_TTL)

# # Helper Functions
# def get_credentials(access_token, refresh_token):
#     try:
#         if not all([access_token, refresh_token, TOKEN_URI, CLIENT_ID, CLIENT_SECRET]):
#             missing = [k for k, v in {
#                 'access_token': access_token,
#                 'refresh_token': refresh_token,
#                 'token_uri': TOKEN_URI,
#                 'client_id': CLIENT_ID,
#                 'client_secret': CLIENT_SECRET
#             }.items() if not v]
#             logger.error(f"Missing credential fields: {missing}")
#             raise ValueError(f"Missing required credential fields: {missing}")

#         creds = Credentials(
#             token=access_token,
#             refresh_token=refresh_token,
#             token_uri=TOKEN_URI,
#             client_id=CLIENT_ID,
#             client_secret=CLIENT_SECRET
#         )
        
#         if creds.expired and creds.refresh_token:
#             logger.debug("Access token expired, refreshing...")
#             creds.refresh(Request())
#             logger.info("Access token refreshed successfully")
#             access_token = creds.token
#             user = users_collection.find_one({"email": {"$exists": True}, "refreshToken": refresh_token})
#             if user:
#                 users_collection.update_one(
#                     {"email": user['email']},
#                     {"$set": {"accessToken": access_token, "updated_at": datetime.now(timezone.utc)}}
#                 )
#                 logger.info(f"Updated access token in database for {user['email']}")
        
#         service = build('gmail', 'v1', credentials=creds)
#         service.users().getProfile(userId='me').execute()
#         return creds, access_token
#     except Exception as e:
#         logger.error(f"Credential error: {str(e)}", exc_info=True)
#         raise Exception(f"Authentication failed: {str(e)}")

# def async_route(func):
#     @wraps(func)
#     def wrapper(*args, **kwargs):
#         try:
#             return asyncio.run(func(*args, **kwargs))
#         except Exception as e:
#             logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
#             return jsonify({"error": f"Internal server error: {str(e)}"}), 500
#     return wrapper

# async def fetch_emails(access_token, refresh_token):
#     try:
#         creds, new_access_token = get_credentials(access_token, refresh_token)
#         service = build('gmail', 'v1', credentials=creds)
        
#         logger.debug("Fetching Gmail messages")
#         results = service.users().messages().list(
#             userId='me',
#             maxResults=10,
#             labelIds=['INBOX']
#         ).execute()
        
#         messages = results.get('messages', [])
#         emails = []
        
#         for message in messages:
#             msg = service.users().messages().get(
#                 userId='me',
#                 id=message['id'],
#                 format='metadata',
#                 metadataHeaders=['From', 'Subject', 'Date']
#             ).execute()
            
#             headers = {h['name']: h['value'] for h in msg['payload']['headers']}
#             email_data = {
#                 'id': message['id'],
#                 'from': headers.get('From', ''),
#                 'subject': headers.get('Subject', ''),
#                 'date': headers.get('Date', ''),
#                 'snippet': msg.get('snippet', '')
#             }
#             try:
#                 email_data['category'] = await categorize_email(email_data['snippet'])
#                 email_data['summary'] = await summarize_email(email_data['snippet'])
#             except Exception as e:
#                 logger.warning(f"AI features unavailable: {str(e)}. Proceeding without categorization/summary.")
#                 email_data['category'] = 'Other'
#                 email_data['summary'] = email_data['snippet'][:100] + '...'
#             emails.append(email_data)
#             save_email_to_db(email_data)
        
#         logger.info(f"Fetched {len(emails)} emails successfully")
#         return emails, new_access_token
    
#     except Exception as e:
#         logger.error(f"Failed to fetch emails: {str(e)}", exc_info=True)
#         raise

# def save_email_to_db(email_data):
#     try:
#         existing_email = emails_collection.find_one({'id': email_data['id']})
#         if not existing_email:
#             email_data['created_at'] = datetime.now(timezone.utc)
#             email_data['updated_at'] = datetime.now(timezone.utc)
#             emails_collection.insert_one(email_data)
#     except Exception as e:
#         logger.error(f"Failed to save email to DB: {str(e)}")

# async def generate_email(prompt):
#     cache_key = f"generate_{hash(prompt)}"
#     if cache_key in ai_cache:
#         return ai_cache[cache_key]
    
#     try:
#         async with aiohttp.ClientSession() as session:
#             # Check available models first
#             logger.debug(f"Checking available models at {OLLAMA_API_URL}/api/tags")
#             async with session.get(f"{OLLAMA_API_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as model_response:
#                 if model_response.status != 200:
#                     raise Exception(f"Failed to fetch models: {model_response.status} {await model_response.text()}")
#                 models_data = await model_response.json()
#                 available_models = [model["name"] for model in models_data.get("models", [])]
#                 required_model = "mistral"
#                 if required_model not in available_models:
#                     raise Exception(f"Required model '{required_model}' not found in available models: {available_models}")

#             # Improved prompt for professional email generation
#             payload = {
#                 "model": required_model,
#                 "prompt": (
#                     f"Generate a professional email with a clear subject line and body based on the following request: '{prompt}'. "
#                     f"Include a formal greeting (e.g., 'Dear [Recipient]'), a concise and polite message tailored to the context, "
#                     f"and a professional closing (e.g., 'Best regards, [Your Name]'). Ensure the tone is appropriate for a business setting, "
#                     f"and format the email with 'Subject:' followed by the subject line, then the body on new lines."
#                 ),
#                 "stream": False
#             }
#             logger.debug(f"Sending request to Ollama at {OLLAMA_API_URL}")
#             async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
#                 response_text = await response.text()
#                 if response.status != 200:
#                     raise Exception(f"AI API returned {response.status}: {response_text}")
#                 result = await response.json()
#                 response_text = result.get("response", "Could not generate email content")
#                 ai_cache[cache_key] = response_text
#                 logger.info("Email generated successfully")
#                 return response_text
#     except Exception as e:
#         error_msg = f"Failed to generate email: {str(e)}"
#         logger.error(error_msg, exc_info=True)
#         # Improved fallback response
#         fallback_response = (
#             f"Subject: Regarding {prompt}\n\n"
#             f"Dear [Recipient],\n\n"
#             f"I hope this message finds you well. I am writing to discuss {prompt.lower()}. "
#             f"Please feel free to reach out if you require additional information or clarification.\n\n"
#             f"Best regards,\n[Your Name]"
#         )
#         ai_cache[cache_key] = fallback_response
#         return fallback_response

# async def summarize_email(email_body):
#     cache_key = f"summarize_{hash(email_body)}"
#     if cache_key in ai_cache:
#         return ai_cache[cache_key]
    
#     try:
#         async with aiohttp.ClientSession() as session:
#             # Check available models
#             logger.debug(f"Checking available models at {OLLAMA_API_URL}/api/tags")
#             async with session.get(f"{OLLAMA_API_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as model_response:
#                 if model_response.status != 200:
#                     raise Exception(f"Failed to fetch models: {model_response.status} {await model_response.text()}")
#                 models_data = await model_response.json()
#                 available_models = [model["name"] for model in models_data.get("models", [])]
#                 required_model = "mistral"
#                 if required_model not in available_models:
#                     raise Exception(f"Required model '{required_model}' not found in available models: {available_models}")

#             payload = {
#                 "model": required_model,
#                 "prompt": f"Summarize this email in 2-3 sentences: {email_body}",
#                 "stream": False
#             }
#             async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
#                 response_text = await response.text()
#                 if response.status != 200:
#                     raise Exception(f"AI API returned {response.status}: {response_text}")
#                 result = await response.json()
#                 summary = result.get("response", "Could not summarize email")
#                 ai_cache[cache_key] = summary
#                 return summary
#     except Exception as e:
#         logger.error(f"Failed to summarize email: {str(e)}")
#         raise

# async def categorize_email(email_body):
#     cache_key = f"categorize_{hash(email_body)}"
#     if cache_key in ai_cache:
#         return ai_cache[cache_key]
    
#     try:
#         async with aiohttp.ClientSession() as session:
#             # Check available models
#             logger.debug(f"Checking available models at {OLLAMA_API_URL}/api/tags")
#             async with session.get(f"{OLLAMA_API_URL}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as model_response:
#                 if model_response.status != 200:
#                     raise Exception(f"Failed to fetch models: {model_response.status} {await model_response.text()}")
#                 models_data = await model_response.json()
#                 available_models = [model["name"] for model in models_data.get("models", [])]
#                 required_model = "mistral"
#                 if required_model not in available_models:
#                     raise Exception(f"Required model '{required_model}' not found in available models: {available_models}")

#             payload = {
#                 "model": required_model,
#                 "prompt": f"Categorize this email into one of these categories: [Work, Personal, Newsletter, Spam, Other]. Just respond with the category name: {email_body}",
#                 "stream": False
#             }
#             async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
#                 response_text = await response.text()
#                 if response.status != 200:
#                     raise Exception(f"AI API returned {response.status}: {response_text}")
#                 result = await response.json()
#                 category = result.get("response", "Other").strip()
#                 ai_cache[cache_key] = category
#                 return category
#     except Exception as e:
#         logger.error(f"Failed to categorize email: {str(e)}")
#         raise

# async def send_email(access_token, refresh_token, recipient, subject, message):
#     try:
#         creds, new_access_token = get_credentials(access_token, refresh_token)
#         service = build('gmail', 'v1', credentials=creds)
        
#         email_msg = f"To: {recipient}\nSubject: {subject}\n\n{message}"
#         message_bytes = email_msg.encode('utf-8')
#         base64_bytes = base64.urlsafe_b64encode(message_bytes)
#         base64_message = base64_bytes.decode('utf-8')
        
#         sent_msg = service.users().messages().send(
#             userId='me',
#             body={'raw': base64_message}
#         ).execute()
        
#         save_sent_email_to_db(recipient, subject, message)
#         return sent_msg['id'], new_access_token
#     except Exception as e:
#         logger.error(f"Failed to send email: {str(e)}")
#         raise

# def save_sent_email_to_db(recipient, subject, message):
#     try:
#         email_data = {
#             'type': 'sent',
#             'recipient': recipient,
#             'subject': subject,
#             'message': message,
#             'created_at': datetime.now(timezone.utc),
#             'updated_at': datetime.now(timezone.utc)
#         }
#         emails_collection.insert_one(email_data)
#     except Exception as e:
#         logger.error(f"Failed to save sent email to DB: {str(e)}")

# # Routes
# @app.route('/api/store-tokens', methods=['POST'])
# def store_tokens():
#     data = request.get_json()
#     if not data or not all(k in data for k in ['email', 'accessToken', 'refreshToken']):
#         logger.error("Missing required fields in store-tokens request")
#         return jsonify({"error": "Missing required fields: email, accessToken, refreshToken"}), 400
    
#     try:
#         email = data['email']
#         user_data = {
#             "email": email,
#             "accessToken": data['accessToken'],
#             "refreshToken": data['refreshToken'],
#             "name": data.get('name', ''),
#             "lastLogin": datetime.now(timezone.utc),
#             "updated_at": datetime.now(timezone.utc)
#         }
#         result = users_collection.update_one(
#             {"email": email},
#             {"$set": user_data},
#             upsert=True
#         )
#         logger.info(f"Tokens stored/updated for {email}: {result.modified_count} modified, {result.upserted_id}")
#         return jsonify({"status": "success", "message": "Tokens stored successfully"})
#     except Exception as e:
#         logger.error(f"Failed to store tokens: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Failed to store tokens: {str(e)}"}), 500

# @app.route('/api/get-tokens', methods=['GET'])
# def get_tokens():
#     email = request.args.get('email')
#     if not email:
#         logger.error("Missing email parameter in get-tokens request")
#         return jsonify({"error": "Missing email parameter"}), 400
    
#     try:
#         user = users_collection.find_one({"email": email})
#         if not user:
#             logger.warning(f"No user found with email: {email}")
#             return jsonify({"error": "User not found"}), 404
#         logger.info(f"Retrieved tokens for {email}")
#         return jsonify({
#             "status": "success",
#             "accessToken": user.get("accessToken"),
#             "refreshToken": user.get("refreshToken")
#         })
#     except Exception as e:
#         logger.error(f"Failed to retrieve tokens: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Failed to retrieve tokens: {str(e)}"}), 500

# @app.route('/api/fetch-emails', methods=['GET'])
# @async_route
# async def fetch_emails_endpoint():
#     auth_header = request.headers.get('Authorization')
#     refresh_token = request.headers.get('Refresh-Token')
    
#     if not auth_header or not auth_header.startswith('Bearer '):
#         logger.error("Missing or invalid Authorization header")
#         return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
#     access_token = auth_header.split('Bearer ')[1].strip()
#     if not refresh_token:
#         logger.error("Missing Refresh-Token header")
#         return jsonify({"error": "Missing Refresh-Token header"}), 401
    
#     try:
#         emails, new_access_token = await fetch_emails(access_token, refresh_token)
#         return jsonify({
#             "status": "success",
#             "emails": emails,
#             "newAccessToken": new_access_token
#         })
#     except Exception as e:
#         logger.error(f"Fetch emails failed: {str(e)}", exc_info=True)
#         if "Authentication failed" in str(e):
#             return jsonify({"error": str(e)}), 401
#         return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

# @app.route('/api/generate-email', methods=['POST'])
# @async_route
# async def generate_email_endpoint():
#     data = request.get_json()
#     if not data or 'prompt' not in data:
#         return jsonify({"error": "Prompt is required"}), 400
    
#     try:
#         email_draft = await generate_email(data['prompt'])
#         return jsonify({
#             "status": "success",
#             "emailDraft": email_draft
#         })
#     except Exception as e:
#         logger.error(f"Generate email endpoint failed: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Failed to generate email: {str(e)}"}), 500

# @app.route('/api/send-email', methods=['POST'])
# @async_route
# async def send_email_endpoint():
#     auth_header = request.headers.get('Authorization')
#     refresh_token = request.headers.get('Refresh-Token')
#     data = request.get_json()

#     if not auth_header or not auth_header.startswith('Bearer '):
#         return jsonify({"error": "Missing or invalid Authorization header"}), 401
#     access_token = auth_header.split('Bearer ')[1].strip()
#     if not refresh_token:
#         return jsonify({"error": "Missing Refresh-Token header"}), 401
#     if not data or not all(k in data for k in ['recipient', 'subject', 'message']):
#         return jsonify({"error": "Missing required fields"}), 400

#     try:
#         email_id, new_access_token = await send_email(
#             access_token, refresh_token,
#             data['recipient'], data['subject'], data['message']
#         )
#         return jsonify({
#             "status": "success",
#             "message_id": email_id,
#             "newAccessToken": new_access_token
#         })
#     except Exception as e:
#         logger.error(f"Send email failed: {str(e)}")
#         if "Authentication failed" in str(e):
#             return jsonify({"error": str(e)}), 401
#         return jsonify({"error": f"Failed to send email: {str(e)}"}), 500

# @app.errorhandler(404)
# def not_found(error):
#     logger.error(f"404 error: {request.path}")
#     return jsonify({"error": "Not found"}), 404

# if __name__ == '__main__':
#     port = int(os.environ.get("PORT", 5000))
#     debug = os.getenv("FLASK_DEBUG", "False").lower() in ('true', '1', 't')
#     app.run(host="0.0.0.0", port=port, debug=debug)



# import asyncio
# import aiohttp
# import logging
# from flask import Flask, request, jsonify, make_response
# from flask_cors import CORS
# from google.oauth2.credentials import Credentials
# from google.auth.transport.requests import Request
# from googleapiclient.discovery import build
# import base64
# from dotenv import load_dotenv
# import os
# from cachetools import TTLCache
# from functools import wraps
# from pymongo import MongoClient
# from datetime import datetime, timezone

# # Configure logging
# logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# # Load environment variables
# load_dotenv()

# app = Flask(__name__)

# # Configure CORS
# CORS(app, resources={
#     r"/api/*": {
#         "origins": [
#             "moz-extension://*",
#             "chrome-extension://*",
#             "https://email-extension.onrender.com",
#             "http://localhost:*"
#         ],
#         "methods": ["GET", "POST", "OPTIONS"],
#         "allow_headers": ["Authorization", "Refresh-Token", "Content-Type"]
#     }
# })

# # Environment Variables
# CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
# CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# TOKEN_URI = "https://oauth2.googleapis.com/token"
# OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama-on-render.onrender.com")
# HF_API_TOKEN = os.getenv("HF_API_TOKEN")
# HF_API_URL = "https://api-inference.huggingface.co/models/gpt2"
# MONGO_URI = os.getenv("MONGO_URI")
# DB_NAME = "ai_email_agent"
# EMAIL_CACHE_TTL = int(os.getenv("EMAIL_CACHE_TTL", 60))
# AI_CACHE_TTL = int(os.getenv("AI_CACHE_TTL", 300))

# # Database Configuration (optional fallback)
# mongo_connected = False
# try:
#     if not MONGO_URI:
#         logger.warning("MONGO_URI not set, running without database")
#     else:
#         logger.info("Connecting to MongoDB...")
#         client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
#         db = client[DB_NAME]
#         users_collection = db.users
#         emails_collection = db.emails
#         templates_collection = db.templates
#         client.server_info()  # Test connection
#         mongo_connected = True
#         logger.info("Connected to MongoDB successfully")
# except Exception as e:
#     logger.error(f"Failed to connect to MongoDB: {str(e)}", exc_info=True)
#     logger.warning("Continuing without MongoDB functionality")

# # Caches
# email_cache = TTLCache(maxsize=128, ttl=EMAIL_CACHE_TTL)
# ai_cache = TTLCache(maxsize=256, ttl=AI_CACHE_TTL)

# # Middleware to ensure CORS headers on all responses
# @app.after_request
# def add_cors_headers(response):
#     origin = request.headers.get('Origin')
#     allowed_origins = [
#         "moz-extension://*",
#         "chrome-extension://*",
#         "https://email-extension.onrender.com",
#         "http://localhost"
#     ]
#     if any(origin and origin.startswith(o.replace('*', '')) for o in allowed_origins):
#         response.headers['Access-Control-Allow-Origin'] = origin
#     response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
#     response.headers['Access-Control-Allow-Headers'] = 'Authorization, Refresh-Token, Content-Type'
#     response.headers['Access-Control-Max-Age'] = '86400'
#     logger.debug(f"Added CORS headers for origin: {origin}")
#     return response

# # Handle preflight OPTIONS requests
# @app.route('/api/<path:path>', methods=['OPTIONS'])
# def handle_options(path):
#     response = make_response()
#     origin = request.headers.get('Origin', '*')
#     response.headers['Access-Control-Allow-Origin'] = origin
#     response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
#     response.headers['Access-Control-Allow-Headers'] = 'Authorization, Refresh-Token, Content-Type'
#     response.headers['Access-Control-Max-Age'] = '86400'
#     logger.debug(f"Handled OPTIONS request for {path} with origin {origin}")
#     return response, 200

# # Root health check for Render
# @app.route('/', methods=['GET', 'HEAD'])
# def root_health_check():
#     logger.info("Root health check requested")
#     return jsonify({"status": "ok", "message": "Server is alive", "mongo_connected": mongo_connected}), 200

# # API health check endpoint
# @app.route('/api/health', methods=['GET'])
# def health_check():
#     logger.info("API health check requested")
#     return jsonify({"status": "ok", "message": "Server is running", "mongo_connected": mongo_connected}), 200

# # Helper Functions
# def get_credentials(access_token, refresh_token):
#     try:
#         if not all([access_token, refresh_token, TOKEN_URI, CLIENT_ID, CLIENT_SECRET]):
#             missing = [k for k, v in {'access_token': access_token, 'refresh_token': refresh_token, 'token_uri': TOKEN_URI, 'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET}.items() if not v]
#             logger.error(f"Missing credential fields: {missing}")
#             raise ValueError(f"Missing required credential fields: {missing}")
#         creds = Credentials(token=access_token, refresh_token=refresh_token, token_uri=TOKEN_URI, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
#         if creds.expired and creds.refresh_token:
#             logger.debug("Access token expired, refreshing...")
#             creds.refresh(Request())
#             access_token = creds.token
#             if mongo_connected:
#                 user = users_collection.find_one({"refreshToken": refresh_token})
#                 if user:
#                     users_collection.update_one({"email": user['email']}, {"$set": {"accessToken": access_token, "updated_at": datetime.now(timezone.utc)}})
#                     logger.info(f"Updated access token for {user['email']}")
#         service = build('gmail', 'v1', credentials=creds)
#         service.users().getProfile(userId='me').execute()
#         return creds, access_token
#     except Exception as e:
#         logger.error(f"Credential error: {str(e)}", exc_info=True)
#         raise Exception(f"Authentication failed: {str(e)}")

# def async_route(func):
#     @wraps(func)
#     def wrapper(*args, **kwargs):
#         try:
#             return asyncio.run(func(*args, **kwargs))
#         except Exception as e:
#             logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
#             return jsonify({"error": f"Internal server error: {str(e)}"}), 500
#     return wrapper

# async def fetch_emails(access_token, refresh_token):
#     try:
#         creds, new_access_token = get_credentials(access_token, refresh_token)
#         service = build('gmail', 'v1', credentials=creds)
#         logger.debug("Fetching Gmail messages")
#         results = service.users().messages().list(userId='me', maxResults=10, labelIds=['INBOX']).execute()
#         messages = results.get('messages', [])
#         emails = []
#         for message in messages:
#             msg = service.users().messages().get(userId='me', id=message['id'], format='metadata', metadataHeaders=['From', 'Subject', 'Date']).execute()
#             headers = {h['name']: h['value'] for h in msg['payload']['headers']}
#             email_data = {
#                 'id': message['id'], 'from': headers.get('From', ''), 'subject': headers.get('Subject', ''),
#                 'date': headers.get('Date', ''), 'snippet': msg.get('snippet', '')
#             }
#             emails.append(email_data)
#             if mongo_connected:
#                 save_email_to_db(email_data)
#         logger.info(f"Fetched {len(emails)} emails")
#         return emails, new_access_token
#     except Exception as e:
#         logger.error(f"Failed to fetch emails: {str(e)}", exc_info=True)
#         raise

# def save_email_to_db(email_data):
#     try:
#         if not emails_collection.find_one({'id': email_data['id']}):
#             email_data.update({'created_at': datetime.now(timezone.utc), 'updated_at': datetime.now(timezone.utc)})
#             emails_collection.insert_one(email_data)
#             logger.debug(f"Saved email {email_data['id']} to DB")
#     except Exception as e:
#         logger.error(f"Failed to save email to DB: {str(e)}")

# async def generate_email(prompt):
#     cache_key = f"generate_{hash(prompt)}"
#     if cache_key in ai_cache:
#         logger.debug("Returning cached email generation")
#         return ai_cache[cache_key]

#     async with aiohttp.ClientSession() as session:
#         try:
#             payload = {
#                 "model": "gemma:2b",
#                 "prompt": f"Write a professional email to invite a colleague to a meeting next week. Start with 'Subject: {prompt.capitalize()}', followed by 'Dear [Recipient],', a concise body about the meeting, and end with 'Best regards,\n[Your Name]'. Use plain text with line breaks.",
#                 "stream": False,
#                 "temperature": 0.7,
#                 "max_tokens": 300
#             }
#             generate_url = f"{OLLAMA_BASE_URL}/api/generate"
#             logger.debug(f"Sending request to Ollama at {generate_url}")
#             async with session.post(generate_url, json=payload, timeout=aiohttp.ClientTimeout(total=30)) as response:
#                 if response.status != 200:
#                     logger.warning(f"Ollama failed with status {response.status}: {await response.text()}")
#                     return await generate_email_with_hf(prompt, session)
#                 result = await response.json()
#                 logger.debug(f"Ollama response: {result}")
#                 generated_email = result.get("response", "").strip()
#                 if not generated_email:
#                     logger.warning("Ollama returned empty response")
#                     return await generate_email_with_hf(prompt, session)
#                 # Validate email structure and relevance
#                 if not all(keyword in generated_email for keyword in ["Subject:", "Dear", "Best regards"]) or prompt.lower() not in generated_email.lower():
#                     logger.warning(f"Ollama returned improperly formatted or irrelevant email: {generated_email}")
#                     return await generate_email_with_hf(prompt, session)
#                 ai_cache[cache_key] = generated_email
#                 logger.info("Email generated successfully with Ollama")
#                 return generated_email
#         except Exception as e:
#             logger.error(f"Ollama failed: {str(e)}", exc_info=True)
#             return await generate_email_with_hf(prompt, session)

# async def generate_email_with_hf(prompt, session):
#     if not HF_API_TOKEN:
#         logger.error("Hugging Face API token not provided")
#         raise Exception("Hugging Face API token not provided")

#     cache_key = f"generate_hf_{hash(prompt)}"
#     if cache_key in ai_cache:
#         logger.debug("Returning cached Hugging Face email generation")
#         return ai_cache[cache_key]

#     try:
#         payload = {
#             "inputs": f"Write a professional email to invite a colleague to a meeting next week. Start with 'Subject: {prompt.capitalize()}', followed by 'Dear [Recipient],', a concise body about the meeting, and end with 'Best regards,\n[Your Name]'. Use plain text with line breaks.",
#             "parameters": {
#                 "max_length": 300,
#                 "temperature": 0.7,
#                 "top_p": 0.9,
#                 "do_sample": True
#             }
#         }
#         headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json"}
#         logger.debug(f"Sending request to Hugging Face at {HF_API_URL}")
#         async with session.post(HF_API_URL, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as response:
#             if response.status != 200:
#                 logger.error(f"Hugging Face failed with status {response.status}: {await response.text()}")
#                 raise Exception(f"Hugging Face API failed with status {response.status}")
#             result = await response.json()
#             logger.debug(f"Hugging Face response: {result}")
#             generated_email = result[0].get("generated_text", "").strip() if isinstance(result, list) and result else ""
#             if not generated_email:
#                 logger.error("Hugging Face returned empty response")
#                 raise Exception("Hugging Face returned empty response")
            
#             # Strip prompt and validate structure/relevance
#             prompt_prefix = payload["inputs"]
#             if generated_email.startswith(prompt_prefix):
#                 generated_email = generated_email[len(prompt_prefix):].strip()
#             if not all(keyword in generated_email for keyword in ["Subject:", "Dear", "Best regards"]) or prompt.lower() not in generated_email.lower():
#                 logger.warning(f"Hugging Face returned improperly formatted or irrelevant email: {generated_email}")
#                 # Enforce proper email draft
#                 formatted_email = [
#                     f"Subject: {prompt.capitalize()}",
#                     "Dear [Recipient],",
#                     f"I hope this email finds you well. I would like to invite you to a meeting next week to discuss our upcoming plans. Please let me know your availability so we can schedule a suitable time.",
#                     "Best regards,",
#                     "[Your Name]"
#                 ]
#                 generated_email = "\n".join(formatted_email)
#                 logger.debug(f"Post-processed email: {generated_email}")
            
#             ai_cache[cache_key] = generated_email
#             logger.info("Email generated successfully with Hugging Face")
#             return generated_email
#     except Exception as e:
#         logger.error(f"Failed to generate email with Hugging Face: {str(e)}", exc_info=True)
#         raise Exception(f"Failed to generate email with Hugging Face: {str(e)}")

# # Routes
# @app.route('/api/store-tokens', methods=['POST'])
# def store_tokens():
#     data = request.get_json()
#     if not data or not all(k in data for k in ['email', 'accessToken', 'refreshToken']):
#         logger.error("Missing required fields in store-tokens request")
#         return jsonify({"error": "Missing required fields"}), 400
#     try:
#         email = data['email']
#         user_data = {"email": email, "accessToken": data['accessToken'], "refreshToken": data['refreshToken'],
#                      "name": data.get('name', ''), "lastLogin": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
#         if mongo_connected:
#             users_collection.update_one({"email": email}, {"$set": user_data}, upsert=True)
#         logger.info(f"Tokens stored for {email}")
#         return jsonify({"status": "success", "message": "Tokens stored successfully"})
#     except Exception as e:
#         logger.error(f"Failed to store tokens: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Failed to store tokens: {str(e)}"}), 500

# @app.route('/api/get-tokens', methods=['GET'])
# def get_tokens():
#     email = request.args.get('email')
#     if not email:
#         logger.error("Missing email parameter in get-tokens request")
#         return jsonify({"error": "Missing email parameter"}), 400
#     try:
#         if not mongo_connected:
#             logger.warning("MongoDB not connected, cannot retrieve tokens")
#             return jsonify({"error": "Database unavailable"}), 503
#         user = users_collection.find_one({"email": email})
#         if not user:
#             logger.warning(f"No user found with email: {email}")
#             return jsonify({"error": "User not found"}), 404
#         logger.info(f"Retrieved tokens for {email}")
#         return jsonify({"status": "success", "accessToken": user.get("accessToken"), "refreshToken": user.get("refreshToken")})
#     except Exception as e:
#         logger.error(f"Failed to retrieve tokens: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Failed to retrieve tokens: {str(e)}"}), 500

# @app.route('/api/fetch-emails', methods=['GET'])
# @async_route
# async def fetch_emails_endpoint():
#     auth_header = request.headers.get('Authorization')
#     refresh_token = request.headers.get('Refresh-Token')
#     if not auth_header or not auth_header.startswith('Bearer '):
#         logger.error("Missing or invalid Authorization header")
#         return jsonify({"error": "Missing or invalid Authorization header"}), 401
#     access_token = auth_header.split('Bearer ')[1].strip()
#     if not refresh_token:
#         logger.error("Missing Refresh-Token header")
#         return jsonify({"error": "Missing Refresh-Token header"}), 401
#     try:
#         logger.info(f"Processing fetch-emails request with access_token: {access_token[:10]}...")
#         emails, new_access_token = await fetch_emails(access_token, refresh_token)
#         return jsonify({"status": "success", "emails": emails, "newAccessToken": new_access_token})
#     except Exception as e:
#         logger.error(f"Fetch emails failed: {str(e)}", exc_info=True)
#         if "Authentication failed" in str(e):
#             return jsonify({"error": str(e)}), 401
#         return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

# @app.route('/api/generate-email', methods=['POST'])
# @async_route
# async def generate_email_endpoint():
#     try:
#         if not request.data:
#             logger.error("No request body provided")
#             return jsonify({"error": "Request body is empty"}), 400
        
#         data = request.get_json(silent=True)
#         logger.debug(f"Raw request data: {request.data.decode('utf-8')}")
#         if data is None or not isinstance(data, dict):
#             logger.error(f"Invalid JSON in request body: {request.data.decode('utf-8')}")
#             return jsonify({"error": "Invalid JSON format"}), 400
        
#         if 'prompt' not in data:
#             logger.error("Missing 'prompt' in request body")
#             return jsonify({"error": "Prompt is required"}), 400
        
#         prompt = data['prompt']
#         if not isinstance(prompt, str) or not prompt.strip():
#             logger.error("Prompt must be a non-empty string")
#             return jsonify({"error": "Prompt must be a non-empty string"}), 400

#         logger.info(f"Generating email with prompt: {prompt}")
#         email_draft = await generate_email(prompt)
#         if email_draft is None:
#             logger.error("Email generation returned None")
#             return jsonify({"error": "Failed to generate email: No response from AI services"}), 500
#         return jsonify({"status": "success", "emailDraft": email_draft})
#     except Exception as e:
#         logger.error(f"Generate email failed: {str(e)}", exc_info=True)
#         return jsonify({"error": f"Failed to generate email: {str(e)}"}), 500

# @app.errorhandler(404)
# def not_found(error):
#     logger.error(f"404 error: {request.path}")
#     return jsonify({"error": "Not found"}), 404

# @app.errorhandler(405)
# def method_not_allowed(error):
#     logger.error(f"405 error: {request.method} not allowed for {request.path}")
#     return jsonify({"error": f"Method {request.method} not allowed"}), 405

# @app.errorhandler(Exception)
# def handle_exception(e):
#     logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
#     return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# if __name__ == '__main__':
#     port = int(os.environ.get("PORT", 5000))
#     debug = os.getenv("FLASK_DEBUG", "False").lower() in ('true', '1', 't')
#     logger.info(f"Starting Flask server on port {port}, debug={debug}")
#     app.run(host="0.0.0.0", port=port, debug=debug)


import asyncio
import aiohttp
import logging
from flask import Flask, request, jsonify, make_response
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
import time
import random
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "moz-extension://*",
            "chrome-extension://*",
            "https://email-extension.onrender.com",
            "http://localhost:*"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Authorization", "Refresh-Token", "Content-Type"]
    }
})

# Environment Variables
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
TOKEN_URI = "https://oauth2.googleapis.com/token"
OLLAMA_BASE_URL = "https://ollama-on-render.onrender.com"
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct"  # Switched to a more reliable model
HF_API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "ai_email_agent"
EMAIL_CACHE_TTL = int(os.getenv("EMAIL_CACHE_TTL", 60))
AI_CACHE_TTL = int(os.getenv("AI_CACHE_TTL", 300))

# Database Configuration
mongo_connected = False
try:
    if not MONGO_URI:
        logger.warning("MONGO_URI not set, running without database")
    else:
        logger.info("Connecting to MongoDB...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        users_collection = db.users
        emails_collection = db.emails
        templates_collection = db.templates
        client.server_info()
        mongo_connected = True
        logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}", exc_info=True)
    logger.warning("Continuing without MongoDB functionality")

# Caches
email_cache = TTLCache(maxsize=128, ttl=EMAIL_CACHE_TTL)
ai_cache = TTLCache(maxsize=256, ttl=AI_CACHE_TTL)

# CORS Middleware
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    allowed_origins = [
        "moz-extension://*",
        "chrome-extension://*",
        "https://email-extension.onrender.com",
        "http://localhost"
    ]
    if any(origin and origin.startswith(o.replace('*', '')) for o in allowed_origins):
        response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Refresh-Token, Content-Type'
    response.headers['Access-Control-Max-Age'] = '86400'
    logger.debug(f"Added CORS headers for origin: {origin}")
    return response

# Handle OPTIONS requests
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = make_response()
    origin = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Refresh-Token, Content-Type'
    response.headers['Access-Control-Max-Age'] = '86400'
    logger.debug(f"Handled OPTIONS request for {path}")
    return response, 200

# Health Checks
@app.route('/', methods=['GET', 'HEAD'])
def root_health_check():
    logger.info("Root health check requested")
    return jsonify({"status": "ok", "message": "Server is alive", "mongo_connected": mongo_connected}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    logger.info("API health check requested")
    return jsonify({"status": "ok", "message": "Server is running", "mongo_connected": mongo_connected}), 200

# Helper Functions
def get_credentials(access_token, refresh_token):
    try:
        if not all([access_token, refresh_token, TOKEN_URI, CLIENT_ID, CLIENT_SECRET]):
            missing = [k for k, v in {'access_token': access_token, 'refresh_token': refresh_token, 'token_uri': TOKEN_URI, 'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET}.items() if not v]
            logger.error(f"Missing credential fields: {missing}")
            raise ValueError(f"Missing required credential fields: {missing}")
        creds = Credentials(token=access_token, refresh_token=refresh_token, token_uri=TOKEN_URI, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
        if creds.expired and creds.refresh_token:
            logger.debug("Access token expired, refreshing...")
            creds.refresh(Request())
            access_token = creds.token
            if mongo_connected:
                user = users_collection.find_one({"refreshToken": refresh_token})
                if user:
                    users_collection.update_one({"email": user['email']}, {"$set": {"accessToken": access_token, "updated_at": datetime.now(timezone.utc)}})
                    logger.info(f"Updated access token for {user['email']}")
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
        results = service.users().messages().list(userId='me', maxResults=10, labelIds=['INBOX']).execute()
        messages = results.get('messages', [])
        emails = []
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id'], format='metadata', metadataHeaders=['From', 'Subject', 'Date']).execute()
            headers = {h['name']: h['value'] for h in msg['payload']['headers']}
            email_data = {
                'id': message['id'], 'from': headers.get('From', ''), 'subject': headers.get('Subject', ''),
                'date': headers.get('Date', ''), 'snippet': msg.get('snippet', '')
            }
            emails.append(email_data)
            if mongo_connected:
                save_email_to_db(email_data)
        logger.info(f"Fetched {len(emails)} emails")
        return emails, new_access_token
    except Exception as e:
        logger.error(f"Failed to fetch emails: {str(e)}", exc_info=True)
        raise

def save_email_to_db(email_data):
    try:
        if not emails_collection.find_one({'id': email_data['id']}):
            email_data.update({'created_at': datetime.now(timezone.utc), 'updated_at': datetime.now(timezone.utc)})
            emails_collection.insert_one(email_data)
            logger.debug(f"Saved email {email_data['id']} to DB")
    except Exception as e:
        logger.error(f"Failed to save email to DB: {str(e)}")

# Keyword Extraction for Fallback
def extract_keywords(prompt):
    common_words = {'a', 'an', 'the', 'to', 'for', 'on', 'in', 'with', 'and', 'is', 'are'}
    words = prompt.lower().split()
    keywords = [word for word in words if word not in common_words and len(word) > 2]
    return keywords[:2]

# Ollama Email Generation with Retry
async def generate_email_with_ollama(prompt, session, retries=3, backoff=2):
    cache_key = f"generate_ollama_{hash(prompt)}"
    if cache_key in ai_cache:
        logger.debug("Returning cached Ollama email")
        return ai_cache[cache_key]

    for attempt in range(retries):
        try:
            payload = {
                "model": "gemma:2b",
                "prompt": f"Write a professional email based on this request: '{prompt}'. Format it as plain text with line breaks:\nSubject: {prompt.capitalize()}\nDear [Recipient],\n[Body: Keep it concise, relevant to '{prompt}', professional]\nBest regards,\n[Your Name]",
                "stream": False,
                "temperature": 0.7,
                "max_tokens": 300
            }
            generate_url = f"{OLLAMA_BASE_URL}/api/generate"
            logger.debug(f"Attempt {attempt + 1}: Sending request to Ollama at {generate_url}")
            async with session.post(generate_url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as response:
                if response.status != 200:
                    logger.warning(f"Ollama attempt {attempt + 1} failed with status {response.status}: {await response.text()}")
                    if attempt == retries - 1:
                        raise Exception(f"Ollama failed after {retries} attempts")
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                result = await response.json()
                logger.debug(f"Ollama response: {result}")
                generated_email = result.get("response", "").strip()
                if not generated_email:
                    logger.warning(f"Ollama returned empty response on attempt {attempt + 1}")
                    if attempt == retries - 1:
                        raise Exception("Ollama returned empty response")
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                if not all(keyword in generated_email for keyword in ["Subject:", "Dear", "Best regards"]):
                    logger.warning(f"Ollama returned improperly formatted email on attempt {attempt + 1}: {generated_email}")
                    if attempt == retries - 1:
                        raise Exception("Ollama returned invalid email format")
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                ai_cache[cache_key] = generated_email
                logger.info("Email generated successfully with Ollama")
                return generated_email
        except Exception as e:
            logger.error(f"Ollama attempt {attempt + 1} failed: {str(e)}")
            if attempt == retries - 1:
                raise Exception(f"Ollama failed: {str(e)}")
            await asyncio.sleep(backoff * (2 ** attempt))
    raise Exception("Ollama failed after retries")

# Hugging Face Email Generation with Retry
async def generate_email_with_hf(prompt, session, retries=3, backoff=2):
    if not HF_API_TOKEN:
        logger.error("Hugging Face API token not provided")
        raise Exception("Hugging Face API token not provided")

    cache_key = f"generate_hf_{hash(prompt)}"
    if cache_key in ai_cache:
        logger.debug("Returning cached Hugging Face email")
        return ai_cache[cache_key]

    for attempt in range(retries):
        try:
            payload = {
                "inputs": f"Generate a professional email based on this request: '{prompt}'. Format it as plain text with line breaks:\nSubject: {prompt.capitalize()}\nDear [Recipient],\n[Body: Keep it concise, relevant to '{prompt}', professional]\nBest regards,\n[Your Name]",
                "parameters": {
                    "max_new_tokens": 300,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": "application/json"}
            logger.debug(f"Attempt {attempt + 1}: Sending request to Hugging Face at {HF_API_URL}")
            async with session.post(HF_API_URL, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as response:
                if response.status != 200:
                    logger.warning(f"Hugging Face attempt {attempt + 1} failed with status {response.status}: {await response.text()}")
                    if attempt == retries - 1:
                        raise Exception(f"Hugging Face failed with status {response.status}")
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                result = await response.json()
                logger.debug(f"Hugging Face response: {result}")
                generated_email = result[0].get("generated_text", "").strip() if isinstance(result, list) and result else ""
                if not generated_email:
                    logger.warning(f"Hugging Face returned empty response on attempt {attempt + 1}")
                    if attempt == retries - 1:
                        raise Exception("Hugging Face returned empty response")
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                if not all(keyword in generated_email for keyword in ["Subject:", "Dear", "Best regards"]):
                    logger.warning(f"Hugging Face returned improperly formatted email on attempt {attempt + 1}: {generated_email}")
                    if attempt == retries - 1:
                        raise Exception("Hugging Face returned invalid email format")
                    await asyncio.sleep(backoff * (2 ** attempt))
                    continue
                ai_cache[cache_key] = generated_email
                logger.info("Email generated successfully with Hugging Face")
                return generated_email
        except Exception as e:
            logger.error(f"Hugging Face attempt {attempt + 1} failed: {str(e)}")
            if attempt == retries - 1:
                raise Exception(f"Hugging Face failed: {str(e)}")
            await asyncio.sleep(backoff * (2 ** attempt))
    raise Exception("Hugging Face failed after retries")

# Main Email Generation Function
async def generate_email(prompt):
    async with aiohttp.ClientSession() as session:
        try:
            # Try Ollama first
            return await generate_email_with_ollama(prompt, session)
        except Exception as e:
            logger.warning(f"Ollama failed, falling back to Hugging Face: {str(e)}")
            try:
                # Try Hugging Face
                return await generate_email_with_hf(prompt, session)
            except Exception as e:
                logger.error(f"Hugging Face failed, using fallback: {str(e)}")
                # Fallback
                keywords = extract_keywords(prompt)
                greetings = [
                    "Dear [Recipient],",
                    "Hello [Recipient],",
                    "Hi [Recipient],",
                    "Greetings [Recipient],"
                ]
                closing_actions = ["your thoughts", "your availability", "your input", "any feedback"]
                if len(keywords) == 0:
                    body_templates = [
                        f"I’m reaching out about {prompt.lower()}. Could you please let me know your next steps?",
                        f"I wanted to touch base regarding {prompt.lower()}. Please advise on how we can proceed."
                    ]
                elif len(keywords) == 1:
                    body_templates = [
                        f"I’m contacting you about {keywords[0]}. Could you share your {random.choice(closing_actions)} on this?",
                        f"I’d like to discuss {keywords[0]} with you. Please let me know when we can connect."
                    ]
                else:
                    body_templates = [
                        f"I’m writing to address {keywords[0]} and {keywords[1]}. Could you provide {random.choice(closing_actions)} at your earliest convenience?",
                        f"I’d appreciate your perspective on {keywords[0]} and {keywords[1]}. Please let me know what you think."
                    ]
                formatted_email = [
                    f"Subject: {prompt.capitalize()}",
                    random.choice(greetings),
                    random.choice(body_templates),
                    "Best regards,",
                    "[Your Name]"
                ]
                generated_email = "\n".join(formatted_email)
                logger.info("Email generated using fallback")
                return generated_email

# Routes
@app.route('/api/store-tokens', methods=['POST'])
def store_tokens():
    data = request.get_json()
    if not data or not all(k in data for k in ['email', 'accessToken', 'refreshToken']):
        logger.error("Missing required fields in store-tokens request")
        return jsonify({"error": "Missing required fields"}), 400
    try:
        email = data['email']
        user_data = {"email": email, "accessToken": data['accessToken'], "refreshToken": data['refreshToken'],
                     "name": data.get('name', ''), "lastLogin": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
        if mongo_connected:
            users_collection.update_one({"email": email}, {"$set": user_data}, upsert=True)
        logger.info(f"Tokens stored for {email}")
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
        if not mongo_connected:
            logger.warning("MongoDB not connected, cannot retrieve tokens")
            return jsonify({"error": "Database unavailable"}), 503
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"No user found with email: {email}")
            return jsonify({"error": "User not found"}), 404
        logger.info(f"Retrieved tokens for {email}")
        return jsonify({"status": "success", "accessToken": user.get("accessToken"), "refreshToken": user.get("refreshToken")})
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
        logger.info(f"Processing fetch-emails request")
        emails, new_access_token = await fetch_emails(access_token, refresh_token)
        return jsonify({"status": "success", "emails": emails, "newAccessToken": new_access_token})
    except Exception as e:
        logger.error(f"Fetch emails failed: {str(e)}", exc_info=True)
        if "Authentication failed" in str(e):
            return jsonify({"error": str(e)}), 401
        return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

@app.route('/api/generate-email', methods=['POST'])
@async_route
async def generate_email_endpoint():
    try:
        if not request.data:
            logger.error("No request body provided")
            return jsonify({"error": "Request body is empty"}), 400
        
        data = request.get_json(silent=True)
        if data is None or not isinstance(data, dict):
            logger.error(f"Invalid JSON in request body: {request.data.decode('utf-8')}")
            return jsonify({"error": "Invalid JSON format"}), 400
        
        if 'prompt' not in data:
            logger.error("Missing 'prompt' in request body")
            return jsonify({"error": "Prompt is required"}), 400
        
        prompt = data['prompt']
        if not isinstance(prompt, str) or not prompt.strip():
            logger.error("Prompt must be a non-empty string")
            return jsonify({"error": "Prompt must be a non-empty string"}), 400

        logger.info(f"Generating email with prompt: {prompt}")
        email_draft = await generate_email(prompt)
        if email_draft is None:
            logger.error("Email generation returned None")
            return jsonify({"error": "Failed to generate email: No response from AI services"}), 500
        return jsonify({"status": "success", "emailDraft": email_draft})
    except Exception as e:
        logger.error(f"Generate email failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to generate email: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    logger.error(f"404 error: {request.path}")
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    logger.error(f"405 error: {request.method} not allowed for {request.path}")
    return jsonify({"error": f"Method {request.method} not allowed"}), 405

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ('true', '1', 't')
    logger.info(f"Starting Flask server on port {port}, debug={debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)
