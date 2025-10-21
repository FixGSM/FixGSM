import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm_db")

async def check_tenants():
    """Check all tenants in database"""
    
    print("\nConectare la MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Gaseste toate tenants
        tenants_collection = db["tenants"]
        tenants = await tenants_collection.find({}).to_list(length=None)
        
        print(f"\n{'='*80}")
        print(f"TOTAL TENANTS: {len(tenants)}")
        print(f"{'='*80}\n")
        
        for idx, tenant in enumerate(tenants, 1):
            print(f"TENANT #{idx}:")
            print(f"  _id: {tenant.get('_id')}")
            print(f"  tenant_id: {tenant.get('tenant_id')}")
            print(f"  owner_name: {tenant.get('owner_name')}")
            print(f"  company_name: {tenant.get('company_name')}")
            print(f"  email: {tenant.get('email')}")
            print(f"  subscription_end_date: {tenant.get('subscription_end_date', 'N/A')}")
            print(f"  subscription_status: {tenant.get('subscription_status', 'N/A')}")
            print(f"  subscription_price: {tenant.get('subscription_price', 'N/A')}")
            print()
        
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        client.close()
        print("Conexiune inchisa\n")

if __name__ == "__main__":
    asyncio.run(check_tenants())

