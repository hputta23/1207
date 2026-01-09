import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'stonks-daily-temp'))

from backend.data_service import fetch_stock_data
import time

print("Testing fetch_stock_data...")
try:
    start = time.time()
    df = fetch_stock_data("AAPL", period="6mo", api_source="yahoo")
    print("Done.")
    print(f"Shape: {df.shape}")
    print(f"Time: {time.time() - start:.2f}s")
except Exception as e:
    print("Error:", e)
