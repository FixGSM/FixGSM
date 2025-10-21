import requests

BACKEND_URL = "http://localhost:8000"

# Test with different email variations
emails = ["Test2@B.com", "test2@b.com", "TEST2@B.COM"]

for email in emails:
    print(f"\n=== Testing with email: {email} ===")
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "email": email,
        "password": "Coolzone"
    })

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

    if response.status_code == 200:
        print("[SUCCESS] Login successful!")
        print(f"User Type: {response.json().get('user_type')}")
        print(f"Name: {response.json().get('name')}")
        print(f"Role: {response.json().get('role')}")
        break
    else:
        print("[ERROR] Login failed!")
        print(f"Detail: {response.json().get('detail')}")

