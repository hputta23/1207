import yfinance as yf
import time

def test_live_fetch():
    ticker = "AAPL"
    print(f"Fetching live data for {ticker}...")
    
    # Method 1: fast_info
    start = time.time()
    stock = yf.Ticker(ticker)
    price = stock.fast_info.last_price
    print(f"Fast Info Price: {price}")
    print(f"Time: {time.time() - start:.4f}s")
    
    # Method 2: download last 1m
    start = time.time()
    df = yf.download(ticker, period="1d", interval="1m", progress=False)
    if not df.empty:
        last_row = df.iloc[-1]
        print(f"1m Candle Close: {last_row['Close'].iloc[0] if hasattr(last_row['Close'], 'iloc') else last_row['Close']}")
        print(f"Timestamp: {last_row.name}")
    print(f"Time: {time.time() - start:.4f}s")

if __name__ == "__main__":
    test_live_fetch()
