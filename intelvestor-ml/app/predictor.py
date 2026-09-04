import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from statsmodels.tsa.arima.model import ARIMA
from prophet import Prophet
from xgboost import XGBRegressor
from keras.models import Sequential
from keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
import shap
from langchain_google_genai import ChatGoogleGenerativeAI
from .utils.data_loader import fetch_historical
from .utils.features import build_features

def hybrid_predict(symbol: str, horizon: int, sentiment_score: float, google_api_key: str):
    """
    Generate hybrid predictions, SHAP, and Gemini explanation. Enhanced confidence: variance + sentiment adjustment.
    """
    # Load and feature data
    df = fetch_historical(symbol)
    df = build_features(df)
    
    features = ['Open', 'High', 'Low', 'Volume', 'sma_20', 'sma_50', 'rsi_14', 'macd', 'bb_upper', 'bb_lower', 'volume_sma_20']
    X = df[features]
    y = df['Close']
    
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    # ARIMA
    arima_model = ARIMA(y, order=(5,1,0)).fit()
    arima_pred = arima_model.forecast(steps=horizon)
    
    # Prophet
    prophet_df = df[['Date', 'Close']].rename(columns={'Date': 'ds', 'Close': 'y'})
    prophet_model = Prophet(daily_seasonality=True)
    prophet_model.fit(prophet_df)
    future_df = prophet_model.make_future_dataframe(periods=horizon)
    prophet_pred = prophet_model.predict(future_df)['yhat'][-horizon:]
    
    # XGBoost
    xgb_model = XGBRegressor(n_estimators=100, random_state=42)
    xgb_model.fit(X, y)  # Use unscaled for XGBoost (tree-based)
    
    # LSTM
    X_lstm = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))
    lstm_model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(1, X_scaled.shape[1])),
        LSTM(50),
        Dense(1)
    ])
    lstm_model.compile(optimizer='adam', loss='mse')
    lstm_model.fit(X_lstm, y, epochs=10, batch_size=32, verbose=0)
    
    # Future features (extrapolate with sentiment adjustment)
    last_features = df[features].iloc[-1].values
    future_features = np.tile(last_features, (horizon, 1))
    future_features[:, -1] += sentiment_score * 0.05  # Adjust volume MA as sentiment proxy (realistic tweak)
    future_scaled = scaler.transform(future_features)
    
    # Predictions
    xgb_pred = xgb_model.predict(future_features)
    future_lstm = future_scaled.reshape((horizon, 1, future_scaled.shape[1]))
    lstm_pred = lstm_model.predict(future_lstm).flatten()
    
    # Ensemble
    all_preds = np.vstack([arima_pred, prophet_pred, xgb_pred, lstm_pred])
    ensemble_preds = np.mean(all_preds, axis=0)
    variance = np.std(all_preds, axis=0)
    confs = 1 - (variance / ensemble_preds) + (sentiment_score * 0.1)  # Enhanced conf: variance + sentiment boost (-1 to 1 normalized)
    confs = np.clip(confs, 0, 1)  # Normalize 0-1
    
    last_date = df['Date'].iloc[-1]
    future_dates = [last_date + timedelta(days=i+1) for i in range(horizon)]
    predictions = [
        {"date": d.strftime('%Y-%m-%d'), "pred": round(float(p), 2), "conf": round(float(c), 2)}
        for d, p, c in zip(future_dates, ensemble_preds, confs)
    ]
    
    # SHAP on XGBoost
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(future_features[-1:])
    shap_dict = [{"feature": f, "value": round(float(v), 4)} for f, v in zip(features, shap_values[0])]
    
    # Gemini explanation (enhanced prompt for better output)
    try:
        if not google_api_key:
            explanation = f"Stock prediction for {symbol}: The model considers various technical indicators. Higher values indicate stronger positive impact on price prediction."
        else:
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=google_api_key)
            prompt = f"Explain these SHAP values for {symbol} stock prediction in simple English. Make it engaging and easy to understand, like talking to a beginner investor. SHAP values: {shap_dict}"
            response = llm.invoke(prompt)
            explanation = response.content
    except Exception as e:
        explanation = f"Stock prediction for {symbol}: The model analyzes technical indicators to predict future prices. Error generating detailed explanation: {str(e)}"
    
    return predictions, shap_dict, explanation