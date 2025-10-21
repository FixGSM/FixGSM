import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm_db")

async def check_tenant():
    """Check tenant credentials"""
    
    print("\nConectare la MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        tenant = await db["tenants"].find_one({"owner_name": "Tony"})
        
        if tenant:
            print(f"\nTENANT FOUND:")
            print(f"  owner_name: {tenant.get('owner_name')}")
            print(f"  email: {tenant.get('email')}")
            print(f"  company_name: {tenant.get('company_name')}")
            print(f"  tenant_id: {tenant.get('tenant_id')}")
            print(f"  subscription_end_date: {tenant.get('subscription_end_date')}")
            print(f"  subscription_status: {tenant.get('subscription_status')}")
            print(f"  subscription_price: {tenant.get('subscription_price')}")
            print(f"  has_payment_notification: {tenant.get('has_payment_notification')}")
            print(f"\n  Password hash exists: {bool(tenant.get('password'))}")
        else:
            print("\nTenant not found!")
        
    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        client.close()
        print("\nConexiune inchisa\n")

if __name__ == "__main__":
    asyncio.run(check_tenant())

