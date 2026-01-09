import requests
import time

def test_history():
    print("Testing /history endpoint...")
    start = time.time()
    try:
        res = requests.post("http://localhost:8000/history", json={
            "ticker": "AAPL",
            "period": "6mo",
            "api_source": "yahoo"
        })
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"Got {len(data.get('history', []))} records")
            print(f"Time: {time.time() - start:.2f}s")
        else:
            print("Error:", res.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test_history()
