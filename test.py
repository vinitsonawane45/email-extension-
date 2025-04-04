from pymongo import MongoClient

uri="mongodb+srv://vinitsonawane76:VPeMCZGJOKEmtgbM@cluster0.on6kpbz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)

try:
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print("❌ Connection failed:", e)
