import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import requests
import os

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
    try:
        # Mock Data Logic
        if api_source == "mock":
            return generate_mock_data(ticker, period)

        # Alpha Vantage
        if api_source == "alpha_vantage":
            return fetch_alpha_vantage_data(ticker, period, api_key)

        # Finnhub
        if api_source == "finnhub":
            return fetch_finnhub_data(ticker, period, api_key)

        # Polygon.io
        if api_source == "polygon":
            return fetch_polygon_data(ticker, period, api_key)

        # Default to Yahoo Finance
        stock = yf.Ticker(ticker)
        
        # Enforce minimum period of 6mo for models (need 60 days look_back)
        fetch_period = period
        if period in ["1mo", "2mo", "3mo"]:
            fetch_period = "6mo"
            
        # Fetch history
        hist = stock.history(period=fetch_period)
        
        if hist.empty:
            raise ValueError(f"No data found for ticker {ticker}")
            
        # Reset index to get Date as a column
        hist = hist.reset_index()
        
        # Keep relevant columns for visualization and modeling
        data = hist[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        
        # Ensure Date is timezone naive or consistent
        data['Date'] = pd.to_datetime(data['Date']).dt.tz_localize(None)
        
        # Add Technical Indicators
        data = add_technical_indicators(data)
        
        return data
    except Exception as e:
        raise ValueError(f"Error fetching data for {ticker}: {str(e)}")

def generate_mock_data(ticker, period):
    import numpy as np
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

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    if 'Error Message' in data:
        raise ValueError(f"Alpha Vantage error: {data['Error Message']}")

    if 'Note' in data:
        raise ValueError("Alpha Vantage API call frequency limit reached")

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
    df = df.sort_values('Date').reset_index(drop=True)

    # Filter by period
    df = filter_by_period(df, period)

    return add_technical_indicators(df)

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
