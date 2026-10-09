from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .predictor import hybrid_predict
from .utils.sentiment import compute_sentiment, analyze_text_sentiment
from .utils.shap_explanation import generate_shap_explanation
import yfinance as yf
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Hybrid Stock Forecasting API",
    description="API for hybrid stock price forecasting using ARIMA, LSTM, and XGBoost models.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/ml/sentiment")
async def analyze_sentiment(
    text: str,
    symbol: str,
):
    try:
        if not text or not text.strip():
            raise ValueError("Text is required")

        if not symbol or not symbol.strip():
            raise ValueError("Symbol is required")

        result = analyze_text_sentiment(
            text.strip(),
            symbol.strip().upper()
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Sentiment analysis failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Sentiment analysis failed: {str(e)}"
        )

@app.get("/ml/current-price")
async def current_price(symbol: str):
    try:
        if not symbol or not symbol.strip():
            raise ValueError("Symbol is required")

        clean_symbol = symbol.strip().upper()

        ticker = yf.Ticker(f"{clean_symbol}.NS")
        price = ticker.fast_info.get("lastPrice")

        if price is None:
            raise ValueError(
                f"Could not retrieve current price for {clean_symbol}"
            )

        return {
            "symbol": clean_symbol,
            "price": round(float(price), 2)
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Failed to retrieve current price for {symbol}: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve current price: {str(e)}"
        )

@app.get("/ml/market-data")
def market_data(symbol: str):
    try:
        if not symbol or not symbol.strip():
            raise ValueError("Symbol is required")

        clean_symbol = symbol.strip().upper()

        ticker = yf.Ticker(f"{clean_symbol}.NS")

        history = ticker.history(
            period="3mo",
            interval="1d",
            auto_adjust=False
        )

        if history.empty or len(history) < 50:
            raise ValueError(
                f"Insufficient market data for {clean_symbol}"
            )

        close_prices = history["Close"].dropna()
        volumes = history["Volume"].dropna()

        fast_info = ticker.fast_info

        current_price = fast_info.get("lastPrice")
        previous_close = fast_info.get("previousClose")

        if current_price is None:
            current_price = float(close_prices.iloc[-1])

        if previous_close is None:
            previous_close = float(close_prices.iloc[-2])

        current_price = float(current_price)
        previous_close = float(previous_close)

        latest_row = history.iloc[-1]

        day_high = fast_info.get("dayHigh")
        day_low = fast_info.get("dayLow")
        current_volume = fast_info.get("lastVolume")

        if day_high is None:
            day_high = float(latest_row["High"])

        if day_low is None:
            day_low = float(latest_row["Low"])

        if current_volume is None:
            current_volume = float(latest_row["Volume"])

        ma_20 = float(close_prices.rolling(20).mean().iloc[-1])
        ma_50 = float(close_prices.rolling(50).mean().iloc[-1])

        volume_20_avg = float(
            volumes.shift(1).rolling(20).mean().iloc[-1]
        )

        delta = close_prices.diff()

        gains = delta.clip(lower=0)
        losses = -delta.clip(upper=0)

        average_gain = gains.rolling(14).mean()
        average_loss = losses.rolling(14).mean()

        rs = average_gain / average_loss.replace(0, pd.NA)

        rsi = 100 - (100 / (1 + rs))
        rsi_value = float(rsi.iloc[-1])

        change = current_price - previous_close
        change_percent = (
            (change / previous_close) * 100
            if previous_close
            else 0
        )

        signal_score = 0

        if current_price > previous_close:
            signal_score += 1
        elif current_price < previous_close:
            signal_score -= 1

        if current_price > ma_20:
            signal_score += 1
        elif current_price < ma_20:
            signal_score -= 1

        if current_price > ma_50:
            signal_score += 1
        elif current_price < ma_50:
            signal_score -= 1

        if rsi_value >= 55:
            signal_score += 1
        elif rsi_value <= 45:
            signal_score -= 1

        if signal_score >= 2:
            signal = "BULLISH"
        elif signal_score <= -2:
            signal = "BEARISH"
        else:
            signal = "NEUTRAL"

        return {
            "symbol": clean_symbol,
            "current_price": round(current_price, 2),
            "previous_close": round(previous_close, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "day_high": round(float(day_high), 2),
            "day_low": round(float(day_low), 2),
            "volume": round(float(current_volume), 0),
            "average_volume_20d": round(volume_20_avg, 0),
            "ma_20": round(ma_20, 2),
            "ma_50": round(ma_50, 2),
            "rsi_14": round(rsi_value, 2),
            "signal": signal
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Failed to retrieve market data for {symbol}: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve market data: {str(e)}"
        )

@app.post("/ml/predict")
async def predict(symbol: str, horizon: int = 30):
    logger.info(
        f"Processing prediction request for symbol: {symbol}, horizon: {horizon}"
    )

    try:
        if not symbol or not symbol.strip():
            raise ValueError("Symbol is required")

        if horizon < 1 or horizon > 90:
            raise ValueError("Horizon must be between 1 and 90 days")

        clean_symbol = symbol.strip().upper()

        sentiment = compute_sentiment(clean_symbol)

        result = hybrid_predict(
            clean_symbol,
            horizon,
            sentiment["score"]
        )

        result["sentiment"] = sentiment

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Prediction failed for {symbol}: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

class ShapExplanationRequest(BaseModel):
    symbol: str
    features: dict
    shap_values: list

@app.post("/ml/shap-explanation")
async def shap_explanation(request: ShapExplanationRequest):
    try:
        if not request.symbol.strip():
            raise ValueError("Symbol is required")

        if not request.features:
            raise ValueError("Features are required")

        if not request.shap_values:
            raise ValueError("SHAP values are required")

        result = generate_shap_explanation(
            request.symbol.strip().upper(),
            request.features,
            request.shap_values
        )

        return {
            "shap_explanation": result
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(
            f"SHAP explanation failed for {request.symbol}: {str(e)}"
        )
        raise HTTPException(
            status_code=500,
            detail=f"SHAP explanation failed: {str(e)}"
        )

@app.get("/")
def root():
    return {
        "message": "Welcome to the Hybrid Stock Forecasting API.",
        "docs": "/docs"
    }
