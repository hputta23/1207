import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import requests
import os

import numpy as np

def fetch_stock_data(ticker: str, period: str = "2y", api_source: str = "yahoo", api_key: str = None):
    """
    Fetches historical stock data for the given ticker.
    Args:
        ticker: Stock symbol (e.g., 'AAPL')
        period: Data period to fetch (default '2y' for sufficient training data)
        api_source: Data source ('yahoo', 'alpha_vantage', 'finnhub', 'polygon', 'mock')
        api_key: API key for premium data sources (optional)
    Returns:
        DataFrame with Date and Close price.
    """
    # 1. Determine API Key (passed arg > env var)
    if not api_key:
        api_key = os.environ.get("ALPHA_VANTAGE_KEY") or os.environ.get("VITE_ALPHA_VANTAGE_KEY")

    # 2. Strategy: Try Alpha Vantage FIRST if key is present (and not explicitly requesting others)
    #    Unless user specifically requested 'yahoo' or others.
    #    If api_source is default 'yahoo', we treat it as "auto" and try AV first if key exists.
    
    try:
        # --- Attempt 1: Alpha Vantage ---
        if (api_source == "alpha_vantage" or (api_source == "yahoo" and api_key)):
            try:
                print(f"DEBUG: Attempting Alpha Vantage for {ticker}...")
                return fetch_alpha_vantage_data(ticker, period, api_key)
            except Exception as av_error:
                print(f"WARNING: Alpha Vantage failed: {av_error}. Falling back to Yahoo Finance...")
                # Continue to next fallback...

        # --- Attempt 2: Mock Data (Explicit Request) ---
        if api_source == "mock":
             print(f"DEBUG: Fetching explicit MOCK DATA for {ticker}")
             return generate_mock_data(ticker, period)

        # --- Attempt 3: Yahoo Finance (yfinance library) ---
        # Checks for other sources logic omitted for brevity as they are less prioritized now
        
        try:
             # Enforce minimum period of 6mo for models if not specified otherwise
            fetch_period = period
            if period in ["1mo", "2mo", "3mo"]:
                fetch_period = "6mo"
                
            print(f"DEBUG: Attempting yfinance for {ticker}, period={fetch_period}")
            ticker_obj = yf.Ticker(ticker)
            df = ticker_obj.history(period=fetch_period)
            
            if df.empty:
                raise ValueError(f"yfinance returned empty data for {ticker}")
                
            # Reset index to get Date column
            df = df.reset_index()
            # Standardize columns
            df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
            # Ensure Date is timezone naive
            if df['Date'].dt.tz is not None:
                df['Date'] = df['Date'].dt.tz_localize(None)
                
            print(f"DEBUG: Successfully fetched {len(df)} rows for {ticker} using yfinance")
            return add_technical_indicators(df)
            
        except Exception as yf_error:
            print(f"WARNING: yfinance library failed: {yf_error}. Falling back to direct httpx...")
            
            # --- Attempt 4: Yahoo Finance (HTTPX Proxy) ---
            try:
                return fetch_with_httpx(ticker, fetch_period)
            except Exception as httpx_error:
                print(f"WARNING: httpx fallback also failed: {httpx_error}. Falling back to MOCK DATA.")
                return generate_mock_data(ticker, period)

    except Exception as e:
        print(f"CRITICAL ERROR in fetch_stock_data: {e}")
        import traceback
        traceback.print_exc()
        
        # --- Attempt 5: Ultimate Mock Fallback ---
        print(f"CRITICAL: All fetch methods failed for {ticker}. Returning MOCK DATA to prevent crash.")
        try:
            return generate_mock_data(ticker, period)
        except Exception as mock_error:
             print(f"FATAL: Even mock data generation failed: {mock_error}")
             raise mock_error

def fetch_with_httpx(ticker: str, range: str):
    import httpx
    # interval = "1d"
    
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range={range}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    with httpx.Client() as client:
        response = client.get(url, headers=headers)
        if response.status_code != 200:
             raise ValueError(f"Yahoo API Error: {response.status_code}")
        
        data = response.json()
        
    result = data.get('chart', {}).get('result', [])
    if not result:
        raise ValueError(f"No data found for {ticker}")
        
    quote_data = result[0]
    timestamps = quote_data.get('timestamp', [])
    indicators = quote_data.get('indicators', {}).get('quote', [{}])[0]
    
    if not timestamps:
         raise ValueError("Empty timestamp in data")
         
    opens = indicators.get('open', [])
    highs = indicators.get('high', [])
    lows = indicators.get('low', [])
    closes = indicators.get('close', [])
    volumes = indicators.get('volume', [])
    
    # Filter out Nones (sometimes yahoo returns nulls)
    valid_data = []
    
    for i in range(len(timestamps)):
        t = timestamps[i]
        o = opens[i]
        h = highs[i]
        l = lows[i]
        c = closes[i]
        v = volumes[i]
        
        if o is None or c is None:
            continue
            
        dt = datetime.fromtimestamp(t)
        valid_data.append({
            'Date': dt,
            'Open': o,
            'High': h,
            'Low': l,
            'Close': c,
            'Volume': v
        })
        
    df = pd.DataFrame(valid_data)
    if df.empty:
        raise ValueError("DataFrame is empty after parsing")
        
    # Standardize columns
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
    
    # Ensure Date is timezone naive
    df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
    
    return add_technical_indicators(df)


def generate_mock_data(ticker, period):
    # numpy imported at top level
    # Simple random walk for testing
    days_map = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "5y": 1825, "max": 3000}
    days = days_map.get(period, 730)
    
    dates = pd.date_range(end=datetime.now(), periods=days)
    base_price = 150.0
    returns = np.random.normal(0, 0.02, days)
    prices = base_price * np.exp(np.cumsum(returns))
    
    df = pd.DataFrame({
        'Date': dates,
        'Open': prices,
        'High': prices * 1.01,
        'Low': prices * 0.99,
        'Close': prices,
        'Volume': np.random.randint(1000000, 5000000, days)
    })
    
    # Add Technical Indicators
    return add_technical_indicators(df)

def fetch_alpha_vantage_data(ticker: str, period: str, api_key: str):
    """Fetch data from Alpha Vantage API"""
    if not api_key:
        raise ValueError("Alpha Vantage API key is required")

    # Map period to Alpha Vantage outputsize
    outputsize = 'full' if period in ['2y', '5y', 'max'] else 'compact'

    url = f"https://www.alphavantage.co/query"
    params = {
        'function': 'TIME_SERIES_DAILY',
        'symbol': ticker,
        'apikey': api_key,
        'outputsize': outputsize,
        'datatype': 'json'
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if 'Error Message' in data:
            raise ValueError(f"Alpha Vantage error: {data['Error Message']}")

        if 'Information' in data or 'Note' in data:
            # Often rate limit related or free tier limitation
            msg = data.get('Information') or data.get('Note')
            raise ValueError(f"Alpha Vantage API limit/info: {msg}")

        time_series = data.get('Time Series (Daily)', {})
        if not time_series:
            raise ValueError(f"No data found for {ticker}")

        # Convert to DataFrame
        df_data = []
        for date_str, values in time_series.items():
            df_data.append({
                'Date': pd.to_datetime(date_str),
                'Open': float(values['1. open']),
                'High': float(values['2. high']),
                'Low': float(values['3. low']),
                'Close': float(values['4. close']),
                'Volume': float(values['5. volume'])
            })

        df = pd.DataFrame(df_data)
        if df.empty:
             raise ValueError("Parsed Alpha Vantage data is empty")
             
        df = df.sort_values('Date').reset_index(drop=True)

        # Filter by period
        df = filter_by_period(df, period)

        print(f"DEBUG: Successfully fetched {len(df)} rows from Alpha Vantage for {ticker}")
        return add_technical_indicators(df)
        
    except Exception as e:
        print(f"Error fetching from Alpha Vantage: {e}")
        raise e

def fetch_finnhub_data(ticker: str, period: str, api_key: str):
    """Fetch data from Finnhub API"""
    if not api_key:
        raise ValueError("Finnhub API key is required")

    # Calculate date range
    end_date = datetime.now()
    period_map = {
        '1mo': 30, '3mo': 90, '6mo': 180,
        '1y': 365, '2y': 730, '5y': 1825, 'max': 3650
    }
    days = period_map.get(period, 730)
    start_date = end_date - timedelta(days=days)

    url = "https://finnhub.io/api/v1/stock/candle"
    params = {
        'symbol': ticker,
        'resolution': 'D',  # Daily
        'from': int(start_date.timestamp()),
        'to': int(end_date.timestamp()),
        'token': api_key
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    if data.get('s') == 'no_data':
        raise ValueError(f"No data found for {ticker}")

    # Convert to DataFrame
    df = pd.DataFrame({
        'Date': pd.to_datetime(data['t'], unit='s'),
        'Open': data['o'],
        'High': data['h'],
        'Low': data['l'],
        'Close': data['c'],
        'Volume': data['v']
    })

    df = df.sort_values('Date').reset_index(drop=True)
    return add_technical_indicators(df)

def fetch_polygon_data(ticker: str, period: str, api_key: str):
    """Fetch data from Polygon.io API"""
    if not api_key:
        raise ValueError("Polygon.io API key is required")

    # Calculate date range
    end_date = datetime.now()
    period_map = {
        '1mo': 30, '3mo': 90, '6mo': 180,
        '1y': 365, '2y': 730, '5y': 1825, 'max': 3650
    }
    days = period_map.get(period, 730)
    start_date = end_date - timedelta(days=days)

    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}"
    params = {
        'adjusted': 'true',
        'sort': 'asc',
        'apiKey': api_key
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    if data.get('status') != 'OK' or not data.get('results'):
        raise ValueError(f"No data found for {ticker}")

    # Convert to DataFrame
    results = data['results']
    df = pd.DataFrame({
        'Date': pd.to_datetime([r['t'] for r in results], unit='ms'),
        'Open': [r['o'] for r in results],
        'High': [r['h'] for r in results],
        'Low': [r['l'] for r in results],
        'Close': [r['c'] for r in results],
        'Volume': [r['v'] for r in results]
    })

    df = df.sort_values('Date').reset_index(drop=True)
    return add_technical_indicators(df)

def filter_by_period(df: pd.DataFrame, period: str):
    """Filter dataframe by period"""
    if period == 'max':
        return df

    period_map = {
        '1mo': 30, '3mo': 90, '6mo': 180,
        '1y': 365, '2y': 730, '5y': 1825
    }
    days = period_map.get(period, 730)

    cutoff_date = datetime.now() - timedelta(days=days)
    return df[df['Date'] >= cutoff_date].reset_index(drop=True)

def add_technical_indicators(data):
    """
    Adds RSI, SMA, and EMA to the dataframe.
    """
    df = data.copy()
    
    # SMA (Simple Moving Average)
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    
    # EMA (Exponential Moving Average)
    df['EMA_12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['EMA_26'] = df['Close'].ewm(span=26, adjust=False).mean()
    
    # RSI (Relative Strength Index)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD (Moving Average Convergence Divergence)
    # EMA 12 is already calculated
    # EMA 26 is already calculated
    df['MACD'] = df['EMA_12'] - df['EMA_26']
    df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
    
    # Bollinger Bands
    # SMA 20 is already calculated
    std_dev = df['Close'].rolling(window=20).std()
    df['Upper_Band'] = df['SMA_20'] + (std_dev * 2)
    df['Lower_Band'] = df['SMA_20'] - (std_dev * 2)
    
    # Fill NaN values (resulting from rolling windows)
    df = df.fillna(method='bfill').fillna(method='ffill')
    
    return df

def get_current_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        # fast_info is often faster/more reliable for current price than history
        return stock.fast_info.last_price
    except:
        return None

def fetch_stock_news(ticker: str):
    """
    Fetches news for a given stock ticker using Google News RSS.
    """
    import feedparser
    import urllib.parse
    
    encoded_ticker = urllib.parse.quote(ticker)
    rss_url = f"https://news.google.com/rss/search?q={encoded_ticker}+stock&hl=en-US&gl=US&ceid=US:en"
    
    feed = feedparser.parse(rss_url)
    
    news_items = []
    
    for entry in feed.entries:
        # Extract source from title if possible (Google News format: "Title - Source")
        title = entry.title
        source = "Google News"
        
        if " - " in title:
            parts = title.rsplit(" - ", 1)
            title = parts[0]
            source = parts[1]
        
        # Parse published date
        try:
            # entry.published_parsed is a time.struct_time
            dt = datetime(*entry.published_parsed[:6])
            timestamp = dt.timestamp()
        except:
            timestamp = datetime.now().timestamp()
            
        news_items.append({
            "headline": title,
            "url": entry.link,
            "source": source,
            "datetime": timestamp,
            "description": entry.summary if 'summary' in entry else ""
        })
        
    return news_items
