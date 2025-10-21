"""
Clear all logs from the database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "fixgsm_db")

async def clear_all_logs():
    """Delete all logs from the database"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Stergere log-uri...")
    print("=" * 50)
    
    # Count logs before deletion
    count_before = await db["logs"].count_documents({})
    print(f"Log-uri existente: {count_before}")
    
    # Delete all logs
    result = await db["logs"].delete_many({})
    
    print(f"Log-uri sterse: {result.deleted_count}")
    print("=" * 50)
    print("SUCCESS: Toate log-urile au fost sterse!")
    print()
    print("Refresh Admin Dashboard -> Logs pentru a verifica")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_all_logs())

