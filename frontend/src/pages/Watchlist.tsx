import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Trash2,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import {
  getWatchlist,
  removeFromWatchlist,
  getMarketData,
} from '../api/api';

interface MarketData {
  symbol: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  average_volume_20d: number;
  ma_20: number;
  ma_50: number;
  rsi_14: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

const Watchlist = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [marketData, setMarketData] = useState<
    Record<string, MarketData>
  >({});
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(false);

  const [forecastSymbol, setForecastSymbol] =
    useState<string | null>(null);

  const [forecastHorizon, setForecastHorizon] =
    useState(30);

  const loadWatchlist = async () => {
    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      const result = await getWatchlist(token);

        console.log('WATCHLIST: API result:', result);

        setWatchlist(result);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketData = async (symbols: string[]) => {
    if (symbols.length === 0) {
      setMarketData({});
      return;
    }

    const token = await getToken();

    if (!token) {
      return;
    }

    setMarketLoading(true);

    try {
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const result = await getMarketData(
              symbol,
              token
            );

            return [symbol, result] as [
              string,
              MarketData
            ];
          } catch {
            return null;
          }
        })
      );

      const nextMarketData: Record<string, MarketData> = {};

      results.forEach((result) => {
        if (result) {
          nextMarketData[result[0]] = result[1];
        }
      });

      setMarketData(nextMarketData);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    console.log('WATCHLIST: component mounted');
    loadWatchlist();
    }, []);

  useEffect(() => {
    if (watchlist.length === 0) {
      setMarketData({});
      return;
    }

    loadMarketData(watchlist);

    const interval = window.setInterval(() => {
      loadMarketData(watchlist);
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [watchlist]);

  const handleRemove = async (symbol: string) => {
    const token = await getToken();

    console.log('WATCHLIST: token exists:', !!token);

    if (!token) {
    return;
    }

    await removeFromWatchlist(symbol, token);

    setWatchlist((current) =>
      current.filter((item) => item !== symbol)
    );

    setMarketData((current) => {
      const next = { ...current };
      delete next[symbol];
      return next;
    });
  };

  const openForecast = (symbol: string) => {
    setForecastSymbol(symbol);
    setForecastHorizon(30);
  };

  const runForecast = () => {
    if (!forecastSymbol) {
      return;
    }

    navigate(
      `/predictions?symbol=${encodeURIComponent(
        forecastSymbol
      )}&horizon=${forecastHorizon}`
    );

    setForecastSymbol(null);
  };

  const getSignalClasses = (
    signal: MarketData['signal']
  ) => {
    if (signal === 'BULLISH') {
      return 'bg-green-900/40 text-green-300 border-green-700';
    }

    if (signal === 'BEARISH') {
      return 'bg-red-900/40 text-red-300 border-red-700';
    }

    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Star className="text-yellow-400" />

            <div>
              <h1 className="text-2xl font-semibold">
                Watchlist
              </h1>

              <p className="text-sm text-slate-500">
                Monitor your saved stocks and market conditions.
              </p>
            </div>
          </div>

          {marketLoading && (
            <p className="text-xs text-slate-500">
              Updating market data...
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400">
            Loading watchlist...
          </p>
        ) : watchlist.length === 0 ? (
          <div className="border border-slate-800 rounded-xl p-8 text-center">

            <Star
              className="mx-auto text-slate-600 mb-4"
              size={30}
            />

            <p className="text-slate-400">
              Your watchlist is empty.
            </p>

            <Link
              to="/predictions"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Open Forecast
              <ArrowRight size={16} />
            </Link>

          </div>
        ) : (
          <div className="grid gap-4">

            {watchlist.map((symbol) => {
              const data = marketData[symbol];

              return (
                <div
                  key={symbol}
                  className="border border-slate-800 rounded-2xl bg-slate-900/50 p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div className="min-w-48">
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold text-white">
                          {symbol}
                        </p>

                        {data && (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border ${getSignalClasses(
                              data.signal
                            )}`}
                          >
                            {data.signal}
                          </span>
                        )}
                      </div>

                      {data ? (
                        <>
                          <p className="text-2xl font-bold text-white mt-3">
                            ₹{data.current_price.toFixed(2)}
                          </p>

                          <p
                            className={`text-sm mt-1 ${
                              data.change >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {data.change >= 0 ? '+' : ''}
                            {data.change.toFixed(2)}
                            {' '}
                            ({data.change_percent >= 0 ? '+' : ''}
                            {data.change_percent.toFixed(2)}%)
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 mt-3">
                          Loading market data...
                        </p>
                      )}
                    </div>

                    {data && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 flex-1">

                        <div>
                          <p className="text-xs text-slate-500">
                            Previous Close
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            ₹{data.previous_close.toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Day High
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            ₹{data.day_high.toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Day Low
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            ₹{data.day_low.toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Volume
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            {data.volume.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Avg Volume (20D)
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            {data.average_volume_20d.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            MA (20D)
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            ₹{data.ma_20.toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            MA (50D)
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            ₹{data.ma_50.toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            RSI (14)
                          </p>
                          <p className="text-sm text-slate-200 mt-1">
                            {data.rsi_14.toFixed(2)}
                          </p>
                        </div>

                      </div>
                    )}

                    <div className="flex items-center gap-2">

                     <button
                       onClick={() => openForecast(symbol)}
                       className="px-4 py-2 rounded-lg bg-blue-400 hover:bg-blue-500 text-sm font-medium"
                     >
                       View Forecast
                     </button>

                      <button
                        onClick={() => handleRemove(symbol)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900"
                        title={`Remove ${symbol}`}
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>

      {forecastSymbol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Forecast {forecastSymbol}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Choose a forecast horizon.
                </p>
              </div>

              <button
                onClick={() => setForecastSymbol(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">

              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setForecastHorizon(days)}
                  className={`py-3 rounded-lg border text-sm font-medium ${
                    forecastHorizon === days
                      ? 'border-blue-400 bg-blue-400 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {days} Days
                </button>
              ))}

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setForecastSymbol(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>

            <button
              onClick={runForecast}
              className="px-4 py-2 rounded-lg bg-blue-400 hover:bg-blue-500 text-sm font-medium"
            >
              Forecast
            </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;