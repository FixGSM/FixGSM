import requests
import json

# Login as tenant (Tony)
login_response = requests.post('http://localhost:8000/api/auth/login', json={
    'email': 'office@brandmobile.ro',
    'password': 'Coolzone'
})

print("=== LOGIN RESPONSE (Tenant Tony) ===")
print(f"Status: {login_response.status_code}")
if login_response.status_code == 200:
    print(f"Response: {json.dumps(login_response.json(), indent=2)}")
    
    token = login_response.json()['token']
    print(f"\nToken: {token[:50]}...")
    
    # Test subscription status endpoint
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n=== TESTING SUBSCRIPTION STATUS ===")
    status_response = requests.get(
        'http://localhost:8000/api/tenant/subscription-status',
        headers=headers
    )
    
    print(f"Status: {status_response.status_code}")
    if status_response.status_code == 200:
        data = status_response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        
        print("\n=== KEY VALUES ===")
        print(f"days_until_expiry: {data.get('days_until_expiry')}")
        print(f"is_expiring_soon: {data.get('is_expiring_soon')}")
        print(f"subscription_end_date: {data.get('subscription_end_date')}")
        print(f"subscription_price: {data.get('subscription_price')}")
    else:
        print(f"Response: {status_response.text}")
else:
    print(f"Login failed: {login_response.text}")

