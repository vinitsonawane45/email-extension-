import asyncio
import aiohttp
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import BatchHttpRequest
import base64
from dotenv import load_dotenv
import os
from cachetools import TTLCache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for testing; restrict in production
# CORS(app, origins=["moz-extension://*", "http://localhost:5000", "http://127.0.0.1:5000"])

# Google API Credentials
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
TOKEN_URI = "https://oauth2.googleapis.com/token"

# Ollama AI API Endpoint
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Caches: emails (5 min TTL), AI responses (10 min TTL)
email_cache = TTLCache(maxsize=128, ttl=300)  # 5 minutes
ai_cache = TTLCache(maxsize=256, ttl=600)    # 10 minutes

# Function to refresh expired access tokens
def get_credentials(access_token, refresh_token):
    try:
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri=TOKEN_URI,
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            logger.info("✅ Access token refreshed")
        return creds, creds.token
    except Exception as e:
        logger.error(f"Error refreshing credentials: {e}")
        raise

# Fetch Emails from Gmail API with Batch Processing
async def fetch_emails(access_token, refresh_token):
    cache_key = (access_token, refresh_token)
    if cache_key in email_cache:
        logger.info("Returning cached emails")
        return email_cache[cache_key]

    try:
        creds, new_access_token = get_credentials(access_token, refresh_token)
        service = build('gmail', 'v1', credentials=creds)
        results = service.users().messages().list(userId='me', maxResults=10).execute()
        messages = results.get('messages', [])

        emails = []
        batch = BatchHttpRequest()

        def handle_response(request_id, response, exception):
            if exception is None:
                headers = response.get('payload', {}).get('headers', [])
                sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), "Unknown")
                subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), "No Subject")
                emails.append({"id": request_id, "sender": sender, "subject": subject, "snippet": response.get('snippet', "")[:100]})
            else:
                logger.error(f"Batch request failed for message {request_id}: {exception}")

        for message in messages:
            batch.add(service.users().messages().get(userId='me', id=message['id'], format='metadata', metadataHeaders=['From', 'Subject']), callback=handle_response)

        batch._batch_uri = "https://www.googleapis.com/batch/gmail/v1"
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, batch.execute)
        email_cache[cache_key] = (emails, new_access_token)
        logger.info("Emails fetched successfully")
        return emails, new_access_token
    except Exception as e:
        logger.error(f"Error fetching emails: {e}")
        raise

# AI-Powered Email Generation
async def generate_email(prompt):
    if prompt in ai_cache:
        logger.info("Returning cached email draft")
        return ai_cache[prompt]
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
            data = {"model": "mistral", "prompt": f"You are a professional AI assistant. Write a detailed email based on this:\n\n{prompt}", "stream": False}
            async with session.post(OLLAMA_API_URL, json=data) as response:
                result = (await response.json()).get("response") if response.status == 200 else "Failed to generate email."
                ai_cache[prompt] = result
                logger.info("Email generated successfully")
                return result
    except Exception as e:
        logger.error(f"Error generating email: {e}")
        raise

# AI Email Summarization
async def summarize_email(email_body):
    if email_body in ai_cache:
        logger.info("Returning cached summary")
        return ai_cache[email_body]
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
            data = {"model": "mistral", "prompt": f"Summarize this email in a short and clear way:\n\n{email_body}", "stream": False}
            async with session.post(OLLAMA_API_URL, json=data) as response:
                result = (await response.json()).get("response") if response.status == 200 else "Failed to summarize email."
                ai_cache[email_body] = result
                logger.info("Email summarized successfully")
                return result
    except Exception as e:
        logger.error(f"Error summarizing email: {e}")
        raise

# AI Email Categorization
async def categorize_email(email_body):
    if email_body in ai_cache:
        logger.info("Returning cached category")
        return ai_cache[email_body]
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
            data = {"model": "mistral", "prompt": f"Classify this email into Work, Personal, Spam, or Important:\n\n{email_body}", "stream": False}
            async with session.post(OLLAMA_API_URL, json=data) as response:
                result = (await response.json()).get("response").strip() if response.status == 200 else "Failed to categorize email."
                ai_cache[email_body] = result
                logger.info("Email categorized successfully")
                return result
    except Exception as e:
        logger.error(f"Error categorizing email: {e}")
        raise

# AI Smart Reply
async def smart_reply(email_body):
    if email_body in ai_cache:
        logger.info("Returning cached smart reply")
        return ai_cache[email_body]
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=None)) as session:
            data = {"model": "mistral", "prompt": f"Generate a professional reply to this email:\n\n{email_body}", "stream": False}
            async with session.post(OLLAMA_API_URL, json=data) as response:
                result = (await response.json()).get("response") if response.status == 200 else "Failed to generate smart reply."
                ai_cache[email_body] = result
                logger.info("Smart reply generated successfully")
                return result
    except Exception as e:
        logger.error(f"Error generating smart reply: {e}")
        raise

# Send an email using Gmail API
async def send_email(access_token, refresh_token, recipient, subject, message):
    try:
        creds, new_access_token = get_credentials(access_token, refresh_token)
        service = build('gmail', 'v1', credentials=creds)

        email_msg = f"To: {recipient}\r\nSubject: {subject}\r\n\r\n{message}"
        encoded_msg = base64.urlsafe_b64encode(email_msg.encode("utf-8")).decode("utf-8")

        loop = asyncio.get_running_loop()
        send_request = await loop.run_in_executor(None, service.users().messages().send(
            userId="me",
            body={"raw": encoded_msg}
        ).execute)

        logger.info("Email sent successfully")
        return send_request.get("id"), new_access_token
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise

# API Endpoints
@app.route('/fetch-emails', methods=['GET'])
async def fetch_emails_endpoint():
    access_token = request.headers.get('Authorization')
    refresh_token = request.headers.get('Refresh-Token')

    if not access_token or not refresh_token:
        return jsonify({"error": "Missing access token or refresh token"}), 401

    try:
        emails, new_access_token = await fetch_emails(access_token, refresh_token)
        return jsonify({"emails": emails, "newAccessToken": new_access_token})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

@app.route('/generate-email', methods=['POST'])
async def generate_email_endpoint():
    data = request.get_json(silent=True)
    if not data or 'prompt' not in data:
        return jsonify({"error": "Prompt is required"}), 400
    prompt = data['prompt']
    try:
        email_draft = await generate_email(prompt)
        return jsonify({"emailDraft": email_draft})
    except Exception as e:
        return jsonify({"error": f"Failed to generate email: {str(e)}"}), 500

@app.route('/summarize-email', methods=['POST'])
async def summarize_email_endpoint():
    data = request.get_json(silent=True)
    if not data or 'emailBody' not in data:
        return jsonify({"error": "Email body is required"}), 400
    email_body = data['emailBody']
    try:
        summary = await summarize_email(email_body)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": f"Failed to summarize email: {str(e)}"}), 500

@app.route('/categorize-email', methods=['POST'])
async def categorize_email_endpoint():
    data = request.get_json(silent=True)
    if not data or 'emailBody' not in data:
        return jsonify({"error": "Email body is required"}), 400
    email_body = data['emailBody']
    try:
        category = await categorize_email(email_body)
        return jsonify({"category": category})
    except Exception as e:
        return jsonify({"error": f"Failed to categorize email: {str(e)}"}), 500

@app.route('/smart-reply', methods=['POST'])
async def smart_reply_endpoint():
    data = request.get_json(silent=True)
    if not data or 'emailBody' not in data:
        return jsonify({"error": "Email body is required"}), 400
    email_body = data['emailBody']
    try:
        smart_reply_text = await smart_reply(email_body)
        return jsonify({"smartReply": smart_reply_text})
    except Exception as e:
        return jsonify({"error": f"Failed to generate smart reply: {str(e)}"}), 500

@app.route('/send-email', methods=['POST'])
async def send_email_endpoint():
    access_token = request.headers.get('Authorization')
    refresh_token = request.headers.get('Refresh-Token')

    if not access_token or not refresh_token:
        return jsonify({"error": "Missing access token or refresh token"}), 401

    data = request.get_json(silent=True)
    if not data or not all(k in data for k in ['recipient', 'subject', 'message']):
        return jsonify({"error": "Missing fields"}), 400

    recipient = data['recipient']
    subject = data['subject']
    message = data['message']

    try:
        email_id, new_access_token = await send_email(access_token, refresh_token, recipient, subject, message)
        return jsonify({"status": "success", "message_id": email_id, "newAccessToken": new_access_token})
    except Exception as e:
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500

# Main entry point for async server
# async def main():
#     from hypercorn.config import Config
#     from hypercorn.asyncio import serve
#     config = Config()
#     config.bind = ["127.0.0.1:5000"]
#     config.workers = 1  # Single worker to simplify loop management
#     await serve(app, config)

# if __name__ == '__main__':
#     asyncio.run(main())

async def main():
    from hypercorn.config import Config
    from hypercorn.asyncio import serve
    import os

    config = Config()
    port = os.environ.get("PORT", "5000")  # Use Railway-assigned port
    config.bind = [f"0.0.0.0:{port}"]
    config.workers = 1  # Single worker to simplify loop management

    await serve(app, config)

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
