import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm_db")

async def simulate_expired_subscription():
    """Simulează că abonamentul tenant-ului Tony a expirat"""
    
    print("\nConectare la MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Găsește tenant-ul Tony
        tenant = await db["tenants"].find_one({"owner_name": "Tony"})
        
        if not tenant:
            print("ERROR: Tenant Tony nu a fost gasit!")
            return
        
        print(f"SUCCESS: Tenant gasit: {tenant.get('company_name')}")
        print(f"   Email: {tenant.get('email')}")
        print(f"   Data curenta de expirare: {tenant.get('subscription_end_date')}")
        
        # Seteaza data de expirare cu 2 zile in trecut
        now = datetime.now(timezone.utc)
        expired_date = now - timedelta(days=2)
        
        print(f"\nPROCESSING: Setez data de expirare la: {expired_date.strftime('%Y-%m-%d %H:%M:%S')} (2 zile in trecut)")
        
        # Actualizeaza tenant-ul
        result = await db["tenants"].update_one(
            {"tenant_id": tenant["tenant_id"]},
            {
                "$set": {
                    "subscription_end_date": expired_date.isoformat(),
                    "has_payment_notification": True,  # Activeaza notificarea
                    "has_grace_period": False  # Nu are perioada de gracie
                }
            }
        )
        
        if result.modified_count > 0:
            print("SUCCESS: Abonamentul a fost setat ca EXPIRAT!")
            print("   - Data de expirare: 2 zile in trecut")
            print("   - Notificare de plata: ACTIVATA")
            print("   - Perioada de gracie: DEZACTIVATA")
            print("\nTESTING: Acum poti testa:")
            print("   1. Logout din contul curent")
            print("   2. Incearca sa te loghezi cu office@brandmobile.ro / Coolzone")
            print("   3. Ar trebui sa primesti mesajul: 'Abonamentul a expirat'")
        else:
            print("ERROR: Eroare la actualizarea tenant-ului")
        
    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        client.close()
        print("\nConexiune inchisa")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("SIMULARE ABONAMENT EXPIRAT")
    print("="*60)
    print("\nAcest script va seta abonamentul tenant-ului Tony ca EXPIRAT")
    print("pentru a testa sistemul de blocare la login.\n")
    
    asyncio.run(simulate_expired_subscription())
