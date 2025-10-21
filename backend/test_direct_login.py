import requests
import json

BACKEND_URL = "http://localhost:8000"

# Test direct login
print("Testing direct login...")

data = {
    "email": "Test2@B.com",
    "password": "Coolzone"
}

print(f"Request data: {data}")

try:
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login", 
        json=data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    try:
        response_json = response.json()
        print(f"Response JSON: {response_json}")
    except:
        print(f"Response Text: {response.text}")
        
except Exception as e:
    print(f"Request error: {e}")

# Also test with curl equivalent
print("\n" + "="*50)
print("Testing with different approach...")

import subprocess
import sys

curl_cmd = [
    "curl", "-X", "POST",
    f"{BACKEND_URL}/api/auth/login",
    "-H", "Content-Type: application/json",
    "-d", json.dumps(data)
]

try:
    result = subprocess.run(curl_cmd, capture_output=True, text=True)
    print(f"Curl status: {result.returncode}")
    print(f"Curl output: {result.stdout}")
    print(f"Curl error: {result.stderr}")
except Exception as e:
    print(f"Curl error: {e}")
