#!/usr/bin/env python3
"""Quick script to test if backend is responding"""
import requests
import json

def test_backend():
    url = "https://terminal-pro-api.onrender.com"

    print("Testing Terminal Pro Backend...")
    print(f"URL: {url}")
    print("-" * 50)

    # Test 1: Health endpoint
    print("\n1. Testing /health endpoint...")
    try:
        response = requests.get(f"{url}/health", timeout=10)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
            print("   ✅ Health check PASSED")
        else:
            print(f"   ❌ Health check FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

    # Test 2: Root endpoint
    print("\n2. Testing / (root) endpoint...")
    try:
        response = requests.get(url, timeout=10)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
            print("   ✅ Root endpoint PASSED")
        else:
            print(f"   ❌ Root endpoint FAILED: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

    # Test 3: CORS headers
    print("\n3. Testing CORS configuration...")
    try:
        response = requests.options(f"{url}/health", headers={
            'Origin': 'https://1207-mu.vercel.app',
            'Access-Control-Request-Method': 'GET'
        }, timeout=10)
        print(f"   Status Code: {response.status_code}")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        if cors_headers:
            print(f"   CORS Headers: {json.dumps(cors_headers, indent=2)}")
            print("   ✅ CORS check PASSED")
        else:
            print("   ⚠️  No CORS headers found")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

    print("\n" + "=" * 50)
    print("Backend health check complete!")

if __name__ == "__main__":
    test_backend()
