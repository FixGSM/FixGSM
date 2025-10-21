import requests
import json

# Login as tenant (Tony)
login_response = requests.post('http://localhost:8000/api/auth/login', json={
    'email': 'office@brandmobile.ro',
    'password': 'Coolzone'
})

print("=== LOGIN RESPONSE ===")
print(f"Status: {login_response.status_code}")
if login_response.status_code == 200:
    print(f"Response: {json.dumps(login_response.json(), indent=2)}")
    
    token = login_response.json()['token']
    print(f"\nToken: {token[:50]}...")
    
    # Test payment endpoint
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n=== TESTING PAYMENT ENDPOINT ===")
    payment_response = requests.post(
        'http://localhost:8000/api/tenant/process-payment',
        headers=headers,
        json={
            'plan': 'Pro',
            'months': 1
        }
    )
    
    print(f"Status: {payment_response.status_code}")
    if payment_response.status_code == 200:
        data = payment_response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
    else:
        print(f"Error Response: {payment_response.text}")
else:
    print(f"Login failed: {login_response.text}")

