import pandas as pd
import numpy as np

def build_features(data: pd.DataFrame) -> pd.DataFrame:
    """
    Build technical indicators manually without pandas-ta.
    
    Args:
        data: DataFrame with OHLCV columns (Open, High, Low, Close, Volume).
    
    Returns:
        DataFrame with additional feature columns.
    """
    df = data.copy()
    
    # Simple Moving Average (SMA)
    df['sma_20'] = df['Close'].rolling(window=20).mean()
    df['sma_50'] = df['Close'].rolling(window=50).mean()
    
    # Relative Strength Index (RSI)
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
    rs = gain / loss.replace([np.inf, -np.inf], np.nan).fillna(1e-10)  # Avoid div by zero
    df['rsi_14'] = 100 - (100 / (1 + rs))
    
    # MACD (Exponential Moving Average based)
    ema_12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema_12 - ema_26
    
    # Bollinger Bands
    df['bb_middle'] = df['Close'].rolling(window=20).mean()
    df['bb_std'] = df['Close'].rolling(window=20).std()
    df['bb_upper'] = df['bb_middle'] + 2 * df['bb_std']
    df['bb_lower'] = df['bb_middle'] - 2 * df['bb_std']
    
    # Volume Moving Average
    df['volume_sma_20'] = df['Volume'].rolling(window=20).mean()
    
    # Ensure Date is a column and datetime
    df['Date'] = pd.to_datetime(df.index if 'Date' not in df.columns else df['Date'])
    df.set_index('Date', inplace=True)
    df.reset_index(inplace=True)
    
    # Drop NaN values
    df = df.dropna().reset_index(drop=True)
    
    return df