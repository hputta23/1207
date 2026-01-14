import pandas as pd
from backend.data_service import fetch_stock_data

def test_historical_data():
    print("Testing fetch_stock_data for Analytics...")
    ticker = "AAPL"
    try:
        print(f"Fetching 6mo data for {ticker}...")
        df = fetch_stock_data(ticker, period="6mo")
        
        if df.empty:
            print("❌ No data returned.")
        else:
            print(f"✅ Data received: {len(df)} rows.")
            print(df.tail())
            
            # Check for required columns
            required = ['Date', 'Close', 'Open', 'High', 'Low', 'Volume']
            missing = [c for c in required if c not in df.columns]
            if missing:
                print(f"❌ Missing columns: {missing}")
            else:
                print("✅ All required columns present.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_historical_data()
