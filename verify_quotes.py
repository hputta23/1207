import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_quotes():
    print("Testing /quotes endpoint...")
    tickers = ["AAPL", "MSFT", "GOOGL"]
    
    try:
        # We can't actually hit localhost:8000 here because the server isn't running in this environment.
        # But we can import `main` and test the function directly if we want, OR we can rely on unit tests.
        # Given the environment, let's try to import the backend function directly.
        from backend.data_service import get_batch_quotes
        
        print("Fetching batch quotes for:", tickers)
        quotes = get_batch_quotes(tuple(tickers))
        
        if not quotes:
            print("❌ No quotes returned (could be due to no internet/mock removed).")
            # If no internet, this is expected.
        else:
            print(f"✅ Received {len(quotes)} quotes.")
            for q in quotes:
                print(f"  - {q['symbol']}: ${q['price']:.2f} ({q['changePercent']:.2f}%)")
                if q['price'] == 0 or q['price'] is None:
                     print(f"    ⚠️ Warning: Price is invalid for {q['symbol']}")

    except ImportError:
         print("❌ Could not import backend modules. Make sure you run this from the root.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_quotes()
