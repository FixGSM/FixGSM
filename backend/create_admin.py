"""
Create or verify admin user for FixGSM Platform
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check if admin exists
    admin = await db["admin_users"].find_one({"email": "admin@fixgsm.com"})
    
    if admin:
        print("SUCCESS: Admin user already exists: admin@fixgsm.com")
        print(f"  User type: {admin.get('user_type')}")
        print(f"  Name: {admin.get('name')}")
    else:
        # Create admin user
        hashed_password = pwd_context.hash("admin123")
        
        admin_user = {
            "email": "admin@fixgsm.com",
            "password": hashed_password,
            "user_type": "admin",
            "name": "Platform Admin",
            "created_at": "2025-10-19T00:00:00Z"
        }
        
        await db["admin_users"].insert_one(admin_user)
        print("SUCCESS: Admin user created successfully!")
        print("  Email: admin@fixgsm.com")
        print("  Password: admin123")
        print("  User type: admin")
    
    client.close()
    print("\n" + "="*50)
    print("To login as admin:")
    print("1. Go to http://localhost:3000/login")
    print("2. Email: admin@fixgsm.com")
    print("3. Password: admin123")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(create_admin())

