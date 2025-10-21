import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "fixgsm")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def debug_user():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Find user by email
    user = await db["users"].find_one({"email": "Test2@B.com"})
    
    if not user:
        print("[X] User not found!")
        return
    
    print("[OK] User found!")
    print(f"Name: {user.get('name')}")
    print(f"Email: {user.get('email')}")
    print(f"Role: {user.get('role')}")
    print(f"Tenant ID: {user.get('tenant_id')}")
    print(f"Location ID: {user.get('location_id')}")
    print(f"Created by admin: {user.get('created_by_admin')}")
    
    # Test password verification
    password = "Coolzone"
    print(f"\nTesting password: {password}")
    
    try:
        result = verify_password(password, user.get("password_hash"))
        print(f"Password verification: {result}")
        
        if result:
            print("[OK] Password is CORRECT!")
        else:
            print("[X] Password is WRONG!")
            
    except Exception as e:
        print(f"[ERROR] Verification error: {e}")
    
    # Check tenant
    tenant = await db["tenants"].find_one({"tenant_id": user.get("tenant_id")})
    if tenant:
        print(f"\nTenant Status:")
        print(f"Service Name: {tenant.get('service_name')}")
        print(f"Subscription Status: {tenant.get('subscription_status')}")
        print(f"Subscription Plan: {tenant.get('subscription_plan')}")
        print(f"Subscription End Date: {tenant.get('subscription_end_date')}")
    else:
        print("[X] Tenant not found!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_user())
