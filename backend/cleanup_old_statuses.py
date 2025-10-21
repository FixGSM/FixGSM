"""
Script pentru stergerea statusurilor vechi (fara status_id) din MongoDB
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm_db")

async def cleanup_old_statuses():
    """Sterge toate statusurile vechi care nu au status_id"""
    
    print("Conectare la MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Gaseste toate tenants
        tenants_collection = db["tenants"]
        tenants = await tenants_collection.find({}).to_list(length=None)
        
        print(f"\nGasit {len(tenants)} tenant(s) in baza de date\n")
        
        total_deleted = 0
        
        for tenant in tenants:
            tenant_id = tenant.get("tenant_id") or tenant.get("_id")
            tenant_name = tenant.get("service_name", "Unknown")
            
            print(f"Procesare tenant: {tenant_name} ({tenant_id})")
            
            # Gaseste statusurile vechi (fara status_id)
            old_statuses = tenant.get("custom_statuses", [])
            
            if not old_statuses:
                print(f"   INFO: Nu are statusuri")
                continue
            
            # Filtreaza statusurile - pastreaza doar cele cu status_id
            new_statuses = [s for s in old_statuses if s.get("status_id")]
            old_count = len(old_statuses)
            new_count = len(new_statuses)
            deleted_count = old_count - new_count
            
            if deleted_count > 0:
                # Update tenant cu statusurile curate
                result = await tenants_collection.update_one(
                    {"_id": tenant["_id"]},
                    {"$set": {"custom_statuses": new_statuses}}
                )
                
                print(f"   SUCCESS: Sterse {deleted_count} statusuri vechi")
                print(f"   SUCCESS: Pastrate {new_count} statusuri noi")
                total_deleted += deleted_count
            else:
                print(f"   INFO: Toate statusurile ({old_count}) sunt noi (au status_id)")
        
        print(f"\n{'='*60}")
        print(f"Cleanup finalizat!")
        print(f"Total statusuri vechi sterse: {total_deleted}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        client.close()
        print("Conexiune inchisa")

if __name__ == "__main__":
    import sys
    
    print("\n" + "="*60)
    print("CLEANUP STATUSURI VECHI")
    print("="*60)
    print("\nATENTIE: Acest script va sterge TOATE statusurile")
    print("   care NU au campul 'status_id' din baza de date!")
    print("\nStatusurile vechi (hardcodate) vor fi eliminate.")
    print("Statusurile noi (create prin UI) vor fi pastrate.\n")
    
    # Check for --confirm flag
    if "--confirm" in sys.argv:
        print("Start cleanup...\n")
        asyncio.run(cleanup_old_statuses())
    else:
        print("Pentru a rula cleanup-ul, adauga flag-ul --confirm:")
        print("  python cleanup_old_statuses.py --confirm")

