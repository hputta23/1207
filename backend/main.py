from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from backend.data_service import fetch_stock_data, get_current_price, fetch_stock_news, get_batch_quotes
from backend.model import get_predictor
import traceback
import os
import datetime

app = FastAPI()

# Proxy for Yahoo Finance (for Market Overview & Trending service)
import requests
@app.get("/api/yahoo/{path:path}")
def proxy_yahoo(path: str):
    url = f"https://query1.finance.yahoo.com/{path}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    try:
        resp = requests.get(url, headers=headers)
        return resp.json()
    except Exception as e:
        print(f"Proxy Error: {e}")
        raise HTTPException(status_code=500, detail="Proxy failed")

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat(),
        "service": "stonks-daily"
    }

# Removed static file mounting - frontend deployed separately

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "https://1207-mu.vercel.app", 
        "https://1207-git-main-hp23s-projects.vercel.app",
        "https://stonks-daily-temp.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    ticker: str
    days: int = 30
    model_type: str = "lstm"
    period: str = "2y"
    run_simulation: bool = False
    simulation_method: str = "gbm"
    api_source: str = "yahoo"
    strategy: str = None
    initial_capital: float = 10000.0
    commission: float = 0.001 # 0.1% transaction cost
    drift_adj: float = 0.0 # Percentage to add/subtract from drift (e.g. 0.05 for +5%)
    volatility_adj: float = 0.0 # Multiplier (e.g. 1.2 for 20% higher vol from historical)



@app.get("/")
async def read_root():
    return {
        "message": "Terminal Pro API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "history": "/history",
            "news": "/news/{ticker}",
            "predict": "/predict",
            "simulate": "/simulate",
            "backtest": "/backtest"
        }
    }

class HistoryRequest(BaseModel):
    ticker: str
    period: str = "2y"
    api_source: str = "yahoo"
    api_key: str = None

@app.post("/history")
async def get_history(request: HistoryRequest):
    try:
        data = fetch_stock_data(request.ticker, period=request.period, api_source=request.api_source, api_key=request.api_key)
        
        # Minimize payload, we only need date and close for comparison
        historical_data = []
        for index, row in data.iterrows():
            historical_data.append({
                "date": row['Date'].isoformat(),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": float(row['Volume'])
            })
            
        return {
            "ticker": request.ticker,
            "period": request.period,
            "history": historical_data
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quotes")
async def get_quotes(request: dict):
    tickers = request.get("tickers", [])
    if not tickers:
        return []
    return get_batch_quotes(tuple(tickers))

@app.get("/quote/{ticker}")
async def get_quote(ticker: str):
    data = get_batch_quotes(tuple([ticker]))
    if data:
        return data[0]
    raise HTTPException(status_code=404, detail="Quote not found")

@app.get("/news/{ticker}")
async def get_news(ticker: str):
    try:
        news_items = fetch_stock_news(ticker)
        return {"ticker": ticker, "news": news_items}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def predict(request: PredictionRequest):
    try:
        # 1. Fetch Data
        data = fetch_stock_data(request.ticker, period=request.period, api_source=request.api_source)
        
        # 2. Train Models to run
        models_to_run = []
        if request.model_type == "all":
            models_to_run = ["random_forest", "svr", "gradient_boosting", "monte_carlo"]
        else:
            if request.model_type == "lstm":
                 models_to_run = ["random_forest"] # Fallback
            else:
                 models_to_run = [request.model_type]
            
        if request.run_simulation:
            if "monte_carlo" not in models_to_run:
                models_to_run.append("monte_carlo")
            
        results = []
        
        for model_name in models_to_run:
            # Train Model
            predictor = get_predictor(model_name)
            # Train on all available data
            history, scaled_data = predictor.train(data, epochs=20) 
            
            # Predict Future
            future_dates, future_prices = predictor.predict_future(data, days=request.days)
            
            predictions = []
            for date, price in zip(future_dates, future_prices):
                predictions.append({
                    "date": date.isoformat(),
                    "price": float(price)
                })
                
            results.append({
                "model": model_name,
                "predictions": predictions,
                "metrics": {
                    "loss": float(history.history['loss'][-1]) if history and 'loss' in history.history else 0
                }
            })
        
        # 4. Prepare Response
        # Convert timestamps to ISO strings
        historical_data = []
        for index, row in data.iterrows():
            item = {
                "date": row['Date'].isoformat(),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": float(row['Volume']),
                "sma_20": float(row['SMA_20']),
                "sma_50": float(row['SMA_50']),
                "rsi": float(row['RSI']),
                "macd": float(row['MACD']),
                "signal_line": float(row['Signal_Line']),
                "upper_band": float(row['Upper_Band']),
                "lower_band": float(row['Lower_Band'])
            }
            historical_data.append(item)
            
        current_price = get_current_price(request.ticker)
        
        return {
            "ticker": request.ticker,
            "current_price": current_price,
            "historical": historical_data[-45:], # Return last 45 days (Zoomed In)
            "results": results
        }
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate")
async def simulate(request: PredictionRequest):
    try:
        # 1. Fetch Data
        data = fetch_stock_data(request.ticker, period=request.period, api_source=request.api_source)
        
        # 2. Get Monte Carlo Predictor
        predictor = get_predictor("monte_carlo")
        predictor.train(data) # Calculate drift/volatility
        
        # 3. Predict Paths
        # 3. Predict Paths
        # Run 5000 simulations for accurate metrics
        n_sims = 5000
        future_dates, mean_path, paths = predictor.predict_paths(
            data, 
            days=request.days, 
            iterations=n_sims, 
            method=request.simulation_method,
            drift_adj=request.drift_adj,
            volatility_adj=request.volatility_adj
        )
        
        # Format dates
        dates = [d.isoformat() for d in future_dates]
        
        # Prepare historical data for chart
        historical_data = []
        for index, row in data.iterrows():
            item = {
                "date": row['Date'].isoformat(),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": float(row['Volume']),
                "sma_20": float(row['SMA_20']),
                "sma_50": float(row['SMA_50']),
                "rsi": float(row['RSI']),
                "macd": float(row['MACD']),
                "signal_line": float(row['Signal_Line']),
                "upper_band": float(row['Upper_Band']),
                "lower_band": float(row['Lower_Band'])
            }
            historical_data.append(item)
            
        current_price = get_current_price(request.ticker)
        
        # Calculate Distribution (on ALL paths)
        final_prices = [path[-1] for path in paths]
        hist, bin_edges = np.histogram(final_prices, bins=20)
        
        distribution = {
            "bins": [float(b) for b in bin_edges[:-1]], # Start of each bin
            "counts": [int(c) for c in hist]
        }
        
        # Calculate Metrics
        var_95 = np.percentile(final_prices, 5) - current_price
        expected_return = (np.mean(final_prices) - current_price) / current_price

        # Optimization: Only return 100 paths for visualization to prevent frontend crash
        visual_paths = paths[:100]

        return {
            "ticker": request.ticker,
            "current_price": current_price,
            "historical": historical_data[-45:], # Return last 45 days (Zoomed In)
            "dates": dates,
            "mean_path": [float(p) for p in mean_path],
            "paths": [[float(p) for p in path] for path in visual_paths], # Limit to 100 paths
            "distribution": distribution,
            "var_95": float(var_95),
            "expected_return": float(expected_return)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/backtest")
async def backtest(request: PredictionRequest):
    try:
        # Check if this is a technical strategy backtest
        if request.strategy:
            return run_strategy_backtest(request)

        # 1. Fetch Data (fetch more data for backtesting, e.g., 2 years)
        data = fetch_stock_data(request.ticker, period="2y")
        
        # 2. Get Model
        models_to_test = []
        if request.model_type == "all":
            models_to_test = ["random_forest", "svr", "gradient_boosting", "monte_carlo"]
        else:
            if request.model_type == "lstm":
                models_to_test = ["random_forest"] # Fallback
            else:
                models_to_test = [request.model_type]
            
        results = []
        
        for model_name in models_to_test:
            predictor = get_predictor(model_name)
            backtest_result = predictor.backtest(data) 
            # Predictor.backtest returns { dates, actual, predicted, metrics }
            
            # --- Calculate Equity Curve for AI ---
            # Strategy: if Predicted (Next Day) > Current Price (Today) + Threshold, Buy.
            # However, 'predicted' array from predictor.backtest aligns with 'actual'.
            # It usually means Predicted[i] is the prediction for t=i made at t=i-1.
            # So if Predicted[i] > Actual[i-1] * (1 + threshold), we should have bought at i-1.
            
            actuals = backtest_result['actual']
            predicteds = backtest_result['predicted']
            dates_iso = [pd.to_datetime(d).isoformat() for d in backtest_result['dates']]
            
            initial_capital = request.initial_capital
            commission = request.commission
            position = 0
            cash = initial_capital
            equity_curve = []
            
            # We iterate through the series.
            # We need at least 2 points to compare previous actual with current prediction.
            
            for i in range(len(actuals)):
                # Default: no action/value update
                price = actuals[i]
                
                # Logic: At step i, we decide position for step i+1? 
                # OR we verify if we made profit at step i based on decision at i-1.
                
                # Simplified Vectorized Backtest simulation loop:
                # Decision at t: Compare Prediction(t+1) vs Price(t).
                # But here we have aligned arrays. Predicted[t] is prediction for time t.
                # So at t-1, we saw Prediction[t] and Price[t-1].
                
                if i == 0:
                    equity_curve.append(initial_capital)
                    continue
                    
                prev_price = actuals[i-1]
                curr_price = actuals[i] # This is price at t
                pred_price_for_curr = predicteds[i] # This is what we predicted for t
                
                # Signal generation at t-1:
                # If Prediction(t) > Price(t-1) * (1 + 0.001), Buy.
                
                signal = 0 # Neutral
                if pred_price_for_curr > prev_price * 1.002: # 0.2% expected gain threshold
                    signal = 1
                elif pred_price_for_curr < prev_price * 0.998: # 0.2% expected loss
                    signal = -1 # Sell/Short (but we only do Long/Cash for now)
                
                # EXECUTE TRADING based on Signal generated at t-1
                # The position was established at Close of t-1 (or Open of t).
                # Let's assume we trade at Close of t-1 based on the prediction for t.
                
                # Re-evaluating loop structure:
                # It's cleaner to keep state.
                # 'position' is amount of stock held entering day t.
                
                # But we are iterating i. i is "Today". 
                # We need to render the decision made yesterday.
                
                # Let's look at i as "Today".
                # We have Position from yesterday.
                # We update Equity based on Today's Price.
                
                # Then we calculate Signal for TOMORROW (i+1).
                # But we might not have Prediction(i+1) if i is last element.
                # The arrays are aligned.
                
                # Let's use the signal from (i) corresponding to prediction[i] vs actual[i-1] to determine if we SHOULD BE holding stock at i.
                
                should_hold = False
                if pred_price_for_curr > prev_price * 1.002:
                    should_hold = True
                    
                # Execute outcome of holding/not holding from i-1 to i
                cost_deduction = 0
                
                if should_hold:
                    # We wanted to be Long coming into i.
                    if position == 0:
                        # We bought at i-1.
                        # Price was prev_price.
                        # Commision handling roughly:
                        cost = cash * commission
                        buy_amt = cash - cost
                        position = buy_amt / prev_price
                        cash = 0
                        cost_deduction = cost
                else:
                    # We wanted to be Cash coming into i.
                    if position > 0:
                        # We sold at i-1.
                        sale_val = position * prev_price
                        cost = sale_val * commission
                        cash = sale_val - cost
                        position = 0
                        cost_deduction = cost
                        
                # Update Equity at i
                curr_val = cash + (position * curr_price)
                equity_curve.append(curr_val)
                
            metrics = backtest_result['metrics']
            final_val = equity_curve[-1] if equity_curve else initial_capital
            tot_ret = ((final_val - initial_capital) / initial_capital) * 100
            
            results.append({
                "model": model_name,
                "dates": dates_iso,
                "actual": [float(x) for x in actuals],
                "predicted": [float(x) for x in predicteds],
                "equity_curve": equity_curve,
                "total_return": tot_ret,
                "final_value": final_val,
                "metrics": metrics
            })
            
        # Top-level return of first model for frontend compatibility
        first_res = results[0] if results else {}
        
        return {
            "ticker": request.ticker,
            "results": results,
            # Flattened fields for BacktestPanel
            "dates": first_res.get("dates", []),
            "equity_curve": first_res.get("equity_curve", []),
            "total_return": first_res.get("total_return", 0),
            "final_value": first_res.get("final_value", 0)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def run_strategy_backtest(request: PredictionRequest):
    data = fetch_stock_data(request.ticker, period="2y") # Fetch more data
    df = data.copy()
    
    initial_capital = request.initial_capital
    commission = request.commission
    position = 0
    cash = initial_capital
    equity_curve = []
    dates = []
    
    # Calculate indicators if not present (data_service usually adds them, but let's be sure)
    # Assuming data_service adds SMA_20, SMA_50, RSI, MACD, Signal_Line
    
    # Strategy Logic
    signals = pd.Series(0, index=df.index)
    
    if request.strategy == "SMA_Crossover":
        # Buy when SMA 20 > SMA 50
        signals[df['SMA_20'] > df['SMA_50']] = 1
        signals[df['SMA_20'] <= df['SMA_50']] = 0
        
    elif request.strategy == "RSI_Strategy":
        # Buy RSI < 30, Sell RSI > 70
        curr_sig = 0
        for i in range(len(df)):
            if df['RSI'].iloc[i] < 30:
                curr_sig = 1
            elif df['RSI'].iloc[i] > 70:
                curr_sig = 0
            signals.iloc[i] = curr_sig
            
    elif request.strategy == "Macd_Strategy":
        # Buy MACD > Signal
        signals[df['MACD'] > df['Signal_Line']] = 1
        signals[df['MACD'] <= df['Signal_Line']] = 0
        
    # Backtest Loop
    # Shift signals by 1 to enter on NEXT open
    signals = signals.shift(1).fillna(0)
    
    last_sig = 0
    for i in range(len(df)):
        price = df['Close'].iloc[i]
        date = df['Date'].iloc[i].isoformat()
        dates.append(date)
        
        sig = signals.iloc[i]
        
        # Calculate Equity
        if sig == 1: # Hold
             if position == 0:
                 # Buy
                 # Apply commission on Buy
                 cost = cash * commission
                 cash_after_comm = cash - cost
                 position = cash_after_comm / price
                 cash = 0
        elif sig == 0: # Sell/Neutral
             if position > 0:
                 # Sell
                 sale_value = position * price
                 # Apply commission on Sell
                 cost = sale_value * commission
                 cash = sale_value - cost
                 position = 0
                 
        current_equity = cash + (position * price)
        equity_curve.append(current_equity)
        
    # Metrics
    final_value = equity_curve[-1]
    total_return = ((final_value - initial_capital) / initial_capital) * 100
    
    # Max Drawdown
    equity_series = pd.Series(equity_curve)
    rolling_max = equity_series.cummax()
    drawdown = (equity_series - rolling_max) / rolling_max
    max_drawdown = drawdown.min() * 100
    
    # Sharpe
    returns = pd.Series(equity_curve).pct_change().dropna()
    if returns.std() > 0:
        sharpe = (returns.mean() / returns.std()) * np.sqrt(252)
    else:
        sharpe = 0
        
    return {
        "ticker": request.ticker,
        "strategy": request.strategy,
        "total_return": total_return,
        "final_value": final_value,
        "sharpe_ratio": sharpe,
        "max_drawdown": max_drawdown,
        "dates": dates,
        "equity_curve": equity_curve
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
