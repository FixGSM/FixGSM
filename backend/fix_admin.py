"""Fix admin user type"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm")

async def fix_admin():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Update admin user
    result = await db["admin_users"].update_one(
        {"email": "admin@fixgsm.com"},
        {"$set": {
            "user_type": "admin",
            "name": "Platform Admin"
        }}
    )
    
    print(f"Admin updated: {result.modified_count} document(s)")
    
    # Verify
    admin = await db["admin_users"].find_one({"email": "admin@fixgsm.com"})
    print(f"\nAdmin user verified:")
    print(f"  Email: {admin.get('email')}")
    print(f"  User type: {admin.get('user_type')}")
    print(f"  Name: {admin.get('name')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin())

