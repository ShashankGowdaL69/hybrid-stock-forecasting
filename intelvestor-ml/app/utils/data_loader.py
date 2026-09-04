import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_historical(symbol: str, start_date: str = None, retries: int = 3, delay: int = 2) -> pd.DataFrame:
    if not start_date:
        start_date = (datetime.now() - timedelta(days=365*2)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')
    
    # Try different symbol formats for Indian stocks
    symbol_formats = [f"{symbol}.BO", f"{symbol}.NS", symbol]
    
    for symbol_format in symbol_formats:
        logger.info(f"Fetching historical data for {symbol_format} from {start_date} to {end_date}")
        
        for attempt in range(1, retries + 1):
            try:
                df = yf.download(symbol_format, start=start_date, end=end_date, progress=False)
                if df.empty:
                    logger.warning(f"No data found for {symbol_format} on attempt {attempt}")
                    continue
                    
                df.reset_index(inplace=True)
                df['Date'] = pd.to_datetime(df['Date'])
                logger.info(f"Successfully fetched data for {symbol_format}: {len(df)} rows")
                return df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
            except Exception as e:
                logger.error(f"Attempt {attempt} failed for {symbol_format}: {str(e)}")
                if attempt < retries:
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    logger.error(f"Failed to fetch data for {symbol_format} after {retries} attempts")
                    break
    
    # If all formats fail, raise error
    raise ValueError(f"Failed to fetch data for {symbol} in any format (.BO, .NS, or direct)")