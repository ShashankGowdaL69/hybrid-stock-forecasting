import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { getForecastHistory } from '../api/api';

interface HistoryEntry {
  id: string;
  symbol: string;
  horizon: number;
  generatedAt: string;
  currentPrice: number;
  finalForecast: number;
  expectedChange: number;
  sentimentScore: number;
  ensembleMape: number;
}

const ForecastHistory = () => {
  const { getToken } = useAuth();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const result = await getForecastHistory(token);

        setHistory(result);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [getToken]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <History className="text-slate-300" />

          <div>
            <h1 className="text-2xl font-semibold">
              Forecast History
            </h1>

            <p className="text-sm text-slate-500">
              Your recent forecast results.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-400">
            Loading history...
          </p>
        ) : history.length === 0 ? (
          <div className="border border-slate-800 rounded-xl p-8 text-center">

            <p className="text-slate-400">
              No forecasts have been saved yet.
            </p>

            <Link
              to="/predictions"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Run Forecast
              <ArrowRight size={16} />
            </Link>

          </div>
        ) : (
          <div className="space-y-3">

            {history.map((item) => (
              <div
                key={item.id}
                className="border border-slate-800 rounded-xl bg-slate-900/40 p-5"
              >

                <div className="flex flex-wrap items-center justify-between gap-4">

                  <div>
                    <p className="font-semibold text-lg">
                      {item.symbol}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {item.horizon}-day forecast ·{' '}
                      {new Date(
                        item.generatedAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-400">
                      Expected change
                    </p>

                    <p
                      className={`font-semibold ${
                        item.expectedChange >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {item.expectedChange >= 0
                        ? '+'
                        : ''}
                      {item.expectedChange.toFixed(2)}%
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">

                  <div>
                    <p className="text-xs text-slate-500">
                      Current Price
                    </p>

                    <p className="mt-1">
                      ₹{item.currentPrice.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Final Forecast
                    </p>

                    <p className="mt-1">
                      ₹{item.finalForecast.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Sentiment
                    </p>

                    <p className="mt-1">
                      {item.sentimentScore >= 0
                        ? '+'
                        : ''}
                      {item.sentimentScore.toFixed(3)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Ensemble MAPE
                    </p>

                    <p className="mt-1">
                      {item.ensembleMape.toFixed(2)}%
                    </p>
                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default ForecastHistory;