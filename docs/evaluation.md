{
  "cells": [
    {
      "cell_type": "code",
      "source": [
        "import pandas as pd\n",
        "import yfinance as yf\n",
        "from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error\n",
        "import numpy as np\n",
        "\n",
        "# Load data\n",
        "symbol = 'AXISBANK.NS'\n",
        "df = yf.download(symbol, start='2023-01-01', end='2025-09-21')\n",
        "df.reset_index(inplace=True)\n",
        "\n",
        "# Simple evaluation\n",
        "train = df.iloc[:-30]\n",
        "test = df.iloc[-30:]\n",
        "from statsmodels.tsa.arima.model import ARIMA\n",
        "model = ARIMA(train['Close'], order=(5,1,0)).fit()\n",
        "pred = model.forecast(30)\n",
        "rmse = np.sqrt(mean_squared_error(test['Close'], pred))\n",
        "mape = mean_absolute_percentage_error(test['Close'], pred)\n",
        "print(f'RMSE: {rmse}, MAPE: {mape}')"
      ],
      "metadata": {},
      "execution_count": null,
      "outputs": []
    }
  ],
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 5
}