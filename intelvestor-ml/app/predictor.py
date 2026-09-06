import pandas as pd
import numpy as np
import tensorflow as tf
from pandas.tseries.offsets import BDay

np.random.seed(42)
tf.random.set_seed(42)

# from datetime import datetime, timedelta
from statsmodels.tsa.arima.model import ARIMA
# from prophet import Prophet
# from xgboost import XGBRegressor
from keras.models import Sequential
from keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
# import shap
# from langchain_google_genai import ChatGoogleGenerativeAI
from .utils.data_loader import fetch_historical
# from .utils.features import build_features

def hybrid_predict(symbol: str, horizon: int):
    """
    Generate ARIMA, LSTM, and ensemble forecasts for a stock.
    """

    df = fetch_historical(symbol)

    # Use closing prices for the time-series models
    prices = df[['Date', 'Close']].copy()
    prices = prices.dropna().reset_index(drop=True)

        # Prepare LSTM data using a chronological split
    close_values = prices['Close'].values.reshape(-1, 1)

        # Chronological train / validation / test split
    train_end = int(len(close_values) * 0.70)
    validation_end = int(len(close_values) * 0.85)

    train_close = close_values[:train_end]
    validation_close = close_values[train_end:validation_end]
    test_close = close_values[validation_end:]

    scaler = MinMaxScaler()
    train_scaled = scaler.fit_transform(train_close)
    validation_scaled = scaler.transform(validation_close)
    test_scaled = scaler.transform(test_close)

        # Create training sequences
    X_train, y_train = create_sequences(
        train_scaled.flatten(),
        lookback=60
    )

        # Use preceding observations as context for validation
    validation_input = np.concatenate([
        train_scaled[-60:].flatten(),
        validation_scaled.flatten()
    ])

    X_validation, y_validation = create_sequences(
        validation_input,
        lookback=60
    )

    # Use preceding observations as context for test
    test_input = np.concatenate([
        validation_scaled[-60:].flatten(),
        test_scaled.flatten()
    ])

    X_test, y_test = create_sequences(
        test_input,
        lookback=60
    )

    X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
    X_validation = X_validation.reshape(
        (X_validation.shape[0], X_validation.shape[1], 1)
    )
    X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], 1))

    print('LSTM train shape:', X_train.shape)
    print('LSTM validation shape:', X_validation.shape)
    print('LSTM test shape:', X_test.shape)

        # LSTM model
    lstm_model = Sequential([
        LSTM(50, input_shape=(X_train.shape[1], 1)),
        Dense(1)
    ])

    lstm_model.compile(optimizer='adam', loss='mse')

    lstm_model.fit(
        X_train,
        y_train,
        epochs=20,
        batch_size=32,
        verbose=0
    )

    print('Initial LSTM training complete')

    # Fit a new scaler using training + validation data
    final_scaler = MinMaxScaler()

    train_validation = prices['Close'].iloc[:validation_end].values.reshape(-1, 1)

    train_validation_scaled = final_scaler.fit_transform(
        train_validation
    ).flatten()

    X_train_final, y_train_final = create_sequences(
        train_validation_scaled,
        lookback=60
    )

    X_train_final = X_train_final.reshape(
        (X_train_final.shape[0], X_train_final.shape[1], 1)
    )

    lstm_final_model = Sequential([
        LSTM(50, input_shape=(X_train_final.shape[1], 1)),
        Dense(1)
    ])

    lstm_final_model.compile(
        optimizer='adam',
        loss='mse'
    )

    lstm_final_model.fit(
        X_train_final,
        y_train_final,
        epochs=20,
        batch_size=32,
        verbose=0
    )

    print('Final LSTM training complete')

    # Predict the LSTM validation set
    lstm_validation_scaled = lstm_model.predict(X_validation, verbose=0)

    # Predict the LSTM test set
    lstm_test_scaled = lstm_final_model.predict(X_test, verbose=0)

    # Convert validation predictions back to original price scale
    lstm_validation_pred = scaler.inverse_transform(
        lstm_validation_scaled
    ).flatten()

    lstm_validation_actual = scaler.inverse_transform(
        y_validation.reshape(-1, 1)
    ).flatten()

    # Convert test predictions back to original price scale
    lstm_test_pred = scaler.inverse_transform(
        lstm_test_scaled
    ).flatten()

    lstm_test_actual = scaler.inverse_transform(
        y_test.reshape(-1, 1)
    ).flatten()

    print('First LSTM validation prediction:', lstm_validation_pred[0])
    print('First LSTM test prediction:', lstm_test_pred[0])

        # Evaluate LSTM on the test set
    lstm_mae = np.mean(np.abs(lstm_test_actual - lstm_test_pred))
    lstm_rmse = np.sqrt(np.mean((lstm_test_actual - lstm_test_pred) ** 2))
    lstm_mape = np.mean(
        np.abs((lstm_test_actual - lstm_test_pred) / lstm_test_actual)
    ) * 100

    print('LSTM MAE:', round(lstm_mae, 2))
    print('LSTM RMSE:', round(lstm_rmse, 2))
    print('LSTM MAPE:', round(lstm_mape, 2))

    # ARIMA uses the same chronological train / validation / test split
    train = prices['Close'].iloc[:train_end]
    validation = prices['Close'].iloc[train_end:validation_end]
    test = prices['Close'].iloc[validation_end:]

    # ARIMA model trained on the training set
    arima_model = ARIMA(train, order=(5, 1, 0))
    arima_model = arima_model.fit()

    # Forecast the validation period
    arima_validation_pred = arima_model.forecast(
        steps=len(validation)
    )

    # Retrain ARIMA using training + validation data
    arima_train_final = pd.concat([train, validation])

    arima_final_model = ARIMA(
        arima_train_final,
        order=(5, 1, 0)
    )

    arima_final_model = arima_final_model.fit()

    # Forecast the unseen test period
    arima_pred = arima_final_model.forecast(
        steps=len(test)
    )

        # Evaluate ARIMA on the test set
    mae = np.mean(np.abs(test.values - arima_pred.values))
    rmse = np.sqrt(np.mean((test.values - arima_pred.values) ** 2))
    mape = np.mean(np.abs((test.values - arima_pred.values) / test.values)) * 100

    print('ARIMA MAE:', round(mae, 2))
    print('ARIMA RMSE:', round(rmse, 2))
    print('ARIMA MAPE:', round(mape, 2))

    # Find the best ensemble weight using validation MAPE
    best_mape = float('inf')
    best_lstm_weight = 0.0

    for lstm_weight in np.arange(0.0, 1.01, 0.05):
        arima_weight = 1.0 - lstm_weight

        candidate_pred = (
            arima_weight * arima_validation_pred.values
            + lstm_weight * lstm_validation_pred
        )

        candidate_mape = np.mean(
            np.abs(
                (validation.values - candidate_pred) / validation.values
            )
        ) * 100

        if candidate_mape < best_mape:
            best_mape = candidate_mape
            best_lstm_weight = lstm_weight

    lstm_weight = best_lstm_weight
    arima_weight = 1.0 - lstm_weight

    print('ARIMA weight:', round(arima_weight, 2))
    print('LSTM weight:', round(lstm_weight, 2))
    print('Best validation MAPE:', round(best_mape, 2))

    # Apply the validation-selected weights to the test predictions
    ensemble_pred = (
        arima_weight * arima_pred.values
        + lstm_weight * lstm_test_pred
    )

    print('First ensemble prediction:', ensemble_pred[0])

        # Evaluate ensemble on the test set
    ensemble_mae = np.mean(
        np.abs(test.values - ensemble_pred)
    )

    ensemble_rmse = np.sqrt(
        np.mean((test.values - ensemble_pred) ** 2)
    )

    ensemble_mape = np.mean(
        np.abs((test.values - ensemble_pred) / test.values)
    ) * 100

    print('Ensemble MAE:', round(ensemble_mae, 2))
    print('Ensemble RMSE:', round(ensemble_rmse, 2))
    print('Ensemble MAPE:', round(ensemble_mape, 2))

    print('Train rows:', len(train))
    print('Validation rows:', len(validation))
    print('Test rows:', len(test))
    print('First ARIMA prediction:', arima_pred.iloc[0])

    # Retrain ARIMA on all available historical data for future forecasting
    forecast_arima_model = ARIMA(
        prices['Close'],
        order=(5, 1, 0)
    )

    forecast_arima_model = forecast_arima_model.fit()

    # Generate future ARIMA forecast
    future_arima_pred = forecast_arima_model.forecast(
        steps=horizon
    )



    # Retrain LSTM on all available historical data for future forecasting
    forecast_scaler = MinMaxScaler()

    all_close = prices['Close'].values.reshape(-1, 1)

    all_scaled = forecast_scaler.fit_transform(
        all_close
    ).flatten()

    X_forecast, y_forecast = create_sequences(
        all_scaled,
        lookback=60
    )

    X_forecast = X_forecast.reshape(
        (X_forecast.shape[0], X_forecast.shape[1], 1)
    )

    forecast_lstm_model = Sequential([
        LSTM(50, input_shape=(X_forecast.shape[1], 1)),
        Dense(1)
    ])

    forecast_lstm_model.compile(
        optimizer='adam',
        loss='mse'
    )

    forecast_lstm_model.fit(
        X_forecast,
        y_forecast,
        epochs=20,
        batch_size=32,
        verbose=0
    )

    print('Forecast LSTM training complete')

    # Generate future LSTM forecast using the model trained on all data
    lstm_input = forecast_scaler.transform(
        prices['Close'].values[-60:].reshape(-1, 1)
    ).flatten()

    future_lstm_scaled = []

    for _ in range(horizon):
        lstm_sequence = np.array(
            lstm_input[-60:]
        ).reshape(1, 60, 1)

        next_prediction = forecast_lstm_model.predict(
            lstm_sequence,
            verbose=0
        )[0, 0]

        future_lstm_scaled.append(next_prediction)
        lstm_input = np.append(lstm_input, next_prediction)

    future_lstm_pred = forecast_scaler.inverse_transform(
        np.array(future_lstm_scaled).reshape(-1, 1)
    ).flatten()

    print('Future LSTM forecast:')
    print(future_lstm_pred)

    print('Future ARIMA forecast:')
    print(future_arima_pred)

    # Generate future ensemble forecast
    future_ensemble_pred = (
        arima_weight * future_arima_pred.values
        + lstm_weight * future_lstm_pred
    )

    # Generate dates for the forecast horizon
    last_date = pd.to_datetime(prices['Date'].iloc[-1])

    future_dates = [
        last_date + BDay(i)
        for i in range(1, horizon + 1)
    ]

    print('Future ensemble forecast:')
    print(future_ensemble_pred)

    return {
        'symbol': symbol,
        'horizon': horizon,
        'last_price': float(prices['Close'].iloc[-1]),
        'arima_weight': float(arima_weight),
        'lstm_weight': float(lstm_weight),
        'forecast': [
            {
                'date': future_dates[i].strftime('%Y-%m-%d'),
                'arima': float(future_arima_pred.iloc[i]),
                'lstm': float(future_lstm_pred[i]),
                'ensemble': float(future_ensemble_pred[i])
            }
            for i in range(horizon)
        ],
        'metrics': {
            'arima': {
                'mae': float(mae),
                'rmse': float(rmse),
                'mape': float(mape)
            },
            'lstm': {
                'mae': float(lstm_mae),
                'rmse': float(lstm_rmse),
                'mape': float(lstm_mape)
            },
            'ensemble': {
                'mae': float(ensemble_mae),
                'rmse': float(ensemble_rmse),
                'mape': float(ensemble_mape)
            }
        }
    }

def create_sequences(data, lookback=60):
    X = []
    y = []

    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i])
        y.append(data[i])

    return np.array(X), np.array(y)