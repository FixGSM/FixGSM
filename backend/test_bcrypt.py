import bcrypt
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "fixgsm")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def test():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    user = await db["users"].find_one({"email": "Test2@B.com"})
    
    if not user:
        print("[ERROR] User not found!")
        return
    
    password_hash = user.get("password_hash")
    print(f"Password hash from DB: {password_hash}")
    print(f"Password hash type: {type(password_hash)}")
    print(f"Password hash length: {len(password_hash)}")
    
    # Test with correct password
    password = "Coolzone"
    print(f"\nTesting password: {password}")
    
    try:
        result = verify_password(password, password_hash)
        print(f"Verification result: {result}")
    except Exception as e:
        print(f"Verification error: {e}")
    
    # Test encoding
    print(f"\nPassword encoded: {password.encode('utf-8')}")
    print(f"Hash encoded: {password_hash.encode('utf-8')[:50]}...")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test())

