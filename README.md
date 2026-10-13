# Hybrid Stock Forecasting

A full-stack stock forecasting application that combines statistical time-series modeling, deep learning, gradient boosting, financial-news sentiment analysis, and explainable AI to analyze Indian equities.

## Overview

Hybrid Stock Forecasting explores how multiple forecasting models can be combined to generate stock-price predictions and how financial news and feature attribution can provide additional context.

The application supports Indian equities listed on the NSE and uses historical market data to generate multi-day forecasts, compare model performance, analyze financial-news sentiment, and explain XGBoost predictions.

### Key Features

- **Hybrid forecasting:** Combines ARIMA, LSTM, and XGBoost through an XGBoost stacking meta-model.
- **Chronological evaluation:** Uses chronological data splits and expanding-window walk-forward validation.
- **Financial-news sentiment:** Analyzes financial news using a Hugging Face sentiment model and recency-weighted aggregation.
- **Forecast sentiment adjustment:** Applies a decaying sentiment adjustment across the forecast horizon.
- **Explainable AI:** Uses SHAP to explain feature contributions to XGBoost predictions.
- **Interactive dashboard:** Visualizes forecasts, historical market data, model metrics, and technical indicators.
- **Watchlist:** Tracks selected stocks and displays relevant market information.
- **Forecast history:** Allows users to revisit saved forecast records.
- **Sentiment simulation:** Evaluates manually entered news text and demonstrates its potential influence on a simulated stock-price graph.
- **Authentication:** Uses Clerk for user authentication.
- **Caching:** Uses in-memory caching to reduce repeated forecast computation and improve response times.

## System Architecture

```text
                 React + TypeScript
                    Frontend
                       |
                       v
              Spring Boot Backend
               /             \
              v               v
       MongoDB Atlas       FastAPI ML Service
       Application Data           |
                                  v
                         Historical Market Data
                              (yfinance)
                                  |
                   +--------------+--------------+
                   |              |              |
                   v              v              v
                 ARIMA           LSTM          XGBoost
                   |              |              |
                   +--------------+--------------+
                                  |
                                  v
                       Out-of-Sample Predictions
                                  |
                                  v
                      XGBoost Stacking Meta-Model
                                  |
                                  v
                         Hybrid Forecast
                                  |
                     +------------+------------+
                     |                         |
                     v                         v
              Sentiment Adjustment       SHAP Explanations
                     |                         |
                     +------------+------------+
                                  |
                                  v
                     Forecasts, Metrics and Insights
```

The sentiment-analysis and manual-news simulation workflows provide complementary functionality. The manual-news simulation is separate from the main forecasting pipeline.

## Forecasting Models

### 1. ARIMA

ARIMA (AutoRegressive Integrated Moving Average) is a statistical time-series model used to forecast future closing prices from historical price patterns.

It provides a statistical baseline for comparison with the machine-learning models.

### 2. LSTM

Long Short-Term Memory (LSTM) is a recurrent neural network designed to learn temporal dependencies in sequential data.

The implementation uses a 60-trading-day lookback window of historical closing prices to learn patterns and generate forecasts.

### 3. XGBoost

XGBoost is a gradient-boosted decision-tree model trained on historical market data and engineered technical indicators.

The feature set includes:

- Open, High, Low and Close prices
- Trading volume
- Simple Moving Averages (SMA-20 and SMA-50)
- Relative Strength Index (RSI-14)
- Moving Average Convergence Divergence (MACD)
- Bollinger Band upper and lower values
- Volume moving average

The model predicts the next day's closing price using the available market features.

### 4. XGBoost Stacking Meta-Model

Instead of combining model predictions using manually selected or fixed validation-based weights, the application uses stacking.

The base models — ARIMA, LSTM and XGBoost — generate predictions that serve as inputs to a second-level XGBoost regressor.

The meta-model learns how these predictions relate to actual closing prices.

The stacking workflow uses chronological out-of-sample base-model predictions to train the meta-model. The final held-out test set is kept separate from meta-model training.

This approach allows the ensemble to learn relationships between base-model predictions rather than relying on a predetermined weighting formula. It does not guarantee better performance than every individual model.

## Financial-News Sentiment Analysis

The main sentiment pipeline analyzes financial news associated with a selected company.

### Pipeline

1. Resolve the stock symbol to a company name.
2. Retrieve relevant news using Google News RSS.
3. Extract article headlines and available summaries.
4. Classify each article using a financial sentiment model from Hugging Face Transformers.
5. Convert positive, neutral and negative classifications into signed sentiment scores.
6. Weight article sentiment according to publication recency.
7. Aggregate the weighted scores into a normalized sentiment score.
8. Apply a sentiment adjustment that decays over the forecast horizon.

### Recency-weighted sentiment

Newer articles receive greater weight than older articles.

The article-level recency weight follows an exponential decay:

\[
w_i = e^{-t_i/3}
\]

where \(t_i\) is the article's age in days.

The aggregate sentiment score is computed as a weighted mean of the individual article sentiment scores.

The resulting score is used for a separate forecast adjustment that decreases with each forecast day. This is a post-processing adjustment, not a claim that sentiment is directly included as a trained feature in all three base forecasting models.

### Manual-news sentiment simulation

The application also provides a separate demonstration in which a user enters news text manually.

A Gemini-powered analysis evaluates the text's sentiment and relevance to the selected company. The effective sentiment signal influences a simulated stock-price graph.

This demonstration is distinct from the main financial-news retrieval and forecasting workflow.

## Explainable AI with SHAP

SHAP (SHapley Additive exPlanations) is integrated to explain feature contributions to XGBoost predictions.

The application uses SHAP's tree-based explanation capabilities to help interpret how market features and technical indicators contribute to an individual prediction.

These explanations describe model attribution, not causation, and do not automatically explain the internal behavior of ARIMA, LSTM or the complete stacking pipeline.

## Model Evaluation

The forecasting pipeline uses chronological training, validation and test splits to preserve time order and reduce temporal leakage.

Expanding-window walk-forward validation evaluates the base models across successive time periods.

### Evaluation Metrics

| Metric | Purpose |
|---|---|
| MAE | Measures average absolute prediction error. |
| RMSE | Penalizes larger prediction errors more heavily. |
| MAPE | Measures average absolute error relative to actual prices, expressed as a percentage. |

The application compares ARIMA, LSTM, XGBoost and the stacking ensemble using these metrics.

Model performance can vary across stocks and evaluation periods. Reported metrics should therefore be interpreted in the context of the particular dataset, test window and forecasting configuration.

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Chart.js
- Framer Motion
- Lucide React

### Backend and API

- Java
- Spring Boot
- Python
- FastAPI
- Uvicorn
- REST APIs

### Machine Learning and Data Processing

- Pandas
- NumPy
- Scikit-learn
- Statsmodels
- TensorFlow / Keras
- XGBoost
- SHAP
- yfinance

### Natural Language Processing

- Hugging Face Transformers
- DistilRoBERTa financial sentiment classification model
- Google News RSS
- feedparser
- Google Gemini API for the separate news-simulation and explanation workflows

### Database and Authentication

- MongoDB
- Clerk

### Deployment and Development

- AWS EC2 for the ML service
- Render for the frontend and Spring Boot backend
- Git and GitHub
- Linux systemd service management

## Project Structure

```text
hybrid-stock-forecasting/
├── ml/
│   ├── app/
│   │   ├── main.py
│   │   ├── predictor.py
│   │   └── utils/
│   │       ├── data_loader.py
│   │       ├── features.py
│   │       └── sentiment.py
│   └── requirements.txt
│
├── backend/
│   ├── src/
│   └── mvnw
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

Some internal directory names may be retained from earlier development iterations.

## Getting Started

### Prerequisites

- Python and pip
- Java and Maven-compatible tooling
- Node.js and npm
- A MongoDB connection string
- Clerk application credentials
- Google Gemini API key for Gemini-powered functionality
- Access to the required market-data and news sources

### 1. Start the ML Service

From the project root:

```bash
cd ml
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The ML API will be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 2. Start the Spring Boot Backend

Open a second terminal from the project root:

```bash
cd backend
set -a
source .env
set +a
./mvnw spring-boot:run
```

Configure the required environment variables in the appropriate environment files. Do not commit API keys, database credentials or other secrets to version control.

### 3. Start the Frontend

Open a third terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

Ensure that the backend, ML service, database connection and authentication configuration are available before testing the complete application.

## API Endpoints

The FastAPI service exposes the following primary endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check. |
| `/ml/current-price` | GET | Retrieves current-price information. |
| `/ml/market-data` | GET | Retrieves market data and related indicators. |
| `/ml/predict?symbol=RELIANCE&horizon=7` | POST | Generates a forecast for the requested stock and horizon. |
| `/ml/sentiment` | POST | Performs sentiment-related analysis. |
| `/ml/shap-explanation` | POST | Generates an XGBoost feature-attribution explanation. |

Request parameters and response schemas are defined by the API implementation and can be inspected through `/docs`.

## Deployment

The deployed application uses a three-layer architecture:

- **Frontend:** React application hosted on Render.
- **Backend:** Spring Boot application hosted on Render.
- **ML service:** FastAPI application running on AWS EC2 under a systemd service.

The Spring Boot backend communicates with the ML service through the configured `ML_SERVICE_URL`. MongoDB provides persistent application storage.

The ML service uses in-memory forecast caching with a five-minute time-to-live. Cache contents are not persistent across service restarts.

The EC2 service may require a manual code pull and service restart after updates unless an automated deployment workflow is configured. If the instance's public IP changes, the backend's ML service URL must be updated accordingly.

## Limitations

- Forecasts are estimates and are not guaranteed to predict future market prices accurately.
- Model performance varies across stocks and market conditions.
- Historical evaluation results do not guarantee future performance.
- Financial-news sentiment can be incomplete, delayed, ambiguous or incorrectly classified.
- The sentiment adjustment is a heuristic post-processing step and does not establish that sentiment improves forecasting accuracy.
- SHAP feature contributions are model explanations, not causal conclusions.
- Market data availability and trading-calendar handling may affect forecast dates and outputs.

## Disclaimer

This project is intended for educational and research purposes. It is not financial advice and should not be used as the sole basis for investment decisions.
