import requests
import json

# Test simple request
print("Testing server response...")

try:
    # Test if server is responding
    response = requests.get("http://localhost:8000/")
    print(f"Server status: {response.status_code}")
except Exception as e:
    print(f"Server not responding: {e}")

# Test login endpoint
print("\nTesting login endpoint...")

login_data = {
    "email": "Test2@B.com",
    "password": "Coolzone"
}

try:
    response = requests.post(
        "http://localhost:8000/api/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Request failed: {e}")

# Test with a known working user (admin)
print("\nTesting with admin user...")

admin_data = {
    "email": "admin@fixgsm.com",
    "password": "admin123"
}

try:
    response = requests.post(
        "http://localhost:8000/api/auth/login",
        json=admin_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Admin login status: {response.status_code}")
    if response.status_code == 200:
        print("Admin login works!")
    else:
        print(f"Admin login failed: {response.text}")
        
except Exception as e:
    print(f"Admin request failed: {e}")
