import requests
import json

# First, login as admin
login_response = requests.post('http://localhost:8000/api/auth/login', json={
    'email': 'admin@fixgsm.com',
    'password': 'admin123'
})

print("=== LOGIN RESPONSE ===")
print(f"Status: {login_response.status_code}")
print(f"Response: {login_response.json()}")

if login_response.status_code == 200:
    token = login_response.json()['token']
    print(f"\nToken: {token[:50]}...")
    
    # Now test update endpoint
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n=== TESTING UPDATE SUBSCRIPTION END DATE ===")
    update_response = requests.post(
        'http://localhost:8000/api/admin/update-subscription-end-date',
        headers=headers,
        json={
            'tenant_id': '402f8edb-eaa3-4e0a-ab6a-39c32a001dec',
            'end_date': '2025-10-25T12:00:00.000Z'
        }
    )
    
    print(f"Status: {update_response.status_code}")
    print(f"Response: {update_response.text}")
    
    print("\n=== TESTING TOGGLE TENANT STATUS ===")
    status_response = requests.post(
        'http://localhost:8000/api/admin/toggle-tenant-status',
        headers=headers,
        json={
            'tenant_id': '402f8edb-eaa3-4e0a-ab6a-39c32a001dec',
            'status': 'active'
        }
    )
    
    print(f"Status: {status_response.status_code}")
    print(f"Response: {status_response.text}")
else:
    print("Login failed!")

