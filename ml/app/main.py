from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .predictor import hybrid_predict
from .utils.sentiment import compute_sentiment, analyze_text_sentiment
from .utils.shap_explanation import generate_shap_explanation
import yfinance as yf
import logging

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
