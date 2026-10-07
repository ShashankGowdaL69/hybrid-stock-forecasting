import pandas as pd
import numpy as np
import tensorflow as tf
from pandas.tseries.offsets import BDay
tf.keras.utils.set_random_seed(42)
from statsmodels.tsa.arima.model import ARIMA
from keras.models import Sequential
from keras.layers import LSTM, Dense

from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBRegressor
import shap
from .utils.data_loader import fetch_historical
from .utils.features import build_features
from .utils.sentiment import compute_sentiment

def hybrid_predict(symbol: str, horizon: int, sentiment_score: float = 0.0):
    """
    Generate ARIMA, LSTM, and ensemble forecasts for a stock.
    """

    df = fetch_historical(symbol)

    # Use closing prices for the time-series models
    prices = df[['Date', 'Close']].copy()
    prices = prices.dropna().reset_index(drop=True)

    # Build technical features for XGBoost
    feature_df = build_features(df)

    # Keep the latest feature row for future forecasting

    # XGBoost target: next day's closing price
    feature_df['target'] = feature_df['Close'].shift(-1)

    # Remove the final row because it has no next-day target
    feature_df = feature_df.dropna().reset_index(drop=True)

    # Align price data with the feature data
    prices = prices[
        prices['Date'].isin(feature_df['Date'])
    ].reset_index(drop=True)

    # Features used by XGBoost
    feature_columns = [
        'Open',
        'High',
        'Low',
        'Close',
        'Volume',
        'sma_20',
        'sma_50',
        'rsi_14',
        'macd',
        'bb_upper',
        'bb_lower',
        'volume_sma_20'
    ]

    X_xgb = feature_df[feature_columns]
    y_xgb = feature_df['target']

    # Chronological train / validation / test split for XGBoost
    # XGBoost predicts the NEXT day's Close, so feature rows
    # must be shifted back by one position to align with
    # the common price-based train / validation / test periods.

    xgb_train_end = int(len(prices) * 0.70)
    xgb_validation_end = int(len(prices) * 0.85)

    xgb_test_size = len(prices) - xgb_validation_end

    X_xgb_train = X_xgb.iloc[:xgb_train_end - 1]

    X_xgb_validation = X_xgb.iloc[
        xgb_train_end - 1:xgb_validation_end - 1
    ]

    X_xgb_test = X_xgb.iloc[
        xgb_validation_end - 1:
        xgb_validation_end - 1 + xgb_test_size
    ]

    y_xgb_train = y_xgb.iloc[:xgb_train_end - 1]

    y_xgb_validation = y_xgb.iloc[
        xgb_train_end - 1:xgb_validation_end - 1
    ]

    y_xgb_test = y_xgb.iloc[
        xgb_validation_end - 1:
        xgb_validation_end - 1 + xgb_test_size
    ]

    # XGBoost regression model
    xgb_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='reg:squarederror',
        random_state=42
    )

    xgb_model.fit(
        X_xgb_train,
        y_xgb_train
    )

    print('XGBoost training complete')

    # Generate XGBoost validation and test predictions
    xgb_validation_pred = xgb_model.predict(
        X_xgb_validation
    )

    xgb_test_pred = xgb_model.predict(
        X_xgb_test
    )

    print('XGBoost validation prediction:', xgb_validation_pred[0])
    print('XGBoost test prediction:', xgb_test_pred[0])

    # Evaluate XGBoost on the test set
    xgb_mae = np.mean(
        np.abs(y_xgb_test.values - xgb_test_pred)
    )

    xgb_rmse = np.sqrt(
        np.mean((y_xgb_test.values - xgb_test_pred) ** 2)
    )

    xgb_mape = np.mean(
        np.abs(
            (y_xgb_test.values - xgb_test_pred)
            / y_xgb_test.values
        )
    ) * 100

    print('XGBoost MAE:', round(xgb_mae, 2))
    print('XGBoost RMSE:', round(xgb_rmse, 2))
    print('XGBoost MAPE:', round(xgb_mape, 2))

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



    # ---------------------------------------------------------
    # Expanding-window walk-forward stacking validation
    #
    # ARIMA, LSTM, and XGBoost generate out-of-sample
    # predictions across chronological validation folds.
    #
    # These predictions are used to train a second-level
    # XGBoost meta-model.
    # ---------------------------------------------------------

    n_folds = 3
    validation_size = 60

    fold_predictions = []
    walk_forward_actuals = []
    fold_reference_prices_list = []

    validation_range = validation_end - train_end

    if validation_range < validation_size:
        validation_size = validation_range

    fold_step = (
        validation_range - validation_size
    ) // max(n_folds - 1, 1)

    for fold in range(n_folds):

        fold_train_end = (
            train_end
            + fold * fold_step
        )

        fold_validation_end = (
            fold_train_end
            + validation_size
        )

        if fold_validation_end > validation_end:
            break

        # Expanding-window training:
        # every fold keeps all historical observations
        # from the beginning of the dataset.
        fold_train = prices['Close'].iloc[
            :fold_train_end
        ]

        fold_validation = prices['Close'].iloc[
            fold_train_end:fold_validation_end
        ]

        print(
            f'\nWalk-forward fold {fold + 1}: '
            f'train={len(fold_train)}, '
            f'validation={len(fold_validation)}'
        )

        # =====================================================
        # ARIMA
        # =====================================================

        fold_arima_model = ARIMA(
            fold_train,
            order=(5, 1, 0)
        )

        fold_arima_model = fold_arima_model.fit()

        fold_arima_pred = fold_arima_model.forecast(
            steps=len(fold_validation)
        )

        # =====================================================
        # LSTM
        # =====================================================

        fold_scaler = MinMaxScaler()

        fold_train_values = fold_train.values.reshape(-1, 1)

        fold_train_scaled = fold_scaler.fit_transform(
            fold_train_values
        ).flatten()

        fold_X_train, fold_y_train = create_sequences(
            fold_train_scaled,
            lookback=60
        )

        fold_X_train = fold_X_train.reshape(
            (
                fold_X_train.shape[0],
                fold_X_train.shape[1],
                1
            )
        )

        fold_lstm_model = Sequential([
            LSTM(
                50,
                input_shape=(
                    fold_X_train.shape[1],
                    1
                )
            ),
            Dense(1)
        ])

        fold_lstm_model.compile(
            optimizer='adam',
            loss='mse'
        )

        fold_lstm_model.fit(
            fold_X_train,
            fold_y_train,
            epochs=20,
            batch_size=32,
            verbose=0
        )

        # Recursively forecast the entire validation period.
        fold_lstm_input = fold_train_scaled[-60:].copy()

        fold_lstm_pred_scaled = []

        for _ in range(len(fold_validation)):

            fold_sequence = np.array(
                fold_lstm_input[-60:]
            ).reshape(1, 60, 1)

            fold_prediction = fold_lstm_model.predict(
                fold_sequence,
                verbose=0
            )[0, 0]

            fold_lstm_pred_scaled.append(
                fold_prediction
            )

            fold_lstm_input = np.append(
                fold_lstm_input,
                fold_prediction
            )

        fold_lstm_pred = fold_scaler.inverse_transform(
            np.array(
                fold_lstm_pred_scaled
            ).reshape(-1, 1)
        ).flatten()

        print(
            f'Fold {fold + 1} LSTM recursive range: '
            f'{fold_lstm_pred[0]:.2f} -> {fold_lstm_pred[-1]:.2f}'
        )

        # =====================================================
        # XGBoost
        # =====================================================

        # XGBoost predicts the NEXT day's Close.
        # The final feature row of the training period predicts
        # the first validation day and must NOT be used as a
        # training row.

        fold_xgb_train = feature_df.iloc[
            :fold_train_end - 1
        ].copy()

        fold_xgb_model = XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective='reg:squarederror',
            random_state=42
        )

        fold_xgb_model.fit(
            fold_xgb_train[feature_columns],
            fold_xgb_train['target']
        )

        # Start XGBoost from the last data available before
        # the validation period.
        fold_cutoff_date = pd.to_datetime(
            prices['Date'].iloc[fold_train_end - 1]
        )

        xgb_history = df[
            pd.to_datetime(df['Date']) <= fold_cutoff_date
        ].copy()

        fold_xgb_pred = []

        validation_dates = prices['Date'].iloc[
            fold_train_end:fold_validation_end
        ].reset_index(drop=True)

        # Recursively forecast XGBoost validation period.
        # Actual validation OHLCV values are NEVER used.
        for step in range(len(fold_validation)):

            current_features = build_features(
                xgb_history
            )

            latest_features = current_features.iloc[[-1]]

            next_prediction = fold_xgb_model.predict(
                latest_features[feature_columns]
            )[0]

            fold_xgb_pred.append(
                next_prediction
            )

            # Create a synthetic next-day row using only
            # information available from the previous step.
            last_row = xgb_history.iloc[-1].copy()

            next_row = last_row.copy()

            next_row['Date'] = validation_dates.iloc[step]

            next_row['Open'] = last_row['Close']

            next_row['High'] = max(
                last_row['Close'],
                next_prediction
            )

            next_row['Low'] = min(
                last_row['Close'],
                next_prediction
            )

            next_row['Close'] = next_prediction

            # Carry the last known volume forward.
            next_row['Volume'] = last_row['Volume']

            xgb_history = pd.concat(
                [
                    xgb_history,
                    pd.DataFrame([next_row])
                ],
                ignore_index=True
            )

        fold_xgb_pred = np.array(
            fold_xgb_pred
        )

        # =====================================================
        # Store out-of-fold predictions
        # =====================================================

        minimum_length = min(
            len(fold_validation),
            len(fold_arima_pred),
            len(fold_lstm_pred),
            len(fold_xgb_pred)
        )

        fold_prediction_matrix = (
            np.column_stack([
                np.asarray(
                    fold_arima_pred
                )[:minimum_length],

                fold_lstm_pred[
                    :minimum_length
                ],

                fold_xgb_pred[
                    :minimum_length
                ]
            ])
        )

        fold_actuals = fold_validation.values[
            :minimum_length
        ]

        # Print individual model performance for this fold.
        fold_arima_mape = np.mean(
            np.abs(
                (
                    fold_actuals
                    - fold_prediction_matrix[:, 0]
                )
                / fold_actuals
            )
        ) * 100

        fold_lstm_mape = np.mean(
            np.abs(
                (
                    fold_actuals
                    - fold_prediction_matrix[:, 1]
                )
                / fold_actuals
            )
        ) * 100

        fold_xgb_mape = np.mean(
            np.abs(
                (
                    fold_actuals
                    - fold_prediction_matrix[:, 2]
                )
                / fold_actuals
            )
        ) * 100

        print(
            f'Fold {fold + 1} MAPE - '
            f'ARIMA: {fold_arima_mape:.2f}, '
            f'LSTM: {fold_lstm_mape:.2f}, '
            f'XGBoost: {fold_xgb_mape:.2f}'
        )

        fold_predictions.append(
            fold_prediction_matrix
        )

        walk_forward_actuals.append(
            fold_actuals
        )

        # Price immediately before each validation day.
        # This is known at prediction time and is therefore
        # safe to use for relative-price stacking.
        fold_reference_prices = prices['Close'].iloc[
            fold_train_end - 1:fold_validation_end - 1
        ].values

        fold_reference_prices = fold_reference_prices[
            :minimum_length
        ]

        fold_reference_prices = np.asarray(
            fold_reference_prices
        )

        if len(fold_reference_prices) != minimum_length:
            raise ValueError(
                'Walk-forward reference-price length '
                'does not match prediction length.'
            )

        fold_reference_prices_list.append(
            fold_reference_prices
        )

    # =========================================================
    # Combine all out-of-fold predictions
    # =========================================================

    walk_forward_predictions = np.vstack(
        fold_predictions
    )

    walk_forward_actuals = np.concatenate(
        walk_forward_actuals
    )

    # =========================================================
    # Base-model walk-forward diagnostics
    # =========================================================

    arima_walk_forward_mape = np.mean(
        np.abs(
            (
                walk_forward_actuals
                - walk_forward_predictions[:, 0]
            )
            / walk_forward_actuals
        )
    ) * 100

    lstm_walk_forward_mape = np.mean(
        np.abs(
            (
                walk_forward_actuals
                - walk_forward_predictions[:, 1]
            )
            / walk_forward_actuals
        )
    ) * 100

    xgb_walk_forward_mape = np.mean(
        np.abs(
            (
                walk_forward_actuals
                - walk_forward_predictions[:, 2]
            )
            / walk_forward_actuals
        )
    ) * 100

    print(
        '\nAverage walk-forward MAPE:'
    )
    print(
        'ARIMA:',
        round(arima_walk_forward_mape, 2)
    )
    print(
        'LSTM:',
        round(lstm_walk_forward_mape, 2)
    )
    print(
        'XGBoost:',
        round(xgb_walk_forward_mape, 2)
    )

    # =========================================================
    # Walk-forward error diagnostics
    # =========================================================

    actual_prices = walk_forward_actuals

    arima_errors_pct = (
        (
            walk_forward_predictions[:, 0]
            - actual_prices
        )
        / actual_prices
    )

    lstm_errors_pct = (
        (
            walk_forward_predictions[:, 1]
            - actual_prices
        )
        / actual_prices
    )

    xgb_errors_pct = (
        (
            walk_forward_predictions[:, 2]
            - actual_prices
        )
        / actual_prices
    )

    print('\nWalk-forward error diagnostics:')
    print(
        'ARIMA mean error %:',
        round(
            np.mean(arima_errors_pct) * 100,
            2
        )
    )
    print(
        'LSTM mean error %:',
        round(
            np.mean(lstm_errors_pct) * 100,
            2
        )
    )
    print(
        'XGBoost mean error %:',
        round(
            np.mean(xgb_errors_pct) * 100,
            2
        )
    )

    print(
        'ARIMA mean absolute error %:',
        round(
            np.mean(np.abs(arima_errors_pct)) * 100,
            2
        )
    )
    print(
        'LSTM mean absolute error %:',
        round(
            np.mean(np.abs(lstm_errors_pct)) * 100,
            2
        )
    )
    print(
        'XGBoost mean absolute error %:',
        round(
            np.mean(np.abs(xgb_errors_pct)) * 100,
            2
        )
    )


    # =========================================================
    # Prepare relative-price features for stacking
    #
    # The meta-model learns:
    #
    #   base prediction / previous known price
    #
    # instead of absolute prices.
    #
    # Target:
    #
    #   actual price / previous known price
    #
    # This makes the meta-model less sensitive to changes
    # in the absolute price level of the stock over time.
    # =========================================================

    # walk_forward_predictions and walk_forward_actuals
    # were already combined above for the diagnostics.
    # Only the reference prices still need to be combined.
    walk_forward_reference_prices = np.concatenate(
        fold_reference_prices_list
    )

    if len(walk_forward_predictions) != len(
        walk_forward_reference_prices
    ):
        raise ValueError(
            'Walk-forward prediction and reference-price '
            'lengths do not match.'
        )

    if len(walk_forward_actuals) != len(
        walk_forward_reference_prices
    ):
        raise ValueError(
            'Walk-forward actual and reference-price '
            'lengths do not match.'
        )

    walk_forward_reference_prices = np.maximum(
        walk_forward_reference_prices,
        1e-8
    )

    walk_forward_meta_features = (
        walk_forward_predictions
        / walk_forward_reference_prices.reshape(-1, 1)
    )

    walk_forward_meta_actuals = (
        walk_forward_actuals
        / walk_forward_reference_prices
    )

    print('\nRelative-price stacking training ranges:')
    print(
        'ARIMA ratio:',
        round(
            walk_forward_meta_features[:, 0].min(),
            4
        ),
        '->',
        round(
            walk_forward_meta_features[:, 0].max(),
            4
        )
    )
    print(
        'LSTM ratio:',
        round(
            walk_forward_meta_features[:, 1].min(),
            4
        ),
        '->',
        round(
            walk_forward_meta_features[:, 1].max(),
            4
        )
    )
    print(
        'XGBoost ratio:',
        round(
            walk_forward_meta_features[:, 2].min(),
            4
        ),
        '->',
        round(
            walk_forward_meta_features[:, 2].max(),
            4
        )
    )
    print(
        'Actual ratio:',
        round(
            walk_forward_meta_actuals.min(),
            4
        ),
        '->',
        round(
            walk_forward_meta_actuals.max(),
            4
        )
    )

    # =========================================================
    # Train stacking meta-model
    #
    # Inputs:
    #   Relative ARIMA prediction
    #   Relative LSTM prediction
    #   Relative XGBoost prediction
    #
    # Target:
    #   Relative actual closing price
    #
    # Every meta-model training row comes from a chronological
    # out-of-sample base-model prediction.
    # =========================================================

    meta_model = XGBRegressor(
        n_estimators=200,
        max_depth=2,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=1.0,
        objective='reg:squarederror',
        random_state=42
    )

    meta_model.fit(
        walk_forward_meta_features,
        walk_forward_meta_actuals
    )

    print(
        '\nStacking meta-model training complete'
    )

    # =========================================================
    # Retrain XGBoost on the complete development period
    # (original 70% train + 15% validation = 85%)
    #
    # This produces the proper XGBoost predictions for the
    # untouched final 15% test set.
    # =========================================================

    test_xgb_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='reg:squarederror',
        random_state=42
    )

    test_xgb_model.fit(
        X_xgb.iloc[:validation_end - 1],
        y_xgb.iloc[:validation_end - 1]
    )

    xgb_test_pred = test_xgb_model.predict(
        X_xgb_test
    )

    # Recalculate XGBoost test metrics using the model
    # trained on the complete 85% development period.
    xgb_mae = np.mean(
        np.abs(
            y_xgb_test.values
            - xgb_test_pred
        )
    )

    xgb_rmse = np.sqrt(
        np.mean(
            (
                y_xgb_test.values
                - xgb_test_pred
            ) ** 2
        )
    )

    xgb_mape = np.mean(
        np.abs(
            (
                y_xgb_test.values
                - xgb_test_pred
            )
            / y_xgb_test.values
        )
    ) * 100

    print(
        '\nFinal 85% development XGBoost test metrics:'
    )
    print(
        'XGBoost MAE:',
        round(xgb_mae, 2)
    )
    print(
        'XGBoost RMSE:',
        round(xgb_rmse, 2)
    )
    print(
        'XGBoost MAPE:',
        round(xgb_mape, 2)
    )

    # =========================================================
    # Generate base-model predictions for the untouched test
    # =========================================================

    test_meta_features_absolute = np.column_stack([
        np.asarray(
            arima_pred
        ),
        lstm_test_pred,
        xgb_test_pred
    ])

    # The previous day's actual closing price is known when
    # making each test-day prediction.
    test_reference_prices = prices['Close'].iloc[
        validation_end - 1:-1
    ].values

    test_reference_prices = np.asarray(
        test_reference_prices
    )

    if len(test_reference_prices) != len(
        test_meta_features_absolute
    ):
        raise ValueError(
            'Test reference-price length does not match '
            'test prediction length.'
        )

    test_reference_prices = np.maximum(
        test_reference_prices,
        1e-8
    )

    # Convert base predictions to relative-price features.
    test_meta_features = (
        test_meta_features_absolute
        / test_reference_prices.reshape(-1, 1)
    )

    # The meta-model predicts a relative price ratio.
    ensemble_test_ratio = meta_model.predict(
        test_meta_features
    )

    # Convert the predicted ratio back to the original
    # stock-price scale.
    ensemble_test_pred = (
        ensemble_test_ratio
        * test_reference_prices
    )

    print('\nFinal test relative meta-features:')

    print(
        'ARIMA ratio:',
        round(test_meta_features[:, 0].min(), 4),
        '->',
        round(test_meta_features[:, 0].max(), 4)
    )

    print(
        'LSTM ratio:',
        round(test_meta_features[:, 1].min(), 4),
        '->',
        round(test_meta_features[:, 1].max(), 4)
    )

    print(
        'XGBoost ratio:',
        round(test_meta_features[:, 2].min(), 4),
        '->',
        round(test_meta_features[:, 2].max(), 4)
    )

    print(
        'Actual price:',
        round(test.values.min(), 2),
        '->',
        round(test.values.max(), 2)
    )


    ensemble_actuals = test.values

    ensemble_mae = np.mean(
        np.abs(
            ensemble_actuals
            - ensemble_test_pred
        )
    )

    ensemble_rmse = np.sqrt(
        np.mean(
            (
                ensemble_actuals
                - ensemble_test_pred
            ) ** 2
        )
    )

    ensemble_mape = np.mean(
        np.abs(
            (
                ensemble_actuals
                - ensemble_test_pred
            )
            / ensemble_actuals
        )
    ) * 100

    print(
        '\nFinal stacking ensemble test metrics:'
    )
    print(
        'Ensemble MAE:',
        round(ensemble_mae, 2)
    )
    print(
        'Ensemble RMSE:',
        round(ensemble_rmse, 2)
    )
    print(
        'Ensemble MAPE:',
        round(ensemble_mape, 2)
    )


    print(
        '\nStacking meta-model test prediction:',
        ensemble_test_pred[0]
    )

    print('Train rows:', len(train))
    print('Validation rows:', len(validation))
    print('Test rows:', len(test))
    print('First ARIMA prediction:', arima_pred.iloc[0])

    # Retrain XGBoost on all available historical feature data
    forecast_xgb_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='reg:squarederror',
        random_state=42
    )

    forecast_xgb_model.fit(
        X_xgb,
        y_xgb
    )

    # SHAP explanation for the final XGBoost model
    explainer = shap.TreeExplainer(forecast_xgb_model)

    latest_xgb_features = X_xgb.iloc[[-1]]

    shap_values = explainer.shap_values(latest_xgb_features)

    shap_dict = [
        {
            "feature": feature,
            "value": round(float(value), 4)
        }
        for feature, value in zip(
            feature_columns,
            shap_values[0]
        )
    ]

    latest_feature_values = {
        feature: round(float(latest_xgb_features.iloc[0][feature]), 4)
        for feature in feature_columns
    }

    print('Forecast XGBoost training complete')

    # Generate future XGBoost forecast recursively
    xgb_history = df.dropna(
        subset=['Open', 'High', 'Low', 'Close', 'Volume']
    ).copy()
    future_xgb_pred = []

    for _ in range(horizon):
        current_features = build_features(xgb_history)

        latest_features = current_features.iloc[[-1]]

        next_prediction = forecast_xgb_model.predict(
            latest_features[feature_columns]
        )[0]

        future_xgb_pred.append(next_prediction)

        last_row = xgb_history.iloc[-1].copy()

        next_row = last_row.copy()

        last_close = float(last_row['Close'])

        next_row['Date'] = pd.to_datetime(last_row['Date']) + BDay(1)
        next_row['Open'] = last_close
        next_row['High'] = max(last_close, float(next_prediction))
        next_row['Low'] = min(last_close, float(next_prediction))
        next_row['Close'] = float(next_prediction)
        next_row['Volume'] = float(last_row['Volume'])

        xgb_history = pd.concat(
            [xgb_history, pd.DataFrame([next_row])],
            ignore_index=True
        )

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

    # Generate future ensemble forecast using the trained
    # stacking meta-model.
    future_meta_features_absolute = np.column_stack([
        np.asarray(
            future_arima_pred
        ),
        future_lstm_pred,
        np.array(future_xgb_pred)
    ])

    # For future forecasting, the latest observed closing
    # price is the known reference price.
    future_reference_price = float(
        prices['Close'].iloc[-1]
    )

    future_reference_price = max(
        future_reference_price,
        1e-8
    )

    # Convert future base predictions to relative-price features.
    future_meta_features = (
        future_meta_features_absolute
        / future_reference_price
    )


    # Meta-model predicts the future price relative to the
    # latest known closing price.
    future_ensemble_ratio = meta_model.predict(
        future_meta_features
    )

    # Convert relative prediction back to actual price.
    future_ensemble_pred = (
        future_ensemble_ratio
        * future_reference_price
    )

    print(
        'Future stacking ensemble forecast:'
    )
    print(future_ensemble_pred)

    # Apply current financial sentiment as a bounded overlay.
    #
    # The sentiment score is already normalized to [-1, +1],
    # so it is used directly rather than multiplying it by
    # recent market volatility.
    #
    # The effect decays exponentially across the forecast
    # horizon because recent news should have a stronger
    # near-term influence and gradually lose influence
    # further into the future.
    SENTIMENT_IMPACT = 0.03
    SENTIMENT_DECAY = 5.0

    forecast_days = np.arange(1, horizon + 1)

    sentiment_adjustments = (
        sentiment_score
        * SENTIMENT_IMPACT
        * np.exp(
            -forecast_days / SENTIMENT_DECAY
        )
    )

    print('Sentiment diagnostic:')
    print('  sentiment score:', sentiment_score)
    print('  sentiment impact:', SENTIMENT_IMPACT)
    print('  sentiment decay:', SENTIMENT_DECAY)
    print(
        '  day 1 adjustment %:',
        round(sentiment_adjustments[0] * 100, 4)
    )
    print(
        '  final day adjustment %:',
        round(sentiment_adjustments[-1] * 100, 4)
    )

    future_ensemble_pred = future_ensemble_pred * (
        1 + sentiment_adjustments
    )

    print('Sentiment score:', round(sentiment_score, 4))
    print(
        'Sentiment adjustment %:',
        np.round(
            sentiment_adjustments * 100,
            4
        )
    )

    # Generate dates for the forecast horizon
    last_date = pd.to_datetime(df['Date'].iloc[-1])

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
        'forecast': [
            {
                'date': future_dates[i].strftime('%Y-%m-%d'),
                'arima': float(future_arima_pred.iloc[i]),
                'lstm': float(future_lstm_pred[i]),
                'xgb': float(future_xgb_pred[i]),
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
            'xgb': {
                'mae': float(xgb_mae),
                'rmse': float(xgb_rmse),
                'mape': float(xgb_mape)
            },
            'ensemble': {
                'mae': float(ensemble_mae),
                'rmse': float(ensemble_rmse),
                'mape': float(ensemble_mape)
            }
        },
        "shap": shap_dict,
        "shap_features": latest_feature_values,
    }

def create_sequences(data, lookback=60):
    X = []
    y = []

    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i])
        y.append(data[i])

    return np.array(X), np.array(y)