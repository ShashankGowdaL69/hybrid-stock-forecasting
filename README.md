# Hybrid Stock Forecasting

A machine learning framework for stock price forecasting using a hybrid ARIMA + LSTM approach on Indian stock market data.

## Project Overview

This project explores time-series forecasting by combining two different modeling approaches:

* **ARIMA** for statistical time-series forecasting
* **LSTM** for learning nonlinear temporal patterns
* **Hybrid ensemble** combining ARIMA and LSTM predictions

Historical market data is obtained using `yfinance`, with support for Indian equities listed on the NSE and BSE.

The current implementation focuses on the core forecasting pipeline. Sentiment analysis and explainable AI are planned as future extensions.

## Current Pipeline

```text
Stock Symbol
     ↓
Historical Market Data
     ↓
Data Preprocessing
     ↓
 ┌───────────────┬───────────────┐
 │     ARIMA     │     LSTM      │
 │ Statistical   │ Deep Learning │
 │ Forecast      │ Forecast      │
 └───────────────┴───────────────┘
          ↓
   Hybrid Ensemble
          ↓
 Forecast + Evaluation Metrics
```

## Models

### ARIMA

ARIMA models the historical closing-price series using autoregressive and differencing components.

### LSTM

A Long Short-Term Memory neural network is trained using rolling sequences of historical closing prices. The current implementation uses a 60-trading-day lookback window.

### Hybrid Ensemble

ARIMA and LSTM predictions are combined using a validation-based weighting strategy. The ensemble weight is selected using validation performance rather than being chosen arbitrarily.

## Evaluation

The forecasting pipeline evaluates the models using:

* Mean Absolute Error (MAE)
* Root Mean Squared Error (RMSE)
* Mean Absolute Percentage Error (MAPE)

The dataset is split chronologically into training, validation, and test sets to avoid random shuffling and future-data leakage.

## Technology Stack

### Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* Statsmodels
* TensorFlow / Keras
* yfinance

### API

* FastAPI
* Uvicorn

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Development

* Git / GitHub
* Docker

## Project Structure

```text
hybrid-stock-forecasting/
├── intelvestor-ml/
│   ├── app/
│   │   ├── main.py
│   │   ├── predictor.py
│   │   └── utils/
│   │       ├── data_loader.py
│   │       ├── features.py
│   │       └── sentiment.py
│   │
│   └── requirements.txt
│
├── intelvestor-backend/
│   └── src/
│
├── intelvestor-frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

> The legacy directory names are retained temporarily while the backend and deployment configuration are being refactored.

## Running the ML API

From the `intelvestor-ml` directory:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

## Forecast Endpoint

```text
POST /ml/predict
```

Example:

```text
/ml/predict?symbol=RELIANCE&horizon=7
```

The response contains:

* Forecast dates
* ARIMA predictions
* LSTM predictions
* Hybrid ensemble predictions
* Model evaluation metrics
* Selected ensemble weights

## Current Status

The core ARIMA + LSTM forecasting pipeline and FastAPI integration are implemented.

Planned future extensions include:

* Sentiment analysis from financial news
* Explainable AI using SHAP
* Additional forecasting models
* Improved market-calendar handling
* Enhanced visualization and comparison of forecasts
* Further model tuning and validation
