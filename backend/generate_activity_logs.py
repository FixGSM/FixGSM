"""
Generate test ACTIVITY logs for Recent Activity feed
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fixgsm")

async def generate_activity_logs():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("\nGenerare log-uri de ACTIVITATE pentru Recent Activity...")
    print("=" * 60)
    
    # Get a real tenant for realistic data
    tenant = await db.tenants.find_one({})
    tenant_id = tenant.get("tenant_id") if tenant else "test-tenant-id"
    tenant_email = tenant.get("email", "office@brandmobile.ro") if tenant else "office@brandmobile.ro"
    
    now = datetime.now(timezone.utc)
    
    activities = [
        # Recent logins (last few minutes)
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "auth",
            "message": f"Tenant login successful: {tenant_email}",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "ip_address": "127.0.0.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "created_at": (now - timedelta(minutes=2)).isoformat()
        },
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "warning",
            "category": "auth",
            "message": "Failed login attempt for tenant: test@example.com",
            "user_email": "test@example.com",
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0",
            "metadata": {"reason": "Invalid password"},
            "created_at": (now - timedelta(minutes=5)).isoformat()
        },
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "auth",
            "message": "Employee login successful: ion.popescu@service.ro",
            "user_email": "ion.popescu@service.ro",
            "tenant_id": tenant_id,
            "ip_address": "127.0.0.1",
            "created_at": (now - timedelta(minutes=10)).isoformat()
        },
        
        # Ticket operations (last hour)
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "user_action",
            "message": "Ticket created: BMP485 - Client: Andrei Popescu - Device: Samsung Galaxy A71",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "ticket_id": "BMP485",
                "client_name": "Andrei Popescu",
                "device_model": "Samsung Galaxy A71"
            },
            "created_at": (now - timedelta(minutes=15)).isoformat()
        },
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "user_action",
            "message": "Ticket updated: BMP485 - Changes: status: In Reparatie, estimated_cost: 150",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "ticket_id": "BMP485",
                "changes": {"status": "In Reparatie", "estimated_cost": 150}
            },
            "created_at": (now - timedelta(minutes=30)).isoformat()
        },
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "user_action",
            "message": "Ticket created: BMP486 - Client: Maria Ion - Device: iPhone 13 Pro",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "ticket_id": "BMP486",
                "client_name": "Maria Ion",
                "device_model": "iPhone 13 Pro"
            },
            "created_at": (now - timedelta(hours=1)).isoformat()
        },
        
        # Payment operations (few hours ago)
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "payment",
            "message": f"Payment processed: FIXGSM-20251019-{tenant_id[:8].upper()} - Plan: Pro - Amount: 99 RON - Duration: 1 month(s)",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "invoice_number": f"FIXGSM-20251019-{tenant_id[:8].upper()}",
                "plan": "Pro",
                "amount": 99,
                "currency": "RON"
            },
            "created_at": (now - timedelta(hours=2)).isoformat()
        },
        
        # Settings changes (yesterday)
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "settings",
            "message": "Company info updated - Changes: phone: 0740123456, address: Strada Principala 123",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "changes": {
                    "phone": "0740123456",
                    "address": "Strada Principala 123"
                }
            },
            "created_at": (now - timedelta(hours=5)).isoformat()
        },
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "settings",
            "message": "Location created: Centru - Address: Strada Libertatii 45",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "location_name": "Centru",
                "address": "Strada Libertatii 45"
            },
            "created_at": (now - timedelta(hours=8)).isoformat()
        },
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "info",
            "category": "settings",
            "message": "Employee created: Ion Popescu (ion.popescu@service.ro) - Role: Technician",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "employee_name": "Ion Popescu",
                "employee_email": "ion.popescu@service.ro",
                "role": "Technician"
            },
            "created_at": (now - timedelta(hours=12)).isoformat()
        },
        
        # Ticket deletion (warning)
        {
            "log_id": str(uuid.uuid4()),
            "log_type": "activity",
            "level": "warning",
            "category": "user_action",
            "message": "Ticket deleted: BMP480 - Client: Test User - Device: Test Device",
            "user_email": tenant_email,
            "tenant_id": tenant_id,
            "metadata": {
                "ticket_id": "BMP480",
                "client_name": "Test User"
            },
            "created_at": (now - timedelta(days=1)).isoformat()
        },
    ]
    
    # Insert all activities
    await db.logs.insert_many(activities)
    
    print(f"\n{'SUCCESS':<10} {len(activities)} log-uri de ACTIVITATE generate!")
    print("=" * 60)
    
    # Show what was created
    print("\nActivitati generate:")
    for act in activities:
        level_icon = {
            'info': '[INFO]',
            'warning': '[WARN]',
            'error': '[ERROR]',
            'critical': '[CRIT]'
        }
        icon = level_icon.get(act['level'], '[?]')
        category = act['category'].upper()
        print(f"{icon:<8} [{category:<12}] {act['message'][:80]}")
    
    print("\n" + "=" * 60)
    print("Acum refresh Admin Dashboard -> Overview")
    print("Ar trebui sa vezi toate activitatile in 'Activitate Recenta'!")
    print("=" * 60 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_activity_logs())
