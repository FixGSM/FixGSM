import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "fixgsm")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_user():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Find user by email
    user = await db["users"].find_one({"email": "Test2@B.com"})
    
    if not user:
        print("[X] User not found!")
        return
    
    print("[OK] User found!")
    print(f"User ID: {user.get('user_id')}")
    print(f"Name: {user.get('name')}")
    print(f"Email: {user.get('email')}")
    print(f"Role: {user.get('role')}")
    print(f"Tenant ID: {user.get('tenant_id')}")
    print(f"Location ID: {user.get('location_id')}")
    print(f"Created by admin: {user.get('created_by_admin')}")
    print(f"Password hash: {user.get('password_hash')[:50]}...")
    
    # Test password verification
    password = "Coolzone"
    is_valid = pwd_context.verify(password, user.get("password_hash"))
    
    print(f"\nPassword verification: {'VALID' if is_valid else 'INVALID'}")
    
    # Check tenant status
    tenant = await db["tenants"].find_one({"tenant_id": user.get("tenant_id")})
    if tenant:
        print(f"\nTenant Status:")
        print(f"Service Name: {tenant.get('service_name')}")
        print(f"Subscription Status: {tenant.get('subscription_status')}")
        print(f"Subscription Plan: {tenant.get('subscription_plan')}")
        print(f"Subscription End Date: {tenant.get('subscription_end_date')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_user())

