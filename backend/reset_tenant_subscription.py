import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm_db")

async def reset_subscription():
    """Reseteaza complet abonamentul tenant-ului Tony"""
    
    print("\nConectare la MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Gaseste tenant-ul Tony
        tenant = await db["tenants"].find_one({"email": "office@brandmobile.ro"})
        
        if not tenant:
            print("ERROR: Tenant nu a fost gasit!")
            return
        
        print(f"SUCCESS: Tenant gasit: {tenant.get('company_name')}")
        
        # Seteaza perioada de testare: 14 zile
        now = datetime.now(timezone.utc)
        trial_end_date = now + timedelta(days=14)
        
        # Reseteaza abonamentul la Trial
        result = await db["tenants"].update_one(
            {"tenant_id": tenant["tenant_id"]},
            {
                "$set": {
                    "subscription_plan": "Trial",
                    "subscription_price": 0,
                    "subscription_end_date": trial_end_date.isoformat(),
                    "subscription_status": "active",
                    "is_trial": True,
                    "trial_started_at": now.isoformat(),
                    "has_payment_notification": False,
                    "has_grace_period": False,
                    "grace_period_extended_at": None,
                    "grace_period_days": None,
                    "last_payment_date": None,
                    "last_payment_amount": None
                }
            }
        )
        
        print(f"\nSUCCESS: Abonament resetat!")
        print(f"  - Plan: Trial (Perioada de Testare)")
        print(f"  - Price: 0 RON")
        print(f"  - End date: {trial_end_date.strftime('%Y-%m-%d')} (14 zile)")
        print(f"  - Status: active")
        
        # Sterge toate platile anterioare
        delete_result = await db["payments"].delete_many({"tenant_id": tenant["tenant_id"]})
        print(f"\nSUCCESS: Sterse {delete_result.deleted_count} plati anterioare")
        
        print("\nRESET COMPLET!")
        
    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        client.close()
        print("\nConexiune inchisa\n")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("RESETARE ABONAMENT TENANT")
    print("="*60)
    print("\nAcest script va reseta complet abonamentul tenant-ului")
    print("office@brandmobile.ro la planul Basic.\n")
    
    asyncio.run(reset_subscription())

