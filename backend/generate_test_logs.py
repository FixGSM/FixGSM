"""
Generate test logs for the FixGSM logging system
"""
import asyncio
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import random
import uuid

load_dotenv()

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
db_name = os.getenv("DB_NAME", "fixgsm_db")

async def generate_test_logs():
    """Generate test logs for demonstration"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Generare log-uri de test...")
    print("=" * 50)
    
    # Test log entries
    test_logs = [
        {
            "log_type": "activity",
            "level": "info",
            "category": "auth",
            "message": "Admin login successful: admin@fixgsm.com",
            "user_email": "admin@fixgsm.com",
            "user_id": "admin-001",
            "ip_address": "192.168.1.100",
        },
        {
            "log_type": "activity",
            "level": "warning",
            "category": "auth",
            "message": "Failed login attempt for tenant: office@brandmobile.ro",
            "user_email": "office@brandmobile.ro",
            "ip_address": "192.168.1.105",
            "metadata": {"reason": "Invalid password"}
        },
        {
            "log_type": "activity",
            "level": "info",
            "category": "auth",
            "message": "Tenant login successful: office@brandmobile.ro",
            "user_email": "office@brandmobile.ro",
            "tenant_id": "tenant-001",
            "ip_address": "192.168.1.105",
        },
        {
            "log_type": "system",
            "level": "info",
            "category": "maintenance",
            "message": "System backup completed successfully",
            "metadata": {"backup_size": "12.5 MB", "duration": "45 seconds"}
        },
        {
            "log_type": "activity",
            "level": "error",
            "category": "api",
            "message": "Failed to create ticket: Database connection timeout",
            "user_email": "employee@brandmobile.ro",
            "tenant_id": "tenant-001",
            "metadata": {"error": "Connection timeout after 30s"}
        },
        {
            "log_type": "system",
            "level": "critical",
            "category": "database",
            "message": "Database connection pool exhausted",
            "metadata": {"active_connections": 100, "max_connections": 100}
        },
        {
            "log_type": "activity",
            "level": "warning",
            "category": "auth",
            "message": "Multiple failed login attempts detected",
            "user_email": "hacker@test.com",
            "ip_address": "10.0.0.50",
            "metadata": {"attempts": 5, "blocked": True}
        },
        {
            "log_type": "system",
            "level": "info",
            "category": "maintenance",
            "message": "Cleared 1523 logs older than 30 days",
            "user_id": "admin-001",
            "user_email": "admin@fixgsm.com"
        },
        {
            "log_type": "activity",
            "level": "info",
            "category": "user_action",
            "message": "Tenant created new service ticket: #BMA123",
            "user_email": "office@brandmobile.ro",
            "tenant_id": "tenant-001",
            "metadata": {"ticket_id": "BMA123", "client": "Ion Popescu"}
        },
        {
            "log_type": "activity",
            "level": "info",
            "category": "user_action",
            "message": "Service ticket completed: #BMA123",
            "user_email": "employee@brandmobile.ro",
            "tenant_id": "tenant-001",
            "metadata": {"ticket_id": "BMA123", "status": "completed"}
        },
        {
            "log_type": "system",
            "level": "warning",
            "category": "api",
            "message": "API rate limit exceeded for IP: 203.0.113.45",
            "ip_address": "203.0.113.45",
            "metadata": {"requests": 1000, "limit": 100, "window": "1 minute"}
        },
        {
            "log_type": "activity",
            "level": "error",
            "category": "auth",
            "message": "Failed to authenticate: Invalid JWT token",
            "user_email": "unknown@test.com",
            "metadata": {"reason": "Token expired"}
        },
        {
            "log_type": "system",
            "level": "info",
            "category": "maintenance",
            "message": "Server restart initiated by admin",
            "user_id": "admin-001",
            "user_email": "admin@fixgsm.com"
        },
        {
            "log_type": "activity",
            "level": "warning",
            "category": "user_action",
            "message": "Failed to delete ticket: Permission denied",
            "user_email": "employee@brandmobile.ro",
            "tenant_id": "tenant-001",
            "metadata": {"ticket_id": "BMA456", "reason": "Insufficient permissions"}
        },
        {
            "log_type": "system",
            "level": "critical",
            "category": "database",
            "message": "MongoDB replica set primary election in progress",
            "metadata": {"replica_set": "rs0", "status": "election"}
        }
    ]
    
    # Generate logs with timestamps spread over last 24 hours
    inserted_count = 0
    for i, log_data in enumerate(test_logs):
        # Create timestamp going back in time
        hours_ago = len(test_logs) - i
        timestamp = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
        
        log_entry = {
            "log_id": str(uuid.uuid4()),
            **log_data,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "created_at": timestamp.isoformat(),
            "timestamp": timestamp.timestamp(),
            "metadata": log_data.get("metadata", {})
        }
        
        await db["logs"].insert_one(log_entry)
        inserted_count += 1
        
        # Print log info
        level_symbol = {
            "info": "[INFO]",
            "warning": "[WARN]",
            "error": "[ERROR]",
            "critical": "[CRIT]"
        }
        print(f"{level_symbol.get(log_data['level'], '[LOG]')} {log_data['message']}")
    
    print("=" * 50)
    print(f"SUCCESS: {inserted_count} log-uri generate cu succes!")
    print()
    print("Acum acceseaza: Admin Dashboard -> Logs")
    print("Ar trebui sa vezi toate log-urile generate!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_test_logs())

