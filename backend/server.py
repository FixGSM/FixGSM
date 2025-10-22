from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
from pdf_generator import FixGSMPDFGenerator

ROOT_DIR = Path(__file__).parent.resolve()
env_path = ROOT_DIR / '.env'
load_dotenv(env_path)

# MongoDB connection with SSL options
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsAllowInvalidCertificates=True,
    tlsAllowInvalidHostnames=True,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    retryWrites=True
)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'fixgsm-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="FixGSM API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Track server start time for uptime calculation
server_start_time = datetime.now(timezone.utc)

# ============ ENUMS ============
class UserRole(str, Enum):
    RECEPTIE = "Receptie"
    MANAGER = "Manager"
    TECHNICIAN = "Technician"

class SubscriptionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"

# ============ PERMISSIONS SYSTEM ============
class Permission(str, Enum):
    # Tickets
    VIEW_TICKETS = "view_tickets"
    CREATE_TICKETS = "create_tickets"
    EDIT_TICKETS = "edit_tickets"
    DELETE_TICKETS = "delete_tickets"
    ASSIGN_TICKETS = "assign_tickets"
    
    # Clients
    VIEW_CLIENTS = "view_clients"
    CREATE_CLIENTS = "create_clients"
    EDIT_CLIENTS = "edit_clients"
    DELETE_CLIENTS = "delete_clients"
    
    # Employees
    VIEW_EMPLOYEES = "view_employees"
    CREATE_EMPLOYEES = "create_employees"
    EDIT_EMPLOYEES = "edit_employees"
    DELETE_EMPLOYEES = "delete_employees"
    
    # Locations
    VIEW_LOCATIONS = "view_locations"
    CREATE_LOCATIONS = "create_locations"
    EDIT_LOCATIONS = "edit_locations"
    DELETE_LOCATIONS = "delete_locations"
    
    # Roles
    VIEW_ROLES = "view_roles"
    CREATE_ROLES = "create_roles"
    EDIT_ROLES = "edit_roles"
    DELETE_ROLES = "delete_roles"
    
    # Settings
    VIEW_SETTINGS = "view_settings"
    EDIT_SETTINGS = "edit_settings"
    
    # AI
    USE_AI = "use_ai"
    CONFIGURE_AI = "configure_ai"
    
    # Reports
    VIEW_REPORTS = "view_reports"
    EXPORT_REPORTS = "export_reports"
    
    # Financial
    VIEW_FINANCIAL = "view_financial"
    EDIT_FINANCIAL = "edit_financial"

# Default role configurations
DEFAULT_ROLES = {
    "Receptie": {
        "name": "Recepție",
        "description": "Personal de recepție - gestionează clienți și creează tichete",
        "permissions": [
            Permission.VIEW_TICKETS,
            Permission.CREATE_TICKETS,
            Permission.EDIT_TICKETS,
            Permission.VIEW_CLIENTS,
            Permission.CREATE_CLIENTS,
            Permission.EDIT_CLIENTS,
            Permission.USE_AI,
        ]
    },
    "Technician": {
        "name": "Tehnician",
        "description": "Tehnician service - repară dispozitive și actualizează tichete",
        "permissions": [
            Permission.VIEW_TICKETS,
            Permission.EDIT_TICKETS,
            Permission.VIEW_CLIENTS,
            Permission.USE_AI,
        ]
    },
    "Manager": {
        "name": "Manager",
        "description": "Manager service - acces complet la toate funcționalitățile",
        "permissions": [
            Permission.VIEW_TICKETS,
            Permission.CREATE_TICKETS,
            Permission.EDIT_TICKETS,
            Permission.DELETE_TICKETS,
            Permission.ASSIGN_TICKETS,
            Permission.VIEW_CLIENTS,
            Permission.CREATE_CLIENTS,
            Permission.EDIT_CLIENTS,
            Permission.DELETE_CLIENTS,
            Permission.VIEW_EMPLOYEES,
            Permission.CREATE_EMPLOYEES,
            Permission.EDIT_EMPLOYEES,
            Permission.DELETE_EMPLOYEES,
            Permission.VIEW_LOCATIONS,
            Permission.CREATE_LOCATIONS,
            Permission.EDIT_LOCATIONS,
            Permission.DELETE_LOCATIONS,
            Permission.VIEW_ROLES,
            Permission.EDIT_ROLES,
            Permission.VIEW_SETTINGS,
            Permission.EDIT_SETTINGS,
            Permission.USE_AI,
            Permission.CONFIGURE_AI,
            Permission.VIEW_REPORTS,
            Permission.EXPORT_REPORTS,
            Permission.VIEW_FINANCIAL,
            Permission.EDIT_FINANCIAL,
        ]
    }
}

# ============ PYDANTIC MODELS ============

# Auth Models
class ServiceOnboarding(BaseModel):
    owner_name: str
    company_name: str
    cui: str
    service_name: str
    address: str
    phone: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user_type: str  # admin, tenant_owner, employee
    tenant_id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    role: Optional[str] = None

class UserInfo(BaseModel):
    user_id: str
    email: str
    name: str
    user_type: str
    tenant_id: Optional[str] = None
    role: Optional[str] = None
    location_id: Optional[str] = None

# Tenant Models
class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tenant_id: str
    owner_name: str
    company_name: str
    cui: str
    service_name: str
    address: str
    phone: str
    email: str
    subscription_status: str = SubscriptionStatus.PENDING
    subscription_plan: str = "Basic"
    subscription_price: float = 0.0
    custom_statuses: List[dict] = []
    created_at: str
    activated_at: Optional[str] = None

# Location Models
class LocationCreate(BaseModel):
    location_name: str
    address: str

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    location_id: str
    tenant_id: str
    location_name: str
    address: str
    created_at: str

# User/Employee Models
class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    location_id: str

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    tenant_id: str
    location_id: str
    name: str
    email: str
    role: str
    created_at: str

# Role Models
class RoleCreate(BaseModel):
    role_id: str
    name: str
    description: Optional[str] = ""
    permissions: List[str] = []
    is_custom: bool = True

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class RoleResponse(BaseModel):
    role_id: str
    name: str
    description: str
    permissions: List[str]
    is_custom: bool
    is_system: bool = False
    users_count: Optional[int] = 0

# Ticket Models
class TicketCreate(BaseModel):
    client_name: str
    client_phone: str
    device_model: str
    imei: Optional[str] = ""
    visual_aspect: Optional[str] = ""
    reported_issue: str
    service_operations: Optional[str] = ""
    access_code: Optional[str] = ""
    colors: Optional[str] = ""
    defect_cause: Optional[str] = ""
    observations: Optional[str] = ""
    estimated_cost: float = 0.0
    urgent: bool = False
    location_id: str

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ticket_id: str
    tenant_id: str
    location_id: str
    created_by_user_id: str
    client_name: str
    client_phone: str
    device_model: str
    imei: Optional[str] = ""
    visual_aspect: Optional[str] = ""
    reported_issue: str
    service_operations: Optional[str] = ""
    access_code: Optional[str] = ""
    colors: Optional[str] = ""
    defect_cause: Optional[str] = ""
    observations: Optional[str] = ""
    estimated_cost: float = 0.0
    urgent: bool = False
    status: str = "Dispozitiv Receptionat"
    created_at: str
    updated_at: str

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    service_operations: Optional[str] = None
    defect_cause: Optional[str] = None
    observations: Optional[str] = None
    estimated_cost: Optional[float] = None

class CustomStatusCreate(BaseModel):
    category: str  # NOU, INLUCRU, INASTEPTARE, FINALIZAT, ANULAT
    label: str
    color: str  # hex color
    icon: Optional[str] = "circle"  # icon name
    description: Optional[str] = ""
    order: Optional[int] = 0
    is_final: Optional[bool] = False  # dacă statusul marchează un ticket ca finalizat
    requires_note: Optional[bool] = False  # dacă statusul necesită notă obligatorie

class CustomStatusUpdate(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_final: Optional[bool] = None
    requires_note: Optional[bool] = None

# Company/Brand Models
class CompanyInfoUpdate(BaseModel):
    company_name: Optional[str] = None
    service_name: Optional[str] = None
    cui: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

# Client Portal Models
class ClientCheckStatus(BaseModel):
    phone: str
    ticket_number: str

# Admin Models
class ActivateServiceRequest(BaseModel):
    subscription_price: float

class UpdateSubscriptionPrice(BaseModel):
    price: float

# Stats Models
class DashboardStats(BaseModel):
    total_tickets: int
    total_cost: float
    by_status: dict

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    print(f"DEBUG: get_current_user called with token: {token[:50]}...")
    payload = decode_token(token)
    print(f"DEBUG: Decoded payload: {payload}")
    return payload

# ============ PERMISSION HELPERS ============

async def get_user_permissions(user: dict) -> List[str]:
    """Get all permissions for a user based on their role"""
    # Admin and tenant_owner have all permissions
    if user["user_type"] in ["admin", "tenant_owner"]:
        return [perm.value for perm in Permission]
    
    # Get role from tenant's roles collection
    tenant_id = user.get("tenant_id")
    user_role = user.get("role")
    
    if not tenant_id or not user_role:
        return []
    
    # Check custom roles first
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if tenant and "roles" in tenant:
        for role in tenant["roles"]:
            if role["role_id"] == user_role:
                return role.get("permissions", [])
    
    # Fallback to default roles
    if user_role in DEFAULT_ROLES:
        return [perm.value for perm in DEFAULT_ROLES[user_role]["permissions"]]
    
    return []

async def check_permission(user: dict, required_permission: Permission) -> bool:
    """Check if user has a specific permission"""
    permissions = await get_user_permissions(user)
    return required_permission.value in permissions

def require_permission(permission: Permission):
    """Decorator to require a specific permission"""
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        if not await check_permission(current_user, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {permission.value} required"
            )
        return current_user
    return permission_checker

def generate_ticket_id() -> str:
    """Generate ticket ID like BMP268"""
    import random
    prefix = "BMP"
    number = random.randint(100, 999)
    return f"{prefix}{number}"

# ============ AUTH ROUTES ============

@api_router.post("/auth/register-service", response_model=dict)
async def register_service(data: ServiceOnboarding):
    # Check if email exists
    existing = await db.tenants.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = str(uuid.uuid4())
    hashed_pw = hash_password(data.password)
    
    # Set trial period: 14 days from now
    now = datetime.now(timezone.utc)
    trial_end_date = now + timedelta(days=14)
    
    tenant_doc = {
        "tenant_id": tenant_id,
        "owner_name": data.owner_name,
        "company_name": data.company_name,
        "cui": data.cui,
        "service_name": data.service_name,
        "address": data.address,
        "phone": data.phone,
        "email": data.email,
        "password_hash": hashed_pw,
        "subscription_status": SubscriptionStatus.PENDING,
        "subscription_plan": "Trial",
        "subscription_price": 0.0,
        "subscription_end_date": trial_end_date.isoformat(),
        "is_trial": True,
        "trial_started_at": now.isoformat(),
        "custom_statuses": [
            {"category": "NOU", "label": "Dispozitiv Receptionat", "color": "#3b82f6"},
            {"category": "NOU", "label": "In Garantie", "color": "#3b82f6"},
            {"category": "INLUCRU", "label": "In curs de Reparatie", "color": "#06b6d4"},
            {"category": "INLUCRU", "label": "Verificare Finala", "color": "#06b6d4"},
            {"category": "INASTEPTARE", "label": "Asteptare Piesa", "color": "#f59e0b"},
        ],
        "created_at": now.isoformat(),
        "activated_at": None
    }
    
    await db.tenants.insert_one(tenant_doc)
    
    return {"message": "Service registered successfully. Waiting for admin approval.", "tenant_id": tenant_id}

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest, request: Request = None):
    print(f"\n========== LOGIN ATTEMPT ==========")
    print(f"Email: {data.email}")
    print(f"Password: {data.password}")
    
    # Get client info for logging
    client_ip = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    
    # Check if admin
    admin = await db.admin_users.find_one({"email": data.email})
    print(f"Admin found: {admin is not None}")
    if admin:
        if not verify_password(data.password, admin["password_hash"]):
            # Log failed login attempt
            await create_log(
                log_type="activity",
                level="warning",
                category="auth",
                message=f"Failed login attempt for admin: {data.email}",
                user_email=data.email,
                ip_address=client_ip,
                user_agent=user_agent,
                metadata={"reason": "Invalid password"}
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token({
            "user_id": admin["admin_id"],
            "user_type": "admin",
            "email": data.email
        })
        
        # Log successful login
        await create_log(
            log_type="activity",
            level="info",
            category="auth",
            message=f"Admin login successful: {data.email}",
            user_id=admin["admin_id"],
            user_email=data.email,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return LoginResponse(
            token=token,
            user_type="admin",
            user_id=admin["admin_id"],
            name="Admin"
        )
    
    # Check if tenant owner
    tenant = await db.tenants.find_one({"email": data.email})
    print(f"Tenant found: {tenant is not None}")
    if tenant:
        if not verify_password(data.password, tenant["password_hash"]):
            await create_log(
                log_type="activity",
                level="warning",
                category="auth",
                message=f"Failed login attempt for tenant: {data.email}",
                user_email=data.email,
                tenant_id=tenant.get("tenant_id"),
                ip_address=client_ip,
                user_agent=user_agent,
                metadata={"reason": "Invalid password"}
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check subscription status and expiry
        subscription_status = tenant["subscription_status"]
        subscription_end_date = tenant.get("subscription_end_date")
        has_grace_period = tenant.get("has_grace_period", False)
        
        # Check if subscription is expired (unless grace period is active)
        is_expired = False
        if subscription_end_date and subscription_status == SubscriptionStatus.ACTIVE:
            from datetime import datetime, timezone
            try:
                end_date = datetime.fromisoformat(subscription_end_date.replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)
                is_expired = (end_date - now).days < 0
            except:
                pass
        
        if subscription_status != SubscriptionStatus.ACTIVE:
            if subscription_status == SubscriptionStatus.SUSPENDED:
                raise HTTPException(status_code=403, detail="Cont suspendat. Contactează administratorul.")
            else:
                raise HTTPException(status_code=403, detail="Contul nu este activat. Te rugăm să aștepți aprobarea administratorului.")
        
        # Check if subscription is expired and no grace period
        if is_expired and not has_grace_period:
            raise HTTPException(
                status_code=403, 
                detail="Abonamentul a expirat. Te rugăm să plătești pentru a continua să folosești serviciile."
            )
        
        token = create_access_token({
            "user_id": tenant["tenant_id"],
            "user_type": "tenant_owner",
            "tenant_id": tenant["tenant_id"],
            "email": data.email
        })
        
        # Log successful login
        await create_log(
            log_type="activity",
            level="info",
            category="auth",
            message=f"Tenant login successful: {data.email}",
            user_id=tenant["tenant_id"],
            user_email=data.email,
            tenant_id=tenant["tenant_id"],
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return LoginResponse(
            token=token,
            user_type="tenant_owner",
            tenant_id=tenant["tenant_id"],
            user_id=tenant["tenant_id"],
            name=tenant["owner_name"]
        )
    
    # Check if employee
    employee = await db.users.find_one({"email": data.email})
    print(f"Employee found: {employee is not None}")
    if not employee:
        # Try case-insensitive search
        employee = await db.users.find_one({"email": {"$regex": f"^{data.email}$", "$options": "i"}})
        print(f"Employee found (case-insensitive): {employee is not None}")
    if employee:
        print(f"Employee name: {employee.get('name')}")
        print(f"Employee tenant_id: {employee.get('tenant_id')}")
        password_valid = verify_password(data.password, employee["password_hash"])
        print(f"Password valid: {password_valid}")
        if not password_valid:
            await create_log(
                log_type="activity",
                level="warning",
                category="auth",
                message=f"Failed login attempt for employee: {data.email}",
                user_email=data.email,
                tenant_id=employee.get("tenant_id"),
                ip_address=client_ip,
                user_agent=user_agent,
                metadata={"reason": "Invalid password"}
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if tenant is active and subscription not expired
        tenant = await db.tenants.find_one({"tenant_id": employee["tenant_id"]})
        if not tenant:
            raise HTTPException(status_code=403, detail="Serviciul nu există")
        
        subscription_status = tenant["subscription_status"]
        subscription_end_date = tenant.get("subscription_end_date")
        has_grace_period = tenant.get("has_grace_period", False)
        
        # Check if subscription is expired (unless grace period is active)
        is_expired = False
        if subscription_end_date and subscription_status == SubscriptionStatus.ACTIVE:
            from datetime import datetime, timezone
            try:
                end_date = datetime.fromisoformat(subscription_end_date.replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)
                is_expired = (end_date - now).days < 0
            except:
                pass
        
        if subscription_status != SubscriptionStatus.ACTIVE:
            if subscription_status == SubscriptionStatus.SUSPENDED:
                raise HTTPException(status_code=403, detail="Serviciul este suspendat. Contactează administratorul.")
            else:
                raise HTTPException(status_code=403, detail="Serviciul nu este activat")
        
        # Check if subscription is expired and no grace period
        if is_expired and not has_grace_period:
            raise HTTPException(
                status_code=403, 
                detail="Abonamentul serviciului a expirat. Contactează administratorul pentru reînnoire."
            )
        
        token = create_access_token({
            "user_id": employee["user_id"],
            "user_type": "employee",
            "tenant_id": employee["tenant_id"],
            "role": employee["role"],
            "location_id": employee["location_id"],
            "email": data.email
        })
        
        # Log successful login
        await create_log(
            log_type="activity",
            level="info",
            category="auth",
            message=f"Employee login successful: {data.email}",
            user_id=employee["user_id"],
            user_email=data.email,
            tenant_id=employee["tenant_id"],
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return LoginResponse(
            token=token,
            user_type="employee",
            tenant_id=employee["tenant_id"],
            user_id=employee["user_id"],
            name=employee["name"],
            role=employee["role"]
        )
    
    print("No user found - raising Invalid credentials")
    
    # Log failed login attempt for non-existent user
    await create_log(
        log_type="activity",
        level="warning",
        category="auth",
        message=f"Failed login attempt for non-existent user: {data.email}",
        user_email=data.email,
        ip_address=client_ip,
        user_agent=user_agent,
        metadata={"reason": "User not found"}
    )
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/auth/me", response_model=UserInfo)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserInfo(
        user_id=current_user["user_id"],
        email=current_user["email"],
        name="User",
        user_type=current_user["user_type"],
        tenant_id=current_user.get("tenant_id"),
        role=current_user.get("role"),
        location_id=current_user.get("location_id")
    )

# ============ ADMIN ROUTES ============

@api_router.get("/admin/pending-services", response_model=List[Tenant])
async def get_pending_services(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tenants = await db.tenants.find(
        {"subscription_status": SubscriptionStatus.PENDING},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    
    return tenants

@api_router.post("/admin/activate-service/{tenant_id}")
async def activate_service(
    tenant_id: str,
    data: ActivateServiceRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {
            "$set": {
                "subscription_status": SubscriptionStatus.ACTIVE,
                "subscription_price": data.subscription_price,
                "activated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service activated successfully"}

@api_router.get("/admin/statistics")
async def get_admin_statistics(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from datetime import datetime, timedelta
    
    total_services = await db.tenants.count_documents({})
    active_services = await db.tenants.count_documents({"subscription_status": SubscriptionStatus.ACTIVE})
    pending_services = await db.tenants.count_documents({"subscription_status": SubscriptionStatus.PENDING})
    
    # Calculate total revenue
    active_tenants = await db.tenants.find(
        {"subscription_status": SubscriptionStatus.ACTIVE},
        {"subscription_price": 1}
    ).to_list(1000)
    
    total_revenue = sum(t.get("subscription_price", 0) for t in active_tenants)
    
    # Get total tickets count across all tenants
    total_tickets = await db["tickets"].count_documents({})
    
    # Get active users count (users with recent activity)
    seven_days_ago = datetime.now() - timedelta(days=7)
    active_users_count = await db["users"].count_documents({
        "last_login": {"$gte": seven_days_ago.isoformat()}
    })
    
    # Get AI API calls count in last 24 hours
    one_day_ago = datetime.now() - timedelta(days=1)
    api_calls_24h = await db["ai_messages"].count_documents({
        "created_at": {"$gte": one_day_ago.isoformat()}
    })
    
    return {
        "total_services": total_services,
        "active_services": active_services,
        "pending_services": pending_services,
        "total_revenue": total_revenue,
        "total_tickets": total_tickets,
        "active_users": active_users_count,
        "api_calls_24h": api_calls_24h,
        "uptime_percent": 99.9
    }

@api_router.get("/admin/all-tenants", response_model=List[Tenant])
async def get_all_tenants(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tenants = await db.tenants.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return tenants

@api_router.put("/admin/subscription-price/{tenant_id}")
async def update_subscription_price(
    tenant_id: str,
    data: UpdateSubscriptionPrice,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"subscription_price": data.price}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Subscription price updated"}

# ============ TENANT/SERVICE OWNER ROUTES ============

@api_router.get("/tenant/dashboard-stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user["tenant_id"]
    
    # Get all tickets for this tenant
    tickets = await db.tickets.find({"tenant_id": tenant_id}).to_list(10000)
    
    total_tickets = len(tickets)
    total_cost = sum(t.get("estimated_cost", 0) for t in tickets)
    
    # Group by status
    by_status = {}
    for ticket in tickets:
        status = ticket.get("status", "Unknown")
        if status not in by_status:
            by_status[status] = {"count": 0, "total_cost": 0}
        by_status[status]["count"] += 1
        by_status[status]["total_cost"] += ticket.get("estimated_cost", 0)
    
    return DashboardStats(
        total_tickets=total_tickets,
        total_cost=total_cost,
        by_status=by_status
    )

@api_router.post("/tenant/locations", response_model=Location)
async def create_location(
    data: LocationCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "tenant_owner":
        raise HTTPException(status_code=403, detail="Only service owner can create locations")
    
    # Check plan limits
    tenant = await db["tenants"].find_one({"tenant_id": current_user["tenant_id"]})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    current_plan = tenant.get("subscription_plan", "Trial")
    
    # Get plan limits from database
    plan_doc = await db["subscription_plans"].find_one({"plan_id": current_plan.lower()})
    if plan_doc and "limits" in plan_doc:
        max_locations = plan_doc["limits"].get("locations", 1)
    else:
        # Fallback to hardcoded limits
        plan_limits = {
            "Trial": 1,
            "Basic": 1,
            "Pro": 5,
            "Enterprise": 999
        }
        max_locations = plan_limits.get(current_plan, 1)
    
    # Count existing locations
    existing_count = await db.locations.count_documents({"tenant_id": current_user["tenant_id"]})
    
    if existing_count >= max_locations:
        raise HTTPException(
            status_code=403, 
            detail=f"Limita de locații pentru planul {current_plan} este {max_locations}. Upgrade pentru mai multe locații."
        )
    
    location_id = str(uuid.uuid4())
    
    location_doc = {
        "location_id": location_id,
        "tenant_id": current_user["tenant_id"],
        "location_name": data.location_name,
        "address": data.address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.locations.insert_one(location_doc)
    
    # Log location creation
    await create_log(
        log_type="activity",
        level="info",
        category="settings",
        message=f"Location created: {data.location_name} - Address: {data.address}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=current_user["tenant_id"],
        metadata={
            "location_id": location_id,
            "location_name": data.location_name,
            "address": data.address
        }
    )
    
    return Location(**location_doc)

@api_router.get("/tenant/locations", response_model=List[Location])
async def get_locations(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    locations = await db.locations.find(
        {"tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return locations

@api_router.post("/tenant/employees", response_model=Employee)
async def create_employee(
    data: EmployeeCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "tenant_owner":
        raise HTTPException(status_code=403, detail="Only service owner can create employees")
    
    # Check plan limits
    tenant = await db["tenants"].find_one({"tenant_id": current_user["tenant_id"]})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    current_plan = tenant.get("subscription_plan", "Trial")
    
    # Get plan limits from database
    plan_doc = await db["subscription_plans"].find_one({"plan_id": current_plan.lower()})
    if plan_doc and "limits" in plan_doc:
        max_employees = plan_doc["limits"].get("employees", 3)
    else:
        # Fallback to hardcoded limits
        plan_limits = {
            "Trial": 3,
            "Basic": 3,
            "Pro": 15,
            "Enterprise": 999
        }
        max_employees = plan_limits.get(current_plan, 3)
    
    # Count existing employees
    existing_count = await db.users.count_documents({"tenant_id": current_user["tenant_id"]})
    
    if existing_count >= max_employees:
        raise HTTPException(
            status_code=403, 
            detail=f"Limita de angajați pentru planul {current_plan} este {max_employees}. Upgrade pentru mai mulți angajați."
        )
    
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(data.password)
    
    employee_doc = {
        "user_id": user_id,
        "tenant_id": current_user["tenant_id"],
        "location_id": data.location_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hashed_pw,
        "role": data.role.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(employee_doc)
    
    # Log employee creation
    await create_log(
        log_type="activity",
        level="info",
        category="settings",
        message=f"Employee created: {data.name} ({data.email}) - Role: {data.role.value}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=current_user["tenant_id"],
        metadata={
            "employee_id": user_id,
            "employee_name": data.name,
            "employee_email": data.email,
            "role": data.role.value,
            "location_id": data.location_id
        }
    )
    
    return Employee(**{k: v for k, v in employee_doc.items() if k != "password_hash"})

@api_router.get("/tenant/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "tenant_owner":
        raise HTTPException(status_code=403, detail="Only service owner can view employees")
    
    employees = await db.users.find(
        {"tenant_id": current_user["tenant_id"]},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    
    return employees

@api_router.put("/tenant/employees/{user_id}/role")
async def update_employee_role(
    user_id: str,
    role: UserRole,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "tenant_owner":
        raise HTTPException(status_code=403, detail="Only service owner can update roles")
    
    result = await db.users.update_one(
        {"user_id": user_id, "tenant_id": current_user["tenant_id"]},
        {"$set": {"role": role.value}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return {"message": "Role updated"}

@api_router.put("/tenant/employees/{user_id}/location")
async def update_employee_location(
    user_id: str,
    location_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "tenant_owner":
        raise HTTPException(status_code=403, detail="Only service owner can update location")
    
    result = await db.users.update_one(
        {"user_id": user_id, "tenant_id": current_user["tenant_id"]},
        {"$set": {"location_id": location_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return {"message": "Location updated"}

@api_router.post("/tenant/custom-statuses")
async def add_custom_status(
    data: CustomStatusCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only service owner can manage statuses")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Generate unique ID for status
    import uuid
    status_obj = data.model_dump()
    status_obj["status_id"] = str(uuid.uuid4())
    status_obj["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$push": {"custom_statuses": status_obj}}
    )
    
    return {"message": "Status added successfully", "status": status_obj}

@api_router.get("/tenant/custom-statuses")
async def get_custom_statuses(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        return {"statuses": []}
    
    tenant = await db.tenants.find_one(
        {"tenant_id": tenant_id},
        {"custom_statuses": 1}
    )
    
    if not tenant:
        return {"statuses": []}
    
    statuses = tenant.get("custom_statuses", [])
    # Sort by order
    statuses_sorted = sorted(statuses, key=lambda x: x.get("order", 0))
    
    return {"statuses": statuses_sorted}

@api_router.put("/tenant/custom-statuses/{status_id}")
async def update_custom_status(
    status_id: str,
    data: CustomStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only service owner can manage statuses")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Build update document
    update_fields = {}
    if data.label is not None:
        update_fields["custom_statuses.$.label"] = data.label
    if data.color is not None:
        update_fields["custom_statuses.$.color"] = data.color
    if data.icon is not None:
        update_fields["custom_statuses.$.icon"] = data.icon
    if data.description is not None:
        update_fields["custom_statuses.$.description"] = data.description
    if data.order is not None:
        update_fields["custom_statuses.$.order"] = data.order
    if data.is_final is not None:
        update_fields["custom_statuses.$.is_final"] = data.is_final
    if data.requires_note is not None:
        update_fields["custom_statuses.$.requires_note"] = data.requires_note
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields["custom_statuses.$.updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id, "custom_statuses.status_id": status_id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Status not found")
    
    return {"message": "Status updated successfully"}

@api_router.delete("/tenant/custom-statuses/{status_id}")
async def delete_custom_status(
    status_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only service owner can manage statuses")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$pull": {"custom_statuses": {"status_id": status_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Status not found")
    
    return {"message": "Status deleted successfully"}

# ============ COMPANY INFO ENDPOINTS ============

@api_router.get("/tenant/company-info")
async def get_company_info(current_user: dict = Depends(get_current_user)):
    """Get company information for the current tenant"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        return {}
    
    tenant = await db.tenants.find_one(
        {"tenant_id": tenant_id},
        {"company_name": 1, "service_name": 1, "cui": 1, "address": 1, "phone": 1, "email": 1, "company_info": 1, "_id": 0}
    )
    
    if not tenant:
        return {}
    
    # Merge old fields with new company_info object
    company_info = tenant.get("company_info", {})
    return {
        "company_name": company_info.get("company_name") or tenant.get("company_name", ""),
        "service_name": company_info.get("service_name") or tenant.get("service_name", ""),
        "cui": company_info.get("cui") or tenant.get("cui", ""),
        "address": company_info.get("address") or tenant.get("address", ""),
        "phone": company_info.get("phone") or tenant.get("phone", ""),
        "email": company_info.get("email") or tenant.get("email", ""),
        "website": company_info.get("website", ""),
        "logo_url": company_info.get("logo_url", "")
    }

@api_router.put("/tenant/company-info")
async def update_company_info(
    data: CompanyInfoUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update company information for the current tenant"""
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only admins and tenant owners can update company info")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Build update document
    update_fields = {}
    company_info_fields = {}
    
    if data.company_name is not None:
        company_info_fields["company_name"] = data.company_name
        update_fields["company_name"] = data.company_name  # Keep old field for compatibility
    if data.service_name is not None:
        company_info_fields["service_name"] = data.service_name
        update_fields["service_name"] = data.service_name
    if data.cui is not None:
        company_info_fields["cui"] = data.cui
        update_fields["cui"] = data.cui
    if data.address is not None:
        company_info_fields["address"] = data.address
        update_fields["address"] = data.address
    if data.phone is not None:
        company_info_fields["phone"] = data.phone
        update_fields["phone"] = data.phone
    if data.email is not None:
        company_info_fields["email"] = data.email
        update_fields["email"] = data.email
    if data.website is not None:
        company_info_fields["website"] = data.website
    if data.logo_url is not None:
        company_info_fields["logo_url"] = data.logo_url
    
    if not company_info_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update company_info object
    for key, value in company_info_fields.items():
        update_fields[f"company_info.{key}"] = value
    
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Log company info update
    changes = ", ".join([f"{k}: {v}" for k, v in company_info_fields.items()])
    await create_log(
        log_type="activity",
        level="info",
        category="settings",
        message=f"Company info updated - Changes: {changes[:200]}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=tenant_id,
        metadata={"changes": company_info_fields}
    )
    
    return {"message": "Company information updated successfully", "data": company_info_fields}

@api_router.put("/tenant/language")
async def update_language(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update language preference for the current tenant"""
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    language = data.get("language", "ro")
    if language not in ["ro", "en"]:
        raise HTTPException(status_code=400, detail="Invalid language. Must be 'ro' or 'en'")
    
    # Update tenant language
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"language": language, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Log language change
    await create_log(
        log_type="activity",
        level="info",
        category="settings",
        message=f"Language changed to: {language.upper()}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=tenant_id,
        metadata={"language": language}
    )
    
    return {"message": "Language updated successfully", "language": language}

@api_router.get("/tenant/language")
async def get_language(current_user: dict = Depends(get_current_user)):
    """Get language preference for the current tenant"""
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"language": tenant.get("language", "ro")}

# ============ CLIENTS (derived from tickets) =========

@api_router.get("/tenant/clients")
async def get_clients(current_user: dict = Depends(get_current_user)):
    """Return unique clients for the current tenant derived from tickets.
    A client is identified by the pair (client_name, client_phone).
    """
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")

    tenant_id = current_user["tenant_id"]

    # fetch all tickets for tenant (tenant-wide so employees also see full list)
    tickets = await db.tickets.find({"tenant_id": tenant_id}, {"_id": 0, "client_name": 1, "client_phone": 1, "created_at": 1}).to_list(10000)

    client_map = {}
    for t in tickets:
        name = t.get("client_name") or "-"
        phone = t.get("client_phone") or "-"
        key = f"{name}|{phone}"
        created_at = t.get("created_at")
        if key not in client_map:
            client_map[key] = {
                "client_id": key,
                "name": name,
                "phone": phone,
                "email": None,
                "created_at": created_at,
            }
        else:
            # keep the earliest creation date
            existing = client_map[key]
            if created_at and existing.get("created_at"):
                existing["created_at"] = min(existing["created_at"], created_at)
            elif created_at and not existing.get("created_at"):
                existing["created_at"] = created_at

    # return as list
    return list(client_map.values())

@api_router.get("/tenant/clients/search")
async def search_clients(query: str, current_user: dict = Depends(get_current_user)):
    """Search clients by name or phone for the current tenant."""
    print(f"DEBUG: Search clients called with query: '{query}' for tenant: {current_user.get('tenant_id')}")
    
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")

    tenant_id = current_user["tenant_id"]
    query_lower = query.lower().strip()
    
    if not query_lower:
        print("DEBUG: Empty query, returning empty list")
        return []

    # fetch all tickets for tenant
    tickets = await db.tickets.find({"tenant_id": tenant_id}, {"_id": 0, "client_name": 1, "client_phone": 1, "created_at": 1}).to_list(10000)
    print(f"DEBUG: Found {len(tickets)} tickets for tenant")

    client_map = {}
    for t in tickets:
        name = t.get("client_name") or "-"
        phone = t.get("client_phone") or "-"
        
        # Check if query matches name or phone
        if (query_lower in name.lower() or query_lower in phone.lower()):
            print(f"DEBUG: Match found - {name} ({phone})")
            key = f"{name}|{phone}"
            created_at = t.get("created_at")
            if key not in client_map:
                client_map[key] = {
                    "client_id": key,
                    "name": name,
                    "phone": phone,
                    "email": None,
                    "created_at": created_at,
                }
            else:
                # keep the earliest creation date
                existing = client_map[key]
                if created_at and existing.get("created_at"):
                    existing["created_at"] = min(existing["created_at"], created_at)
                elif created_at and not existing.get("created_at"):
                    existing["created_at"] = created_at

    result = list(client_map.values())[:10]
    print(f"DEBUG: Returning {len(result)} clients")
    return result

# ============ TICKET ROUTES ============

@api_router.post("/tickets", response_model=Ticket)
async def create_ticket(
    data: TicketCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    ticket_id = generate_ticket_id()
    
    ticket_doc = {
        "ticket_id": ticket_id,
        "tenant_id": current_user["tenant_id"],
        "location_id": data.location_id,
        "created_by_user_id": current_user["user_id"],
        "client_name": data.client_name,
        "client_phone": data.client_phone,
        "device_model": data.device_model,
        "imei": data.imei,
        "visual_aspect": data.visual_aspect,
        "reported_issue": data.reported_issue,
        "service_operations": data.service_operations,
        "access_code": data.access_code,
        "colors": data.colors,
        "defect_cause": data.defect_cause,
        "observations": data.observations,
        "estimated_cost": data.estimated_cost,
        "urgent": data.urgent,
        "status": "Dispozitiv Receptionat",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tickets.insert_one(ticket_doc)
    
    # Log ticket creation
    await create_log(
        log_type="activity",
        level="info",
        category="user_action",
        message=f"Ticket created: {ticket_id} - Client: {data.client_name} - Device: {data.device_model}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=current_user["tenant_id"],
        metadata={
            "ticket_id": ticket_id,
            "client_name": data.client_name,
            "device_model": data.device_model,
            "status": "Dispozitiv Receptionat",
            "urgent": data.urgent
        }
    )
    
    return Ticket(**ticket_doc)

@api_router.get("/tickets", response_model=List[Ticket])
async def get_tickets(
    location_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"tenant_id": current_user["tenant_id"]}
    
    # If employee, filter by their location
    if current_user["user_type"] == "employee":
        query["location_id"] = current_user["location_id"]
    elif location_id:  # If owner provides location filter
        query["location_id"] = location_id
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    return tickets

@api_router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    ticket = await db.tickets.find_one(
        {"ticket_id": ticket_id, "tenant_id": current_user["tenant_id"]},
        {"_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket

@api_router.put("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    data: TicketUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tickets.update_one(
        {"ticket_id": ticket_id, "tenant_id": current_user["tenant_id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Log ticket update
    changes = ", ".join([f"{k}: {v}" for k, v in update_data.items() if k != "updated_at"])
    await create_log(
        log_type="activity",
        level="info",
        category="user_action",
        message=f"Ticket updated: {ticket_id} - Changes: {changes[:200]}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=current_user["tenant_id"],
        metadata={
            "ticket_id": ticket_id,
            "changes": update_data
        }
    )
    
    return {"message": "Ticket updated"}

@api_router.delete("/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get ticket info before deletion for logging
    ticket = await db.tickets.find_one(
        {"ticket_id": ticket_id, "tenant_id": current_user["tenant_id"]}
    )
    
    result = await db.tickets.delete_one(
        {"ticket_id": ticket_id, "tenant_id": current_user["tenant_id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Log ticket deletion
    client_name = ticket.get("client_name", "Unknown") if ticket else "Unknown"
    device = ticket.get("device_model", "Unknown") if ticket else "Unknown"
    await create_log(
        log_type="activity",
        level="warning",
        category="user_action",
        message=f"Ticket deleted: {ticket_id} - Client: {client_name} - Device: {device}",
        user_id=current_user["user_id"],
        user_email=current_user.get("email"),
        tenant_id=current_user["tenant_id"],
        metadata={
            "ticket_id": ticket_id,
            "client_name": client_name,
            "device_model": device
        }
    )
    
    return {"message": "Ticket deleted"}

# ============ CLIENT PORTAL ROUTES ============

@api_router.post("/client-portal/check-status")
async def check_ticket_status(data: ClientCheckStatus):
    ticket = await db.tickets.find_one(
        {"ticket_id": data.ticket_number, "client_phone": data.phone},
        {"_id": 0}
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found or phone number doesn't match")
    
    return ticket

# ============ SEED ADMIN ============
@api_router.post("/seed-admin")
async def seed_admin():
    """Create default admin user"""
    existing = await db.admin_users.find_one({"email": "admin@fixgsm.com"})
    if existing:
        return {"message": "Admin already exists"}
    
    admin_doc = {
        "admin_id": str(uuid.uuid4()),
        "email": "admin@fixgsm.com",
        "password_hash": hash_password("admin123"),
        "role": "superadmin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_users.insert_one(admin_doc)
    
    return {"message": "Admin created", "email": "admin@fixgsm.com", "password": "admin123"}

# ============ AI CHAT ENDPOINTS ============

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to AI")
    conversation_history: List[dict] = Field(default=[], description="Previous conversation messages")
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response message")
    timestamp: str = Field(..., description="Response timestamp")
    conversation_id: str
    memorized: Optional[bool] = False

# Knowledge models
class KnowledgeCreate(BaseModel):
    content: str
    title: Optional[str] = None
    tags: Optional[List[str]] = []

class KnowledgeItem(BaseModel):
    knowledge_id: str
    title: str
    content: str
    tags: List[str]
    created_at: str
    updated_at: str

class CreateConversationResponse(BaseModel):
    conversation_id: str
    title: str
    created_at: str

class ConversationListItem(BaseModel):
    conversation_id: str
    title: str
    last_message_preview: Optional[str] = None
    updated_at: str

class ConversationMessagesResponse(BaseModel):
    conversation_id: str
    messages: List[dict]

@api_router.post("/ai/conversations", response_model=CreateConversationResponse)
async def create_conversation(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    conversation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "conversation_id": conversation_id,
        "tenant_id": current_user.get("tenant_id"),
        "user_id": current_user["user_id"],
        "title": "Conversație nouă",
        "created_at": now,
        "updated_at": now,
    }
    await db.ai_conversations.insert_one(doc)
    return CreateConversationResponse(conversation_id=conversation_id, title=doc["title"], created_at=now)

@api_router.get("/ai/conversations", response_model=List[ConversationListItem])
async def list_conversations(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    query = {"user_id": current_user["user_id"]}
    if current_user.get("tenant_id"):
        query["tenant_id"] = current_user["tenant_id"]
    items = await db.ai_conversations.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    # Attach last_message_preview if exists
    result = []
    for it in items:
        last_msg = await db.ai_messages.find({"conversation_id": it["conversation_id"]}, {"_id": 0}).sort("timestamp", -1).limit(1).to_list(1)
        preview = None
        if last_msg:
            preview = (last_msg[0].get("content") or "")[:120]
        result.append(ConversationListItem(
            conversation_id=it["conversation_id"],
            title=it.get("title", "Conversație"),
            last_message_preview=preview,
            updated_at=it.get("updated_at")
        ))
    return result

@api_router.get("/ai/conversations/{conversation_id}", response_model=ConversationMessagesResponse)
async def get_conversation_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    conv = await db.ai_conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # Optional ownership check
    if conv.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your conversation")
    msgs = await db.ai_messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", 1).to_list(10000)
    return ConversationMessagesResponse(conversation_id=conversation_id, messages=msgs)

@api_router.options("/ai/chat")
async def ai_chat_options():
    """Handle CORS preflight for AI chat endpoint"""
    return {"message": "OK"}

@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    AI Chat endpoint - integrat cu Google Gemini pentru FixGSM Platform
    """
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if AI is available in current plan
    tenant_id = current_user.get("tenant_id")
    if tenant_id:
        tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
        if tenant:
            current_plan = tenant.get("subscription_plan", "Trial")
            if current_plan in ["Trial", "Basic"]:
                raise HTTPException(
                    status_code=403, 
                    detail="AI Assistant nu este disponibil pentru planul Trial/Basic. Upgrade la Pro sau Enterprise pentru acces la AI."
                )
    
    # Ensure conversation exists or create one
    conversation_id = request.conversation_id
    now_iso = datetime.now(timezone.utc).isoformat()
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        conv_doc = {
            "conversation_id": conversation_id,
            "tenant_id": current_user.get("tenant_id"),
            "user_id": current_user["user_id"],
            "title": (request.message[:40] + "...") if len(request.message) > 40 else request.message,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        await db.ai_conversations.insert_one(conv_doc)
    else:
        await db.ai_conversations.update_one(
            {"conversation_id": conversation_id},
            {"$set": {"updated_at": now_iso}, "$setOnInsert": {"created_at": now_iso}}
        )

    # Fetch AI configuration for this tenant
    tenant_id = current_user.get("tenant_id")
    ai_config = {
        "enabled": True,
        "tone": "professional",
        "detail_level": "detailed",
        "language": "ro",
        "custom_prompt": "",
        "response_format": "structured",
        "include_sources": True,
        "auto_learn": True
    }
    
    if tenant_id:
        tenant = await db.tenants.find_one({"tenant_id": tenant_id})
        if tenant and "ai_config" in tenant:
            ai_config = tenant["ai_config"]
    
    # Check if AI is enabled for this tenant
    if not ai_config.get("enabled", True):
        raise HTTPException(status_code=403, detail="AI Assistant is disabled for your organization")
    
    try:
        import google.generativeai as genai
        import os
        
        # Configurează Google Gemini cu API key din .env
        api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Gemini API key not configured")
        
        genai.configure(api_key=api_key)
        
        # Inițializează modelul Gemini
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Build system prompt based on tenant configuration
        tone_instructions = {
            "professional": "Comunică profesional, exact și orientat spre soluții.",
            "friendly": "Comunică într-un mod prietenos și accesibil, menținând profesionalismul.",
            "technical": "Folosește terminologie tehnică avansată și detalii tehnice aprofundate. Vorbești ca un coleg de service GSM, pe scurt și la obiect."
        }
        
        detail_instructions = {
            "brief": "Oferă răspunsuri concise și directe, fără detalii suplimentare decât esențialul.",
            "balanced": "Oferă un echilibru între detalii și concizie, menționând aspectele importante fără a fi excesiv.",
            "detailed": "Oferă răspunsuri detaliate cu explicații complete, exemple și checklist-uri extinse."
        }
        
        format_instructions = {
            "structured": "Structurează ÎNTOTDEAUNA răspunsurile cu liste, bullet points și pași clari numerotați.",
            "conversational": "Răspunde într-un mod conversațional, natural și fluid, fără structuri rigide."
        }
        
        custom_section = ""
        if ai_config.get('custom_prompt'):
            custom_section = f"\n\nINSTRUCȚIUNI PERSONALIZATE (PRIORITARE):\n{ai_config.get('custom_prompt')}\n"
        
        # Sistem de prompt specializat pentru FixGSM Platform
        system_prompt = f"""
        Ești AI-ul tehnic al platformei FixGSM.
        
        CONFIGURARE PERSONALIZATĂ:
        - Ton comunicare: {tone_instructions.get(ai_config.get('tone', 'professional'), tone_instructions['technical'])}
        - Nivel detaliu: {detail_instructions.get(ai_config.get('detail_level', 'detailed'), detail_instructions['detailed'])}
        - Format răspuns: {format_instructions.get(ai_config.get('response_format', 'structured'), format_instructions['structured'])}
        - Limba obligatorie: ROMÂNĂ (RO)
        {custom_section}

        PRINCIPII DE COMUNICARE (OBLIGATORIU):
        - Răspunzi ÎNTOTDEAUNA în română, stil colegial, fără formalități inutile.
        - Oferi pași concreți, checklist-uri și posibile cauze cu probabilități.
        - Prioritizezi diagnosticul practic: ce să măsori, ce să verifici, ce piese să schimbi.
        - Sugerezi un flux de depanare de la simplu la complex.
        - Dacă lipsesc detalii (model, simptome, istoric), ceri clarificări punctuale.
        - Menționezi scule/metode: multimetru, alimentare de laborator, jig, loguri, diag apps.
        - Dacă există riscuri (pierdere garanție, ESD, date), le evidențiezi.
        - Evită texte vagi. Preferă bullet points și structură clară.

        CONTEXT FIXGSM:
        - Platformă de management pentru service GSM: fișe, clienți, reparații, piese, statusuri.
        - Public țintă: tehnicieni (junior/mediu/avansat) care vor răspunsuri aplicabile rapid.

        FORMAT DE RĂSPUNS RECOMANDAT:
        1) Rezumat scurt al problemei (1-2 linii)
        2) Posibile cauze (ordonate de la probabil la rar)
        3) Checklist de verificări (de la simplu la avansat)
        4) Pași de remediere/încercări rapide
        5) Când escaladezi (placă, micro-soldering, diag avansat)
        6) Note/precauții (ESD, backup, garanție)

        PLAYBOOK-URI TEHNICE (FOLOSEȘTE-LE CA GHID):
        • ÎNCĂRCARE/BATERIE
          - Cauze probabile: cablu/adaptor, port murdar, baterie uzată, Tristar/U2, PMIC, lichid
          - Checklist: alt cablu/adapter; inspectează/curăță port; măsoară consum pe alimentare de laborator; test baterie (tensiune, ciclu); loguri iOS/Android; semne oxidare
          - Remedieri rapide: curățare port; altă baterie de test; flex încărcare; reflow/înlocuire Tristar (iPhone); verificare linii VBUS/PP_BATT
        • ECRAN/DISPLAY
          - Cauze: ecran defect, conector/flex, backlight, driver, apă
          - Checklist: test ecran nou; inspectează conectori/pini; lanternă pt backlight; diag software (safe mode)
          - Remedieri: înlocuire ecran/flex; reflow driver/backlight; curățare conectori
        • AUDIO/MIC/DIFUZOR
          - Cauze: difuzor murdar/defect, microfon blocat, codec audio, setări, apă
          - Checklist: test apel/dictare/recorder; difuzor sus/jos; inspectează grile; test cu difuzor/placă de probă
          - Remedieri: curățare grile; înlocuire modul difuzor/mic; reflow/înlocuire codec audio dacă confirmat
        • SEMNAL/NETWORK
          - Cauze: antene/conectori, PA/duplexer, SIM/IMEI, cădere, firmware
          - Checklist: alt SIM; verifică IMEI/baseband; inspectează antene și pogo pins; test în altă zonă; diag *#*#4636#*#* (Android)
          - Remedieri: refixare antene; înlocuire conector; reflow/înlocuire PA; update/restore firmware
        • CAMERĂ
          - Cauze: modul cameră, OIS blocat, conexiuni, aplicație, șoc
          - Checklist: test cameră față/spate; altă aplicație; inspectează modul/conector; test cu modul de probă
          - Remedieri: înlocuire modul; curățare; reflow conector
        • APĂ/OXIDARE
          - Checklist: deconectează baterie; curăță ultrasonic; uscare controlată; inspecție microscop; măsurători scurt/rezistențe; căutare coroziune linii PP_MAIN
        • BOOTLOOP/NU PORNEȘTE
          - Checklist: alimentare de laborator (curbă consum), recovery/restore, măsurări linii principale (PP_VCC_MAIN etc.), izolare periferice
        • WI‑FI/BLUETOOTH
          - Checklist: toggle/firmware, antene/conectori, modul RF, temperaturi, loguri
        • SIM/IMEI
          - Checklist: test alt SIM, citire IMEI/baseband, inspecție SIM tray/contacte, reflash/restore
        • PLACĂ DE BAZĂ – NOTE
          - PMIC/Tristar/U2/baseband/PA/duplexer/audio codec/backlight pot necesita micro-soldering, diag avansat, schemă și boardview.

        Respectă formatul de mai sus cât de mult posibil. Fii util și concret.
        """
        
        # Memory capture: messages starting with prefixes will be stored as knowledge
        memorized_flag = False
        message_trim = (request.message or "").strip()
        lower = message_trim.lower()
        mem_prefixes = ["mem:", "memorize:", "memoreaza:", "rezolvare:"]
        for p in mem_prefixes:
            if lower.startswith(p):
                content_to_store = message_trim[len(p):].strip()
                if content_to_store:
                    nowk = datetime.now(timezone.utc).isoformat()
                    knowledge_id = str(uuid.uuid4())
                    doc = {
                        "knowledge_id": knowledge_id,
                        "tenant_id": current_user.get("tenant_id"),
                        "user_id": current_user["user_id"],
                        "title": (content_to_store[:60] + ("..." if len(content_to_store) > 60 else "")),
                        "content": content_to_store,
                        "tags": [],
                        "created_at": nowk,
                        "updated_at": nowk,
                    }
                    await db.ai_knowledge.insert_one(doc)
                    memorized_flag = True
                break

        # Construiește conversația cu context + injectează cunoștințele memorate (scurt)
        conversation_context = system_prompt + "\n\n"
        # Adaugă ultimele cunoștințe (max 5) pentru tenant
        try:
            kitems = await db.ai_knowledge.find({"tenant_id": current_user.get("tenant_id")}, {"_id": 0}).sort("updated_at", -1).limit(5).to_list(5)
            if kitems:
                conversation_context += "CUNOȘTINȚE MEMORIZATE (rezumate):\n"
                for ki in kitems:
                    conversation_context += f"- {ki.get('title','').strip()}\n"
                conversation_context += "\n"
        except Exception:
            pass
        
        # Adaugă istoricul conversației dacă există
        if request.conversation_history:
            for msg in request.conversation_history[-5:]:  # Ultimele 5 mesaje pentru context
                if msg.get('type') == 'user':
                    conversation_context += f"Utilizator: {msg.get('content', '')}\n"
                elif msg.get('type') == 'ai':
                    conversation_context += f"AI: {msg.get('content', '')}\n"
        
        # Adaugă mesajul curent
        conversation_context += f"Utilizator: {request.message}\nAI:"
        
        # Generează răspunsul cu Google Gemini
        response = model.generate_content(conversation_context)

        # Persist messages
        user_msg = {
            "conversation_id": conversation_id,
            "type": "user",
            "content": request.message,
            "timestamp": now_iso,
        }
        ai_msg = {
            "conversation_id": conversation_id,
            "type": "ai",
            "content": response.text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await db.ai_messages.insert_many([user_msg, ai_msg])
        await db.ai_conversations.update_one({"conversation_id": conversation_id}, {"$set": {"updated_at": ai_msg["timestamp"]}})
        
        return ChatResponse(
            response=response.text,
            timestamp=ai_msg["timestamp"],
            conversation_id=conversation_id,
            memorized=memorized_flag
        )
        
    except Exception as e:
        print(f"Error with Google Gemini: {e}")
        
        # Fallback la răspunsuri simple dacă Google Gemini nu funcționează
        message_lower = request.message.lower().strip()
        
        if any(word in message_lower for word in ['salut', 'bună', 'hello', 'hi', 'bună ziua', 'buna', 'hey']):
            response_text = "Salut! Sunt AI Assistant-ul oficial al platformei FixGSM. Cum te pot ajuta cu service-ul GSM astăzi?"
        elif any(word in message_lower for word in ['diagnostic', 'diagnosticare', 'problemă', 'probleme', 'defect', 'nu funcționează', 'nu merge']):
            response_text = "Pentru diagnosticarea problemelor GSM:\n• Verifică portul de încărcare pentru probleme de baterie\n• Testează butoanele și ecranul pentru defecte fizice\n• Verifică conexiunea la rețea pentru probleme de semnal\n• Testează camerele și microfonul pentru funcționalitate\n\nPentru probleme complexe, contactează un tehnician specializat.\n*Versiune beta - verifică informațiile importante*"
        else:
            response_text = "Îmi pare rău, nu am înțeles exact ce vrei să ști. Poți să fii mai specific? De exemplu, poți întreba despre:\n• Fișe de service\n• Clienți\n• Diagnosticarea problemelor\n• Prețuri și costuri\n• Statusul reparațiilor\n\n*Versiune beta - verifică informațiile importante*"
        
        # Persist even in fallback
        await db.ai_messages.insert_many([
            {"conversation_id": conversation_id, "type": "user", "content": request.message, "timestamp": now_iso},
            {"conversation_id": conversation_id, "type": "ai", "content": response_text, "timestamp": datetime.now(timezone.utc).isoformat()},
        ])
        await db.ai_conversations.update_one({"conversation_id": conversation_id}, {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
        
        return ChatResponse(
            response=response_text,
            timestamp=datetime.now(timezone.utc).isoformat(),
            conversation_id=conversation_id,
            memorized=memorized_flag
        )

# ============ ROLES & PERMISSIONS ENDPOINTS ============

@api_router.get("/tenant/roles", response_model=List[RoleResponse])
async def get_roles(current_user: dict = Depends(get_current_user)):
    """Get all roles for the current tenant"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        return []
    
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    custom_roles = tenant.get("roles", []) if tenant else []
    
    # Count users for each role
    users = await db.users.find({"tenant_id": tenant_id}).to_list(1000)
    role_counts = {}
    for user in users:
        role = user.get("role")
        role_counts[role] = role_counts.get(role, 0) + 1
    
    # Combine default and custom roles
    all_roles = []
    
    # Add default system roles
    for role_id, role_data in DEFAULT_ROLES.items():
        all_roles.append(RoleResponse(
            role_id=role_id,
            name=role_data["name"],
            description=role_data["description"],
            permissions=[perm.value for perm in role_data["permissions"]],
            is_custom=False,
            is_system=True,
            users_count=role_counts.get(role_id, 0)
        ))
    
    # Add custom roles
    for role in custom_roles:
        all_roles.append(RoleResponse(
            role_id=role["role_id"],
            name=role["name"],
            description=role.get("description", ""),
            permissions=role.get("permissions", []),
            is_custom=True,
            is_system=False,
            users_count=role_counts.get(role["role_id"], 0)
        ))
    
    return all_roles

@api_router.post("/tenant/roles", response_model=RoleResponse)
async def create_role(role: RoleCreate, current_user: dict = Depends(get_current_user)):
    """Create a new custom role"""
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only admins and tenant owners can create roles")
    
    # Check permission
    if not await check_permission(current_user, Permission.CREATE_ROLES):
        raise HTTPException(status_code=403, detail="Permission denied: create_roles required")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Validate permissions
    valid_permissions = [perm.value for perm in Permission]
    for perm in role.permissions:
        if perm not in valid_permissions:
            raise HTTPException(status_code=400, detail=f"Invalid permission: {perm}")
    
    # Check if role_id already exists
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if tenant and "roles" in tenant:
        for existing_role in tenant["roles"]:
            if existing_role["role_id"] == role.role_id:
                raise HTTPException(status_code=400, detail="Role ID already exists")
    
    # Check if it's a default role
    if role.role_id in DEFAULT_ROLES:
        raise HTTPException(status_code=400, detail="Cannot create role with system role ID")
    
    new_role = {
        "role_id": role.role_id,
        "name": role.name,
        "description": role.description,
        "permissions": role.permissions,
        "is_custom": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add role to tenant
    await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$push": {"roles": new_role}}
    )
    
    return RoleResponse(
        role_id=new_role["role_id"],
        name=new_role["name"],
        description=new_role["description"],
        permissions=new_role["permissions"],
        is_custom=True,
        is_system=False,
        users_count=0
    )

@api_router.put("/tenant/roles/{role_id}")
async def update_role(role_id: str, role_update: RoleUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing custom role"""
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only admins and tenant owners can update roles")
    
    # Check permission
    if not await check_permission(current_user, Permission.EDIT_ROLES):
        raise HTTPException(status_code=403, detail="Permission denied: edit_roles required")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Cannot modify system roles
    if role_id in DEFAULT_ROLES:
        raise HTTPException(status_code=400, detail="Cannot modify system roles")
    
    # Validate permissions if provided
    if role_update.permissions:
        valid_permissions = [perm.value for perm in Permission]
        for perm in role_update.permissions:
            if perm not in valid_permissions:
                raise HTTPException(status_code=400, detail=f"Invalid permission: {perm}")
    
    # Build update document
    update_fields = {}
    if role_update.name is not None:
        update_fields["roles.$.name"] = role_update.name
    if role_update.description is not None:
        update_fields["roles.$.description"] = role_update.description
    if role_update.permissions is not None:
        update_fields["roles.$.permissions"] = role_update.permissions
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields["roles.$.updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update role
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id, "roles.role_id": role_id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {"message": "Role updated successfully"}

@api_router.delete("/tenant/roles/{role_id}")
async def delete_role(role_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a custom role"""
    if current_user["user_type"] not in ["admin", "tenant_owner"]:
        raise HTTPException(status_code=403, detail="Only admins and tenant owners can delete roles")
    
    # Check permission
    if not await check_permission(current_user, Permission.DELETE_ROLES):
        raise HTTPException(status_code=403, detail="Permission denied: delete_roles required")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Cannot delete system roles
    if role_id in DEFAULT_ROLES:
        raise HTTPException(status_code=400, detail="Cannot delete system roles")
    
    # Check if any users have this role
    users_with_role = await db.users.count_documents({"tenant_id": tenant_id, "role": role_id})
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role: {users_with_role} user(s) still have this role")
    
    # Delete role
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$pull": {"roles": {"role_id": role_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {"message": "Role deleted successfully"}

@api_router.get("/tenant/permissions")
async def get_all_permissions(current_user: dict = Depends(get_current_user)):
    """Get all available permissions"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    permissions_grouped = {
        "tickets": [],
        "clients": [],
        "employees": [],
        "locations": [],
        "roles": [],
        "settings": [],
        "ai": [],
        "reports": [],
        "financial": []
    }
    
    for perm in Permission:
        category = perm.value.split("_", 1)[1] if "_" in perm.value else "other"
        
        if "ticket" in perm.value:
            permissions_grouped["tickets"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "client" in perm.value:
            permissions_grouped["clients"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "employee" in perm.value:
            permissions_grouped["employees"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "location" in perm.value:
            permissions_grouped["locations"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "role" in perm.value:
            permissions_grouped["roles"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "setting" in perm.value:
            permissions_grouped["settings"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "ai" in perm.value or "configure" in perm.value:
            permissions_grouped["ai"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "report" in perm.value or "export" in perm.value:
            permissions_grouped["reports"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
        elif "financial" in perm.value:
            permissions_grouped["financial"].append({"value": perm.value, "label": perm.value.replace("_", " ").title()})
    
    return permissions_grouped

@api_router.get("/tenant/my-permissions")
async def get_my_permissions(current_user: dict = Depends(get_current_user)):
    """Get permissions for the current user"""
    permissions = await get_user_permissions(current_user)
    return {"permissions": permissions}

# ============ AI CONFIGURATION ENDPOINTS ============

class AIConfigUpdate(BaseModel):
    enabled: bool = True
    tone: str = "professional"  # professional, friendly, technical
    detail_level: str = "detailed"  # brief, balanced, detailed
    language: str = "ro"
    custom_prompt: Optional[str] = None
    response_format: str = "structured"  # structured, conversational
    include_sources: bool = True
    auto_learn: bool = True

@api_router.get("/ai/config")
async def get_ai_config(current_user: dict = Depends(get_current_user)):
    """Get AI configuration for the current tenant"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    
    # If no tenant_id (e.g., platform admin without tenant), return defaults
    if not tenant_id:
        return {
            "enabled": True,
            "tone": "professional",
            "detail_level": "detailed",
            "language": "ro",
            "custom_prompt": "",
            "response_format": "structured",
            "include_sources": True,
            "auto_learn": True
        }
    
    # Fetch AI config from tenant collection
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Return AI config or default values
    ai_config = tenant.get("ai_config", {
        "enabled": True,
        "tone": "professional",
        "detail_level": "detailed",
        "language": "ro",
        "custom_prompt": "",
        "response_format": "structured",
        "include_sources": True,
        "auto_learn": True
    })
    
    return ai_config

@api_router.put("/ai/config")
async def update_ai_config(config: AIConfigUpdate, current_user: dict = Depends(get_current_user)):
    """Update AI configuration for the current tenant"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    
    # If no tenant_id (e.g., platform admin), cannot update
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with this user")
    
    # Update tenant with new AI config
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"ai_config": config.dict(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "AI configuration updated successfully", "config": config.dict()}

@api_router.post("/ai/knowledge", response_model=KnowledgeItem)
async def create_knowledge(data: KnowledgeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    now = datetime.now(timezone.utc).isoformat()
    knowledge_id = str(uuid.uuid4())
    doc = {
        "knowledge_id": knowledge_id,
        "tenant_id": current_user.get("tenant_id"),
        "user_id": current_user["user_id"],
        "title": (data.title or (data.content[:60] + ("..." if len(data.content) > 60 else ""))).strip(),
        "content": data.content.strip(),
        "tags": data.tags or [],
        "created_at": now,
        "updated_at": now,
    }
    await db.ai_knowledge.insert_one(doc)
    return KnowledgeItem(
        knowledge_id=knowledge_id,
        title=doc["title"],
        content=doc["content"],
        tags=doc["tags"],
        created_at=now,
        updated_at=now,
    )

@api_router.get("/ai/knowledge", response_model=List[KnowledgeItem])
async def list_knowledge(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    query = {"tenant_id": current_user.get("tenant_id")}
    items = await db.ai_knowledge.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return [KnowledgeItem(**it) for it in items]

@api_router.delete("/ai/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    conv = await db.ai_conversations.find_one({"conversation_id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your conversation")
    await db.ai_messages.delete_many({"conversation_id": conversation_id})
    await db.ai_conversations.delete_one({"conversation_id": conversation_id})
    return {"message": "Conversation deleted"}

# ============ PDF GENERATION ENDPOINTS ============

@api_router.get("/tenant/tickets/{ticket_id}/pdf/reception")
async def generate_reception_pdf(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Generate Reception Document PDF"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Get ticket
    ticket = await db.tickets.find_one({
        "ticket_id": ticket_id,
        "tenant_id": tenant_id
    })
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get tenant/company info
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Prepare company info
    company_info = {
        "service_name": tenant.get("service_name", "FixGSM Service"),
        "company_name": tenant.get("company_info", {}).get("company_name", ""),
        "cui": tenant.get("company_info", {}).get("cui", ""),
        "phone": tenant.get("company_info", {}).get("phone", ""),
        "email": tenant.get("company_info", {}).get("email", ""),
    }
    
    # Format ticket data
    try:
        created_at_str = datetime.fromisoformat(ticket.get("created_at")).strftime("%d.%m.%Y %H:%M") if ticket.get("created_at") else "N/A"
    except:
        created_at_str = str(ticket.get("created_at", "N/A"))
    
    try:
        estimated_cost_val = float(ticket.get("estimated_cost", 0)) if ticket.get("estimated_cost") else 0
    except:
        estimated_cost_val = 0
    
    ticket_data = {
        "ticket_id": ticket.get("ticket_id", "N/A"),
        "created_at": created_at_str,
        "status": ticket.get("status", "N/A"),
        "location": ticket.get("location", "N/A"),
        "client_name": ticket.get("client_name", "N/A"),
        "client_phone": ticket.get("client_phone", "N/A"),
        "client_email": ticket.get("client_email", ""),
        "device_model": ticket.get("device_model", "N/A"),
        "imei": ticket.get("imei", "N/A"),
        "serial_number": ticket.get("serial_number", ""),
        "reported_issue": ticket.get("reported_issue", "N/A"),
        "service_operations": ticket.get("service_operations", ""),
        "estimated_cost": estimated_cost_val,
    }
    
    # Generate PDF
    pdf_generator = FixGSMPDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_reception_document(ticket_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Receptie_{ticket_id}.pdf"
        }
    )

@api_router.get("/tenant/tickets/{ticket_id}/pdf/delivery")
async def generate_delivery_pdf(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Generate Delivery Document PDF"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Get ticket
    ticket = await db.tickets.find_one({
        "ticket_id": ticket_id,
        "tenant_id": tenant_id
    })
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get tenant/company info
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    company_info = {
        "service_name": tenant.get("service_name", "FixGSM Service"),
        "company_name": tenant.get("company_info", {}).get("company_name", ""),
        "cui": tenant.get("company_info", {}).get("cui", ""),
        "phone": tenant.get("company_info", {}).get("phone", ""),
        "email": tenant.get("company_info", {}).get("email", ""),
    }
    
    try:
        created_at_str = datetime.fromisoformat(ticket.get("created_at")).strftime("%d.%m.%Y %H:%M") if ticket.get("created_at") else "N/A"
    except:
        created_at_str = str(ticket.get("created_at", "N/A"))
    
    try:
        estimated_cost_val = float(ticket.get("estimated_cost", 0)) if ticket.get("estimated_cost") else 0
    except:
        estimated_cost_val = 0
    
    ticket_data = {
        "ticket_id": ticket.get("ticket_id", "N/A"),
        "created_at": created_at_str,
        "status": ticket.get("status", "N/A"),
        "location": ticket.get("location", "N/A"),
        "client_name": ticket.get("client_name", "N/A"),
        "client_phone": ticket.get("client_phone", "N/A"),
        "client_email": ticket.get("client_email", ""),
        "device_model": ticket.get("device_model", "N/A"),
        "imei": ticket.get("imei", "N/A"),
        "serial_number": ticket.get("serial_number", ""),
        "reported_issue": ticket.get("reported_issue", "N/A"),
        "service_operations": ticket.get("service_operations", ""),
        "estimated_cost": estimated_cost_val,
    }
    
    pdf_generator = FixGSMPDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_delivery_document(ticket_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Iesire_{ticket_id}.pdf"
        }
    )

@api_router.get("/tenant/tickets/{ticket_id}/pdf/warranty")
async def generate_warranty_pdf(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Generate Delivery + Warranty Document PDF"""
    if current_user["user_type"] not in ["admin", "tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated")
    
    # Get ticket
    ticket = await db.tickets.find_one({
        "ticket_id": ticket_id,
        "tenant_id": tenant_id
    })
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get tenant/company info
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    company_info = {
        "service_name": tenant.get("service_name", "FixGSM Service"),
        "company_name": tenant.get("company_info", {}).get("company_name", ""),
        "cui": tenant.get("company_info", {}).get("cui", ""),
        "phone": tenant.get("company_info", {}).get("phone", ""),
        "email": tenant.get("company_info", {}).get("email", ""),
    }
    
    try:
        created_at_str = datetime.fromisoformat(ticket.get("created_at")).strftime("%d.%m.%Y %H:%M") if ticket.get("created_at") else "N/A"
    except:
        created_at_str = str(ticket.get("created_at", "N/A"))
    
    try:
        estimated_cost_val = float(ticket.get("estimated_cost", 0)) if ticket.get("estimated_cost") else 0
    except:
        estimated_cost_val = 0
    
    ticket_data = {
        "ticket_id": ticket.get("ticket_id", "N/A"),
        "created_at": created_at_str,
        "status": ticket.get("status", "N/A"),
        "location": ticket.get("location", "N/A"),
        "client_name": ticket.get("client_name", "N/A"),
        "client_phone": ticket.get("client_phone", "N/A"),
        "client_email": ticket.get("client_email", ""),
        "device_model": ticket.get("device_model", "N/A"),
        "imei": ticket.get("imei", "N/A"),
        "serial_number": ticket.get("serial_number", ""),
        "reported_issue": ticket.get("reported_issue", "N/A"),
        "service_operations": ticket.get("service_operations", ""),
        "estimated_cost": estimated_cost_val,
    }
    
    pdf_generator = FixGSMPDFGenerator(company_info)
    pdf_buffer = pdf_generator.generate_warranty_document(ticket_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Iesire_Garantie_{ticket_id}.pdf"
        }
        )

# ================== SUBSCRIPTION MONITORING & NOTIFICATIONS ==================

@api_router.get("/tenant/subscription-status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get subscription status and expiry info for current tenant"""
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found")
    
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    from datetime import datetime, timedelta
    
    subscription_end_date = tenant.get("subscription_end_date")
    days_until_expiry = None
    is_expiring_soon = False
    
    if subscription_end_date:
        try:
            from datetime import timezone
            end_date = datetime.fromisoformat(subscription_end_date.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_until_expiry = (end_date - now).days
            is_expiring_soon = days_until_expiry <= 5 and days_until_expiry >= 0
        except Exception as e:
            print(f"DEBUG subscription-status: Error calculating days: {e}")
            pass
    
    # Get plan limits from database
    current_plan = tenant.get("subscription_plan", "Trial")
    plan_doc = await db["subscription_plans"].find_one({"plan_id": current_plan.lower()})
    if plan_doc and "limits" in plan_doc:
        limits = plan_doc["limits"]
    else:
        # Fallback to hardcoded limits
        plan_limits = {
            "Trial": {"locations": 1, "employees": 3, "has_ai": False},
            "Basic": {"locations": 1, "employees": 3, "has_ai": False},
            "Pro": {"locations": 5, "employees": 15, "has_ai": True},
            "Enterprise": {"locations": 999, "employees": 999, "has_ai": True}
        }
        limits = plan_limits.get(current_plan, plan_limits["Trial"])
    
    return {
        "subscription_status": tenant.get("subscription_status", "pending"),
        "subscription_plan": current_plan,
        "subscription_end_date": subscription_end_date,
        "days_until_expiry": days_until_expiry,
        "is_expiring_soon": is_expiring_soon,
        "subscription_price": tenant.get("subscription_price", 0),
        "has_payment_notification": tenant.get("has_payment_notification", False),
        "is_trial": tenant.get("is_trial", False),
        "plan_limits": limits
    }

@api_router.post("/admin/create-employee")
async def admin_create_employee(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create employee for a specific tenant (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tenant_id = data.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Get tenant to verify it exists
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if email already exists
    existing = await db["users"].find_one({"email": data.get("email")})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Get location_id from request or use first location
    location_id = data.get("location_id")
    if not location_id:
        # Get first location for this tenant
        location = await db["locations"].find_one({"tenant_id": tenant_id})
        if not location:
            raise HTTPException(status_code=400, detail="Tenant must have at least one location")
        location_id = location["location_id"]
    else:
        # Verify location exists and belongs to tenant
        location = await db["locations"].find_one({
            "location_id": location_id,
            "tenant_id": tenant_id
        })
        if not location:
            raise HTTPException(status_code=400, detail="Invalid location for this tenant")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(data.get("password"))
    
    employee_doc = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "location_id": location_id,
        "name": data.get("name"),
        "email": data.get("email"),
        "password_hash": hashed_pw,
        "role": data.get("role", "Technician"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by_admin": True
    }
    
    await db["users"].insert_one(employee_doc)
    
    return {
        "message": "Employee created successfully",
        "user_id": user_id,
        "tenant_id": tenant_id
    }

@api_router.get("/admin/tenant-employees/{tenant_id}")
async def get_tenant_employees(
    tenant_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all employees for a specific tenant (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    employees = await db["users"].find(
        {"tenant_id": tenant_id},
        {"password_hash": 0}
    ).to_list(length=1000)
    
    # Convert ObjectId to string for JSON serialization
    for employee in employees:
        if "_id" in employee:
            employee["_id"] = str(employee["_id"])
        if "user_id" in employee:
            employee["user_id"] = str(employee["user_id"])
        if "tenant_id" in employee:
            employee["tenant_id"] = str(employee["tenant_id"])
        if "location_id" in employee:
            employee["location_id"] = str(employee["location_id"])
    
    return {"employees": employees}

@api_router.get("/admin/tenant-locations/{tenant_id}")
async def get_tenant_locations(
    tenant_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all locations for a specific tenant (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    locations = await db["locations"].find(
        {"tenant_id": tenant_id}
    ).to_list(length=1000)
    
    # Convert ObjectId to string for JSON serialization
    for location in locations:
        if "_id" in location:
            location["_id"] = str(location["_id"])
        if "location_id" in location:
            location["location_id"] = str(location["location_id"])
        if "tenant_id" in location:
            location["tenant_id"] = str(location["tenant_id"])
    
    return {"locations": locations}

@api_router.delete("/admin/delete-employee/{user_id}")
async def delete_employee(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete employee (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user exists
    user = await db["users"].find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Delete user
    result = await db["users"].delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return {"message": "Employee deleted successfully"}

@api_router.post("/admin/send-payment-notification")
async def send_payment_notification(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send manual payment notification to tenant (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id")
    
    # Mark tenant as having payment notification
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {"$set": {"has_payment_notification": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Payment notification sent successfully"}

@api_router.post("/admin/dismiss-payment-notification")
async def dismiss_payment_notification(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Dismiss payment notification for tenant (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id")
    
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {"$set": {"has_payment_notification": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Payment notification dismissed"}

@api_router.post("/admin/update-subscription-end-date")
async def update_subscription_end_date(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update tenant subscription end date (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    end_date = data.get("end_date")  # ISO format string
    
    if not tenant_id or not end_date:
        raise HTTPException(status_code=400, detail="Missing tenant_id or end_date")
    
    print(f"DEBUG: Searching for tenant with tenant_id: {tenant_id}")
    
    # Check if tenant exists
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        print(f"DEBUG: Tenant not found with tenant_id: {tenant_id}")
        print(f"DEBUG: Trying to find any tenant...")
        all_tenants = await db["tenants"].find({}).to_list(length=5)
        for t in all_tenants:
            print(f"DEBUG: Found tenant with tenant_id: {t.get('tenant_id')}")
        raise HTTPException(status_code=404, detail=f"Tenant not found with tenant_id: {tenant_id}")
    
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {"$set": {"subscription_end_date": end_date}}
    )
    
    print(f"DEBUG: Update result - modified_count: {result.modified_count}, matched_count: {result.matched_count}")
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Subscription end date updated"}

@api_router.get("/admin/tenants-expiring-soon")
async def get_tenants_expiring_soon(current_user: dict = Depends(get_current_user)):
    """Get list of tenants with subscriptions expiring in next 5 days (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    from datetime import datetime, timedelta
    
    tenants = await db["tenants"].find({
        "subscription_status": "active"
    }).to_list(length=None)
    
    expiring_tenants = []
    now = datetime.now()
    
    for tenant in tenants:
        end_date_str = tenant.get("subscription_end_date")
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                days_until_expiry = (end_date - now).days
                
                if 0 <= days_until_expiry <= 5:
                    tenant["_id"] = str(tenant["_id"])
                    tenant["days_until_expiry"] = days_until_expiry
                    if "password" in tenant:
                        del tenant["password"]
                    expiring_tenants.append(tenant)
            except:
                pass
    
    return expiring_tenants

@api_router.post("/tenant/dismiss-payment-alert")
async def tenant_dismiss_payment_alert(current_user: dict = Depends(get_current_user)):
    """Tenant dismisses their own payment alert"""
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found")
    
    await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {"$set": {"has_payment_notification": False}}
    )
    
    return {"message": "Alert dismissed"}

# ================== ADMIN ENDPOINTS - EXTENDED ==================

@api_router.get("/admin/recent-activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    """Get recent activity across the platform from logs (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    from datetime import datetime, timedelta
    
    # Get recent logs (last 24 hours, all activity types)
    recent_logs = await db["logs"].find({
        "log_type": "activity"
    }).sort("created_at", -1).limit(15).to_list(length=15)
    
    activities = []
    
    for log in recent_logs:
        try:
            created_at = datetime.fromisoformat(log.get("created_at", "").replace('Z', '+00:00'))
            time_ago = datetime.now(timezone.utc) - created_at
            
            # Format time ago
            if time_ago.total_seconds() < 60:
                time_str = "Acum câteva secunde"
            elif time_ago.total_seconds() < 3600:
                minutes = int(time_ago.total_seconds() / 60)
                time_str = f"Acum {minutes} {'minut' if minutes == 1 else 'minute'}"
            elif time_ago.total_seconds() < 86400:
                hours = int(time_ago.total_seconds() / 3600)
                time_str = f"Acum {hours} {'oră' if hours == 1 else 'ore'}"
            else:
                days = int(time_ago.total_seconds() / 86400)
                time_str = f"Acum {days} {'zi' if days == 1 else 'zile'}"
            
            # Determine activity type and icon based on category and level
            category = log.get("category", "")
            level = log.get("level", "info")
            
            if category == "auth":
                activity_type = "login"
                icon_color = "cyan" if level == "info" else "amber"
            elif category == "user_action":
                activity_type = "ticket"
                icon_color = "green"
            elif category == "payment":
                activity_type = "payment"
                icon_color = "purple"
            elif category == "settings":
                activity_type = "settings"
                icon_color = "blue"
            else:
                activity_type = "system"
                icon_color = "slate"
            
            activities.append({
                "type": activity_type,
                "category": category,
                "level": level,
                "message": log.get("message", "Unknown activity"),
                "user_email": log.get("user_email", "System"),
                "time_ago": time_str,
                "timestamp": log.get("created_at"),
                "icon_color": icon_color
            })
        except Exception as e:
            print(f"Error processing log: {e}")
            pass
    
    return activities[:10]  # Return top 10 most recent

@api_router.get("/admin/tenants")
async def get_all_tenants(current_user: dict = Depends(get_current_user)):
    """Get all tenants (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenants = await db["tenants"].find({}).to_list(length=None)
    
    # Clean up tenants data
    for tenant in tenants:
        tenant["_id"] = str(tenant["_id"])
        if "password" in tenant:
            del tenant["password"]
    
    return tenants

@api_router.post("/admin/reset-password")
async def reset_tenant_password(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Reset tenant password (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    new_password = data.get("new_password")
    
    if not tenant_id or not new_password:
        raise HTTPException(status_code=400, detail="Missing tenant_id or new_password")
    
    # Hash new password
    hashed_password = pwd_context.hash(new_password)
    
    # Update tenant password
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {"$set": {"password": hashed_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": "Password reset successfully"}

@api_router.post("/admin/toggle-tenant-status")
async def toggle_tenant_status(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Toggle tenant status (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    new_status = data.get("status")  # 'active', 'suspended', 'pending'
    
    if not tenant_id or not new_status:
        raise HTTPException(status_code=400, detail="Missing tenant_id or status")
    
    print(f"DEBUG toggle-tenant-status: Searching for tenant with tenant_id: {tenant_id}")
    print(f"DEBUG toggle-tenant-status: New status: {new_status}")
    
    # Check if tenant exists first
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        print(f"DEBUG toggle-tenant-status: Tenant not found with tenant_id: {tenant_id}")
        raise HTTPException(status_code=404, detail=f"Tenant not found with tenant_id: {tenant_id}")
    
    print(f"DEBUG toggle-tenant-status: Found tenant, current status: {tenant.get('subscription_status')}")
    
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {"$set": {"subscription_status": new_status}}
    )
    
    print(f"DEBUG toggle-tenant-status: Update result - modified_count: {result.modified_count}, matched_count: {result.matched_count}")
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": f"Tenant status updated to {new_status}"}

@api_router.post("/admin/extend-grace-period")
async def extend_grace_period(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Extend grace period for tenant (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    days = data.get("days", 7)  # Default 7 days
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id")
    
    print(f"DEBUG extend-grace-period: Extending grace period for tenant {tenant_id} with {days} days")
    
    # Check if tenant exists
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        print(f"DEBUG extend-grace-period: Tenant not found with tenant_id: {tenant_id}")
        raise HTTPException(status_code=404, detail=f"Tenant not found with tenant_id: {tenant_id}")
    
    # Calculate new end date
    from datetime import datetime, timezone, timedelta
    current_end_date = tenant.get("subscription_end_date")
    
    if current_end_date:
        try:
            end_date = datetime.fromisoformat(current_end_date.replace('Z', '+00:00'))
            new_end_date = end_date + timedelta(days=days)
        except:
            # If current date is invalid, use now + days
            new_end_date = datetime.now(timezone.utc) + timedelta(days=days)
    else:
        # If no end date, use now + days
        new_end_date = datetime.now(timezone.utc) + timedelta(days=days)
    
    # Update tenant with grace period
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {
            "$set": {
                "subscription_end_date": new_end_date.isoformat(),
                "has_grace_period": True,
                "grace_period_extended_at": datetime.now(timezone.utc).isoformat(),
                "grace_period_days": days
            }
        }
    )
    
    print(f"DEBUG extend-grace-period: Update result - modified_count: {result.modified_count}")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": f"Grace period extended by {days} days until {new_end_date.strftime('%Y-%m-%d')}"}

@api_router.post("/admin/reset-subscription-after-payment")
async def reset_subscription_after_payment(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Reset subscription and notifications after payment (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    tenant_id = data.get("tenant_id")
    months = data.get("months", 1)  # Default 1 month
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id")
    
    print(f"DEBUG reset-subscription: Resetting subscription for tenant {tenant_id} for {months} months")
    
    # Check if tenant exists
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        print(f"DEBUG reset-subscription: Tenant not found with tenant_id: {tenant_id}")
        raise HTTPException(status_code=404, detail=f"Tenant not found with tenant_id: {tenant_id}")
    
    # Calculate new end date (from now + months)
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    
    # Add months (approximate)
    days_to_add = months * 30  # Approximate
    new_end_date = now + timedelta(days=days_to_add)
    
    # Update tenant - reset everything
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {
            "$set": {
                "subscription_end_date": new_end_date.isoformat(),
                "subscription_status": "active",
                "has_payment_notification": False,
                "has_grace_period": False,
                "grace_period_extended_at": None,
                "grace_period_days": None,
                "payment_completed_at": now.isoformat(),
                "payment_months": months
            }
        }
    )
    
    print(f"DEBUG reset-subscription: Update result - modified_count: {result.modified_count}")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"message": f"Subscription renewed for {months} months until {new_end_date.strftime('%Y-%m-%d')}. All notifications cleared."}

@api_router.post("/tenant/process-payment")
async def process_payment(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Process payment for current tenant (simulated)"""
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found")
    
    plan = data.get("plan", "Pro")  # Basic, Pro, Enterprise
    months = data.get("months", 1)  # Number of months to pay for
    
    print(f"DEBUG process-payment: Processing payment for tenant {tenant_id}, plan: {plan}, months: {months}")
    
    # Get tenant
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    if not tenant:
        print(f"DEBUG process-payment: Tenant not found with tenant_id: {tenant_id}")
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get plan price from database
    plan_doc = await db["subscription_plans"].find_one({"plan_id": plan.lower()})
    if not plan_doc:
        # Fallback to hardcoded prices if plan not found
        plan_prices = {
            "trial": 0,
            "basic": 0,
            "pro": 99,
            "enterprise": 299
        }
        price = plan_prices.get(plan.lower(), 99)
    else:
        price = plan_doc.get("price", 99)
    total_amount = price * months
    
    # Calculate new end date (from now + months)
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    
    # Check if there's an existing end date
    current_end_date = tenant.get("subscription_end_date")
    if current_end_date:
        try:
            end_date = datetime.fromisoformat(current_end_date.replace('Z', '+00:00'))
            # If subscription is still active, extend from end date
            if end_date > now:
                new_end_date = end_date + timedelta(days=months * 30)
            else:
                # If expired, start from now
                new_end_date = now + timedelta(days=months * 30)
        except:
            new_end_date = now + timedelta(days=months * 30)
    else:
        new_end_date = now + timedelta(days=months * 30)
    
    # Generate invoice number
    invoice_number = f"FIXGSM-{now.strftime('%Y%m%d')}-{tenant_id[:8].upper()}"
    
    # Create payment record in payments collection
    payment_record = {
        "payment_id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "tenant_id": tenant_id,
        "plan": plan,
        "months": months,
        "amount": total_amount,
        "currency": "RON",
        "status": "completed",  # Simulated - always successful
        "payment_method": "simulated",
        "created_at": now.isoformat(),
        "processed_at": now.isoformat(),
        "invoice_generated": True,
        "tenant_info": {
            "company_name": tenant.get("company_name", ""),
            "owner_name": tenant.get("owner_name", ""),
            "email": tenant.get("email", ""),
            "phone": tenant.get("phone", ""),
            "address": tenant.get("address", "")
        }
    }
    
    await db["payments"].insert_one(payment_record)
    print(f"DEBUG process-payment: Payment record created: {payment_record['payment_id']}")
    
    # Update tenant subscription
    result = await db["tenants"].update_one(
        {"tenant_id": tenant_id},
        {
            "$set": {
                "subscription_plan": plan,
                "subscription_price": price,
                "subscription_end_date": new_end_date.isoformat(),
                "subscription_status": "active",
                "has_payment_notification": False,
                "has_grace_period": False,
                "grace_period_extended_at": None,
                "grace_period_days": None,
                "last_payment_date": now.isoformat(),
                "last_payment_amount": total_amount
            }
        }
    )
    
    print(f"DEBUG process-payment: Tenant updated - modified_count: {result.modified_count}")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update subscription")
    
    # Log payment success
    await create_log(
        log_type="activity",
        level="info",
        category="payment",
        message=f"Payment processed: {invoice_number} - Plan: {plan} - Amount: {total_amount} RON - Duration: {months} month(s)",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email"),
        tenant_id=tenant_id,
        metadata={
            "payment_id": payment_record["payment_id"],
            "invoice_number": invoice_number,
            "plan": plan,
            "amount": total_amount,
            "months": months,
            "currency": "RON"
        }
    )
    
    return {
        "message": f"Plată procesată cu succes! Abonament {plan} activ până la {new_end_date.strftime('%Y-%m-%d')}",
        "payment_id": payment_record["payment_id"],
        "invoice_number": invoice_number,
        "plan": plan,
        "amount": total_amount,
        "months": months,
        "valid_until": new_end_date.isoformat()
    }

@api_router.get("/tenant/payment-history")
async def get_payment_history(current_user: dict = Depends(get_current_user)):
    """Get payment history for current tenant"""
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found")
    
    # Get all payments for this tenant
    payments = await db["payments"].find(
        {"tenant_id": tenant_id}
    ).sort("created_at", -1).limit(20).to_list(length=20)
    
    # Convert ObjectId to string
    for payment in payments:
        payment["_id"] = str(payment["_id"])
    
    return {"payments": payments}

@api_router.get("/tenant/invoice/{payment_id}")
async def generate_invoice(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate invoice PDF for a payment"""
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found")
    
    # Get payment record
    payment = await db["payments"].find_one({
        "payment_id": payment_id,
        "tenant_id": tenant_id
    })
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Generate invoice PDF
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Helper function to remove diacritics
    def remove_diacritics(text):
        if not text:
            return ""
        replacements = {
            'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
            'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
    
    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 80, "FACTURA")
    
    # Invoice info
    c.setFont("Helvetica", 10)
    invoice_number = payment.get("invoice_number", "N/A")
    created_at = payment.get("created_at", "")
    
    try:
        from datetime import datetime
        date_obj = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        formatted_date = date_obj.strftime("%d.%m.%Y")
    except:
        formatted_date = "N/A"
    
    c.drawString(400, height - 80, f"Nr: {invoice_number}")
    c.drawString(400, height - 95, f"Data: {formatted_date}")
    
    # From (FixGSM Platform)
    y = height - 140
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Furnizor:")
    c.setFont("Helvetica", 10)
    y -= 20
    c.drawString(50, y, "FixGSM Platform")
    y -= 15
    c.drawString(50, y, "Str. Exemplu Nr. 1")
    y -= 15
    c.drawString(50, y, "Bucuresti, Romania")
    y -= 15
    c.drawString(50, y, "Email: contact@fixgsm.ro")
    
    # To (Client) - Get full company info from tenant
    tenant = await db["tenants"].find_one({"tenant_id": tenant_id})
    company_info = tenant.get("company_info", {}) if tenant else {}
    
    y = height - 140
    c.setFont("Helvetica-Bold", 12)
    c.drawString(350, y, "Client:")
    c.setFont("Helvetica", 10)
    y -= 20
    
    # Company details from company_info
    company_name = remove_diacritics(company_info.get("company_name", tenant.get("company_name", "N/A")))
    cui = company_info.get("cui", "N/A")
    address = remove_diacritics(company_info.get("address", ""))
    phone = company_info.get("phone", tenant.get("phone", "N/A"))
    email = company_info.get("email", tenant.get("email", "N/A"))
    
    c.drawString(350, y, company_name)
    y -= 15
    if cui and cui != "N/A":
        c.drawString(350, y, f"CUI: {cui}")
        y -= 15
    if address:
        c.drawString(350, y, address)
        y -= 15
    c.drawString(350, y, f"Tel: {phone}")
    y -= 15
    c.drawString(350, y, f"Email: {email}")
    
    # Table
    y = height - 320
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Descriere")
    c.drawString(300, y, "Perioada")
    c.drawString(380, y, "Pret/luna")
    c.drawString(480, y, "Total")
    
    # Line under header
    y -= 5
    c.line(50, y, width - 50, y)
    
    # Content
    y -= 25
    c.setFont("Helvetica", 10)
    plan = payment.get("plan", "N/A")
    months = payment.get("months", 1)
    amount = payment.get("amount", 0)
    price_per_month = amount / months if months > 0 else 0
    
    c.drawString(50, y, f"Abonament FixGSM - Plan {plan}")
    c.drawString(300, y, f"{months} {'luna' if months == 1 else 'luni'}")
    c.drawString(380, y, f"{price_per_month:.2f} RON")
    c.drawString(480, y, f"{amount:.2f} RON")
    
    # Total line
    y -= 30
    c.line(50, y, width - 50, y)
    
    # Total
    y -= 25
    c.setFont("Helvetica-Bold", 12)
    c.drawString(400, y, "TOTAL:")
    c.drawString(480, y, f"{amount:.2f} RON")
    
    # Footer
    y = 100
    c.setFont("Helvetica", 8)
    c.drawString(50, y, "Multumim pentru incredere!")
    y -= 15
    c.drawString(50, y, "Aceasta este o factura proforma generata automat.")
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=factura_{invoice_number}.pdf"
        }
    )

@api_router.get("/admin/server-info")
async def get_server_info(current_user: dict = Depends(get_current_user)):
    """Get server information (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    import psutil
    import platform
    
    # Get system info
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Calculate uptime
    now = datetime.now(timezone.utc)
    uptime_delta = now - server_start_time
    
    # Format uptime
    days = uptime_delta.days
    hours, remainder = divmod(uptime_delta.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    # Get MongoDB version
    try:
        server_info = await client.server_info()
        mongo_version = server_info.get('version', 'Unknown')
    except:
        mongo_version = 'Unknown'
    
    return {
        "cpu_usage": cpu_percent,
        "memory_total": memory.total,
        "memory_used": memory.used,
        "memory_percent": memory.percent,
        "disk_total": disk.total,
        "disk_used": disk.used,
        "disk_percent": disk.percent,
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "mongo_version": mongo_version,
        "server_start_time": server_start_time.isoformat(),
        "uptime": {
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds,
            "total_seconds": int(uptime_delta.total_seconds())
        },
        "uptime_formatted": f"{days} days, {hours} hours, {minutes} minutes"
    }

@api_router.get("/admin/ai-config")
async def get_admin_ai_config(current_user: dict = Depends(get_current_user)):
    """Get global AI configuration (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "api_key": os.getenv("GOOGLE_GEMINI_API_KEY", ""),
        "model": "gemini-2.5-flash",
        "enabled": True
    }

@api_router.put("/admin/ai-config")
async def update_admin_ai_config(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update global AI configuration (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update .env file or environment variables
    # For now, just return success
    # In production, you would update the .env file
    
    return {"message": "AI configuration updated successfully"}

@api_router.get("/admin/subscription-plans")
async def get_subscription_plans(current_user: dict = Depends(get_current_user)):
    """Get subscription plans (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get plans from database
    plans = await db["subscription_plans"].find({}).sort("order", 1).to_list(10)
    
    # If no plans exist, create default ones
    if not plans:
        default_plans = [
            {
                "plan_id": "trial",
                "name": "Trial",
                "price": 0,
                "order": 0,
                "features": ["1 locație", "3 angajați", "Funcții de bază"],
                "limits": {"locations": 1, "employees": 3, "has_ai": False},
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "plan_id": "basic",
                "name": "Basic",
                "price": 49,
                "order": 1,
                "features": ["1 locație", "3 angajați", "Funcții de bază"],
                "limits": {"locations": 1, "employees": 3, "has_ai": False},
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "plan_id": "pro",
                "name": "Pro",
                "price": 99,
                "order": 2,
                "features": ["5 locații", "15 angajați", "AI Assistant", "API Access"],
                "limits": {"locations": 5, "employees": 15, "has_ai": True},
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "plan_id": "enterprise",
                "name": "Enterprise",
                "price": 299,
                "order": 3,
                "features": ["Locații nelimitate", "Angajați nelimitați", "AI Assistant", "API Access", "Suport prioritar"],
                "limits": {"locations": 999, "employees": 999, "has_ai": True},
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db["subscription_plans"].insert_many(default_plans)
        plans = default_plans
    
    # Convert ObjectId to string
    for plan in plans:
        if "_id" in plan:
            plan["_id"] = str(plan["_id"])
    
    return plans

@api_router.put("/admin/subscription-plans/{plan_id}")
async def update_subscription_plan(
    plan_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update subscription plan (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate required fields
    if "price" not in data:
        raise HTTPException(status_code=400, detail="Price is required")
    
    # Update plan in database
    update_data = {
        "price": data["price"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Optional fields
    if "name" in data:
        update_data["name"] = data["name"]
    if "features" in data:
        update_data["features"] = data["features"]
    if "limits" in data:
        update_data["limits"] = data["limits"]
    
    result = await db["subscription_plans"].update_one(
        {"plan_id": plan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": f"Plan {plan_id} updated successfully", "updated": update_data}

@api_router.get("/tenant/subscription-plans")
async def get_tenant_subscription_plans(current_user: dict = Depends(get_current_user)):
    """Get subscription plans for tenant (public pricing)"""
    if current_user.get("user_type") not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get plans from database (public view)
    plans = await db["subscription_plans"].find({}).sort("order", 1).to_list(10)
    
    # Convert ObjectId to string and return public info only
    public_plans = []
    for plan in plans:
        public_plans.append({
            "plan_id": plan.get("plan_id"),
            "name": plan.get("name"),
            "price": plan.get("price"),
            "features": plan.get("features", []),
            "limits": plan.get("limits", {})
        })
    
    return public_plans

# ================== ANNOUNCEMENTS ENDPOINTS ==================

@api_router.get("/admin/announcements")
async def get_announcements(current_user: dict = Depends(get_current_user)):
    """Get all announcements (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    announcements = await db["announcements"].find({}).sort("created_at", -1).to_list(100)
    
    # Convert ObjectId to string
    for announcement in announcements:
        announcement["_id"] = str(announcement["_id"])
    
    return announcements

@api_router.post("/admin/announcements")
async def create_announcement(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create new announcement (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    announcement_id = str(uuid.uuid4())
    announcement = {
        "announcement_id": announcement_id,
        "title": data.get("title"),
        "message": data.get("message"),
        "type": data.get("type", "info"),  # info, warning, success, error
        "is_active": data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("user_id"),
        "expires_at": data.get("expires_at")  # Optional expiry date
    }
    
    await db["announcements"].insert_one(announcement)
    
    return {"message": "Announcement created successfully", "announcement_id": announcement_id}

@api_router.put("/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update announcement (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "title" in data:
        update_data["title"] = data["title"]
    if "message" in data:
        update_data["message"] = data["message"]
    if "type" in data:
        update_data["type"] = data["type"]
    if "is_active" in data:
        update_data["is_active"] = data["is_active"]
    if "expires_at" in data:
        update_data["expires_at"] = data["expires_at"]
    
    result = await db["announcements"].update_one(
        {"announcement_id": announcement_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return {"message": "Announcement updated successfully"}

@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete announcement (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db["announcements"].delete_one({"announcement_id": announcement_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return {"message": "Announcement deleted successfully"}

@api_router.get("/tenant/announcements")
async def get_tenant_announcements(current_user: dict = Depends(get_current_user)):
    """Get active announcements for tenant"""
    if current_user.get("user_type") not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get active announcements
    announcements = await db["announcements"].find({
        "is_active": True
    }).sort("created_at", -1).to_list(100)
    
    # Filter out expired announcements
    active_announcements = []
    now = datetime.now(timezone.utc)
    
    for announcement in announcements:
        expires_at = announcement.get("expires_at")
        if expires_at:
            try:
                expiry_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                if expiry_date < now:
                    continue  # Skip expired
            except:
                pass
        
        # Convert ObjectId to string
        announcement["_id"] = str(announcement["_id"])
        active_announcements.append(announcement)
    
    return active_announcements

@api_router.post("/tenant/announcements/{announcement_id}/dismiss")
async def dismiss_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Dismiss announcement for current user"""
    if current_user.get("user_type") not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_id = current_user.get("user_id")
    
    # Store dismissal in user preferences or separate collection
    dismissal = {
        "user_id": user_id,
        "announcement_id": announcement_id,
        "dismissed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db["announcement_dismissals"].insert_one(dismissal)
    
    return {"message": "Announcement dismissed"}

@api_router.get("/tenant/announcements/active-count")
async def get_active_announcements_count(current_user: dict = Depends(get_current_user)):
    """Get count of active, non-dismissed announcements"""
    if current_user.get("user_type") not in ["tenant_owner", "employee"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_id = current_user.get("user_id")
    
    # Get all active announcements
    announcements = await db["announcements"].find({
        "is_active": True
    }).to_list(100)
    
    # Get dismissed announcements for this user
    dismissed = await db["announcement_dismissals"].find({
        "user_id": user_id
    }).to_list(1000)
    
    dismissed_ids = [d["announcement_id"] for d in dismissed]
    
    # Filter out expired and dismissed
    now = datetime.now(timezone.utc)
    active_count = 0
    
    for announcement in announcements:
        if announcement["announcement_id"] in dismissed_ids:
            continue
        
        expires_at = announcement.get("expires_at")
        if expires_at:
            try:
                expiry_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                if expiry_date < now:
                    continue
            except:
                pass
        
        active_count += 1
    
    return {"count": active_count}

@api_router.post("/admin/backup")
async def create_backup(current_user: dict = Depends(get_current_user)):
    """Create database backup (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    import subprocess
    import os
    import zipfile
    import shutil
    
    # Create backup directory if it doesn't exist
    os.makedirs("backups", exist_ok=True)
    
    # Create backup using mongodump
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_name = f"fixgsm_backup_{timestamp}"
    backup_dir = f"backups/{backup_name}"
    
    try:
        # Get MongoDB connection details
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "fixgsm_db")
        
        # Parse MongoDB URL to extract host and port
        if "mongodb://" in mongo_url:
            mongo_host = mongo_url.replace("mongodb://", "").split("/")[0]
        else:
            mongo_host = "localhost:27017"
        
        # Get mongodump path (try local first, then system)
        local_mongodump = os.path.join(os.path.dirname(__file__), "mongodb-tools", "mongodump.exe")
        mongodump_cmd = local_mongodump if os.path.exists(local_mongodump) else "mongodump"
        
        # Run mongodump
        result = subprocess.run(
            [
                mongodump_cmd,
                f"--host={mongo_host}",
                f"--db={db_name}",
                f"--out={backup_dir}"
            ],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            # Count files and calculate size
            backup_path = os.path.join(backup_dir, db_name)
            file_count = 0
            total_size = 0
            
            if os.path.exists(backup_path):
                for root, dirs, files in os.walk(backup_path):
                    file_count += len(files)
                    for file in files:
                        file_path = os.path.join(root, file)
                        total_size += os.path.getsize(file_path)
            
            # Create ZIP archive
            zip_filename = f"{backup_dir}.zip"
            with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(backup_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, backup_dir)
                        zipf.write(file_path, arcname)
            
            # Remove uncompressed backup directory
            shutil.rmtree(backup_dir)
            
            # Get ZIP file size
            zip_size = os.path.getsize(zip_filename)
            
            # Save backup metadata to database
            backup_metadata = {
                "backup_id": str(uuid.uuid4()),
                "backup_name": backup_name,
                "filename": f"{backup_name}.zip",
                "filepath": zip_filename,
                "file_count": file_count,
                "size_bytes": zip_size,
                "size_mb": round(zip_size / (1024 * 1024), 2),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_user.get("user_id"),
                "status": "completed"
            }
            
            await db["backups"].insert_one(backup_metadata)
            
            return {
                "message": "Backup created successfully",
                "backup_id": backup_metadata["backup_id"],
                "filename": backup_metadata["filename"],
                "file_count": file_count,
                "size_mb": backup_metadata["size_mb"],
                "timestamp": timestamp
            }
        else:
            raise Exception(f"mongodump failed: {result.stderr}")
            
    except FileNotFoundError:
        return {
            "message": "Backup feature requires mongodump to be installed",
            "error": "mongodump not found in PATH",
            "note": "Install MongoDB Database Tools to enable backups"
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Backup timeout - database too large")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@api_router.get("/admin/backups")
async def list_backups(current_user: dict = Depends(get_current_user)):
    """List all available backups (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    backups = await db["backups"].find({}).sort("created_at", -1).to_list(100)
    
    # Convert ObjectId to string
    for backup in backups:
        backup["_id"] = str(backup["_id"])
    
    return backups

@api_router.get("/admin/backup/{backup_id}/download")
async def download_backup(
    backup_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download a backup file (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    import os
    from fastapi.responses import FileResponse
    
    # Get backup metadata
    backup = await db["backups"].find_one({"backup_id": backup_id})
    
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    
    filepath = backup.get("filepath")
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup file not found on disk")
    
    return FileResponse(
        path=filepath,
        filename=backup.get("filename"),
        media_type="application/zip"
    )

@api_router.post("/admin/backup/{backup_id}/restore")
async def restore_backup(
    backup_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Restore database from backup (admin only) - DANGEROUS OPERATION"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    import subprocess
    import os
    import zipfile
    import shutil
    
    # Get backup metadata
    backup = await db["backups"].find_one({"backup_id": backup_id})
    
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    
    filepath = backup.get("filepath")
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup file not found on disk")
    
    try:
        # Create temporary extraction directory
        temp_dir = f"backups/temp_restore_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Extract ZIP file
        with zipfile.ZipFile(filepath, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Get MongoDB connection details
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "fixgsm_db")
        
        if "mongodb://" in mongo_url:
            mongo_host = mongo_url.replace("mongodb://", "").split("/")[0]
        else:
            mongo_host = "localhost:27017"
        
        # Get mongorestore path (try local first, then system)
        local_mongorestore = os.path.join(os.path.dirname(__file__), "mongodb-tools", "mongorestore.exe")
        mongorestore_cmd = local_mongorestore if os.path.exists(local_mongorestore) else "mongorestore"
        
        # Run mongorestore (will DROP existing database!)
        result = subprocess.run(
            [
                mongorestore_cmd,
                f"--host={mongo_host}",
                f"--db={db_name}",
                "--drop",  # Drop existing collections before restoring
                temp_dir
            ],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        # Cleanup temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        if result.returncode == 0:
            return {
                "message": "Database restored successfully",
                "backup_id": backup_id,
                "restored_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            raise Exception(f"mongorestore failed: {result.stderr}")
            
    except FileNotFoundError:
        return {
            "message": "Restore feature requires mongorestore to be installed",
            "error": "mongorestore not found in PATH",
            "note": "Install MongoDB Database Tools to enable restore"
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Restore timeout - backup too large")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@api_router.delete("/admin/backup/{backup_id}")
async def delete_backup(
    backup_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a backup file (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    import os
    
    # Get backup metadata
    backup = await db["backups"].find_one({"backup_id": backup_id})
    
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    
    filepath = backup.get("filepath")
    
    # Delete file from disk
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Delete metadata from database
    await db["backups"].delete_one({"backup_id": backup_id})
    
    return {"message": "Backup deleted successfully"}

@api_router.post("/admin/restart-server")
async def restart_server(current_user: dict = Depends(get_current_user)):
    """Restart server (admin only) - NOT RECOMMENDED IN PRODUCTION"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    import sys
    import os
    import signal
    
    # WARNING: This is dangerous and should be used with caution
    # In production, use a process manager like supervisor, systemd, or PM2
    
    # Log the restart request
    print("=" * 50)
    print("SERVER RESTART REQUESTED BY ADMIN")
    print(f"Admin ID: {current_user.get('user_id')}")
    print(f"Admin Email: {current_user.get('email')}")
    print("=" * 50)
    
    # Return response immediately before restarting
    import asyncio
    
    async def delayed_restart():
        await asyncio.sleep(2)  # Wait 2 seconds to send response
        
        # Get the current process ID
        pid = os.getpid()
        
        # Send SIGTERM to gracefully shutdown
        # uvicorn will automatically restart if run with --reload
        os.kill(pid, signal.SIGTERM)
    
    # Schedule restart without blocking response
    asyncio.create_task(delayed_restart())
    
    return {
        "message": "Server restart initiated - restarting in 2 seconds",
        "note": "Server will restart automatically if running with --reload flag",
        "warning": "In production, use a process manager (systemd/supervisor/PM2) instead"
    }

@api_router.get("/admin/platform-settings")
async def get_platform_settings(current_user: dict = Depends(get_current_user)):
    """Get platform settings (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get or create settings document
    settings = await db["platform_settings"].find_one({"settings_id": "global"})
    
    if not settings:
        # Create default settings
        settings = {
            "settings_id": "global",
            "maintenance_mode": False,
            "auto_approve_tenants": True,
            "notification_email": "admin@fixgsm.com",
            "landing_page_url": "https://fixgsm.ro",
            "support_email": "support@fixgsm.ro",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db["platform_settings"].insert_one(settings)
    
    # Convert ObjectId to string
    if "_id" in settings:
        settings["_id"] = str(settings["_id"])
    
    return settings

@api_router.put("/admin/platform-settings")
async def update_platform_settings(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update platform settings (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update only provided fields
    if "maintenance_mode" in data:
        update_data["maintenance_mode"] = data["maintenance_mode"]
    if "auto_approve_tenants" in data:
        update_data["auto_approve_tenants"] = data["auto_approve_tenants"]
    if "notification_email" in data:
        update_data["notification_email"] = data["notification_email"]
    if "landing_page_url" in data:
        update_data["landing_page_url"] = data["landing_page_url"]
    if "support_email" in data:
        update_data["support_email"] = data["support_email"]
    if "estimated_maintenance_time" in data:
        update_data["estimated_maintenance_time"] = data["estimated_maintenance_time"]
    
    # Update or create settings
    result = await db["platform_settings"].update_one(
        {"settings_id": "global"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully", "updated": update_data}

@api_router.get("/maintenance-status")
async def get_maintenance_status():
    """Get maintenance mode status (public endpoint - no auth required)"""
    settings = await db["platform_settings"].find_one({"settings_id": "global"})
    
    if not settings:
        return {
            "maintenance_mode": False,
            "support_email": "support@fixgsm.ro",
            "estimated_time": None
        }
    
    return {
        "maintenance_mode": settings.get("maintenance_mode", False),
        "support_email": settings.get("support_email", "support@fixgsm.ro"),
        "estimated_time": settings.get("estimated_maintenance_time", None)
    }

# ==================== LOGGING SYSTEM ====================

async def create_log(
    log_type: str,  # "system" or "activity"
    level: str,  # "info", "warning", "error", "critical"
    category: str,  # "auth", "api", "database", "user_action", etc.
    message: str,
    user_id: str = None,
    user_email: str = None,
    tenant_id: str = None,
    metadata: dict = None,
    ip_address: str = None,
    user_agent: str = None
):
    """Create a log entry in the database"""
    log_entry = {
        "log_id": str(uuid.uuid4()),
        "log_type": log_type,
        "level": level,
        "category": category,
        "message": message,
        "user_id": user_id,
        "user_email": user_email,
        "tenant_id": tenant_id,
        "metadata": metadata or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "timestamp": datetime.now(timezone.utc).timestamp()
    }
    
    try:
        await db["logs"].insert_one(log_entry)
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"Error creating log: {str(e)}")

@api_router.get("/admin/logs")
async def get_logs(
    log_type: str = None,  # "system" or "activity"
    level: str = None,  # "info", "warning", "error", "critical"
    category: str = None,
    tenant_id: str = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get logs (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {}
    if log_type:
        query["log_type"] = log_type
    if level:
        query["level"] = level
    if category:
        query["category"] = category
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    # Get total count
    total = await db["logs"].count_documents(query)
    
    # Get logs with pagination
    logs = await db["logs"].find(query).sort("timestamp", -1).skip(offset).limit(limit).to_list(limit)
    
    # Convert ObjectId to string
    for log in logs:
        log["_id"] = str(log["_id"])
    
    return {
        "logs": logs,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@api_router.get("/admin/logs/stats")
async def get_logs_stats(current_user: dict = Depends(get_current_user)):
    """Get log statistics (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get counts by level
    pipeline = [
        {
            "$group": {
                "_id": "$level",
                "count": {"$sum": 1}
            }
        }
    ]
    
    level_stats = {}
    async for doc in db["logs"].aggregate(pipeline):
        level_stats[doc["_id"]] = doc["count"]
    
    # Get counts by category
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1}
            }
        }
    ]
    
    category_stats = {}
    async for doc in db["logs"].aggregate(pipeline):
        category_stats[doc["_id"]] = doc["count"]
    
    # Get recent errors (last 24 hours)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    recent_errors = await db["logs"].count_documents({
        "level": {"$in": ["error", "critical"]},
        "created_at": {"$gte": yesterday.isoformat()}
    })
    
    # Total logs
    total_logs = await db["logs"].count_documents({})
    
    return {
        "total_logs": total_logs,
        "level_stats": level_stats,
        "category_stats": category_stats,
        "recent_errors_24h": recent_errors
    }

@api_router.delete("/admin/logs")
async def clear_logs(
    older_than_days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Clear old logs (admin only)"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=older_than_days)
    
    result = await db["logs"].delete_many({
        "created_at": {"$lt": cutoff_date.isoformat()}
    })
    
    # Log this action
    await create_log(
        log_type="system",
        level="info",
        category="maintenance",
        message=f"Cleared {result.deleted_count} logs older than {older_than_days} days",
        user_id=current_user.get("user_id"),
        user_email=current_user.get("email")
    )
    
    return {
        "message": f"Deleted {result.deleted_count} logs",
        "deleted_count": result.deleted_count
    }

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
# Clean up any whitespace
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

# Log CORS configuration for debugging
logger.info(f"CORS Origins configured: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()