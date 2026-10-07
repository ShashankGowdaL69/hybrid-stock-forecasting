import { useState } from 'react';
import { API_BASE_URL, getPrediction } from '../api/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ForecastPoint {
  date: string;
  arima: number;
  lstm: number;
  xgb: number;
  ensemble: number;
}

interface ForecastMetrics {
  mae: number;
  rmse: number;
  mape: number;
}

interface ShapFeature {
  feature: string;
  value: number;
}

interface PredictionData {
  symbol: string;
  horizon: number;
  last_price: number;
  forecast: ForecastPoint[];
  metrics: {
    arima: ForecastMetrics;
    lstm: ForecastMetrics;
    xgb: ForecastMetrics;
    ensemble: ForecastMetrics;
  };
  shap: ShapFeature[];
  shap_features: Record<string, number>;
  sentiment: {
    score: number;
    headlines: string[];
    posts: string[];
    trends: {
      term: string;
      frequency: number;
    }[];
  };
}

const Predictions: React.FC = () => {
  const [data, setData] = useState<PredictionData | null>(null);
  const [symbol, setSymbol] = useState('AXISBANK');
  const [horizon, setHorizon] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [showShapExplanation, setShowShapExplanation] = useState(false);
  const [shapExplanation, setShapExplanation] = useState<string | null>(null);
  const [shapExplanationLoading, setShapExplanationLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setShowShapExplanation(false);
    setShapExplanation(null);
    setShapExplanationLoading(false);

    try {
      const result = await getPrediction(symbol, horizon);
      setData(result);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch prediction data. Please try again later.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchShapExplanation = async () => {
    if (!data) return;

    setShapExplanationLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/ml/shap-explanation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: data.symbol,
            features: data.shap_features,
            shap_values: data.shap,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate SHAP explanation');
      }

      const result = await response.json();

      setShapExplanation(result.shap_explanation);
    } catch {
      setShapExplanation(
        'The model\'s SHAP analysis identified the most relevant technical factors, but a natural-language explanation could not be generated at this time.'
      );
    } finally {
      setShapExplanationLoading(false);
    }
  };

  const finalForecast = data?.forecast[data.forecast.length - 1]?.ensemble ?? 0;

  const expectedChange = data?.last_price
    ? ((finalForecast - data.last_price) / data.last_price) * 100
    : 0;

  const predictionChartData = data
  ? {
      labels: data.forecast.map((point) => point.date),
      datasets: [
        {
          label: 'ARIMA',
          data: data.forecast.map((point) => point.arima),
          borderColor: 'rgba(255, 159, 64, 1)',
          tension: 0.1,
        },
        {
          label: 'LSTM',
          data: data.forecast.map((point) => point.lstm),
          borderColor: 'rgba(54, 162, 235, 1)',
          tension: 0.1,
        },
        {
          label: 'XGBoost',
          data: data.forecast.map((point) => point.xgb),
          borderColor: 'rgba(153, 102, 255, 1)',
          tension: 0.1,
        },
        {
          label: 'Stacking Meta-Model',
          data: data.forecast.map((point) => point.ensemble),
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 3,
          tension: 0.1,
        },
      ],
    }
  : null;

    const shapChartData = data
    ? {
        labels: data.shap.map((item) => item.feature),
        datasets: [
          {
            label: 'SHAP Contribution',
            data: data.shap.map((item) => item.value),
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            borderColor: 'rgba(96, 165, 250, 1)',
            borderWidth: 1,
          },
        ],
      }
    : null;

    const averageBaseMape = data
    ? (
        data.metrics.arima.mape +
        data.metrics.lstm.mape +
        data.metrics.xgb.mape
      ) / 3
    : 0;

    const stackingMapeReduction =
      data && averageBaseMape > 0
        ? ((averageBaseMape - data.metrics.ensemble.mape) / averageBaseMape) * 100
        : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Stock Predictions</h1>
        <div className="mb-4">
          <label htmlFor="symbol-input" className="text-lg font-semibold text-blue-400">
            Stock Symbol:
          </label>
          <input
            id="symbol-input"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="ml-2 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AXISBANK"
          />
        </div>

                <div className="mb-4">
          <label
            htmlFor="horizon-select"
            className="text-lg font-semibold text-blue-400"
          >
            Forecast Horizon:
          </label>

          <select
            id="horizon-select"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="ml-2 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>

          <button
            onClick={fetchData}
            disabled={loading || !symbol.trim()}
            className="ml-4 px-4 py-2 rounded-lg bg-blue-400 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running...' : 'Run Forecast'}
          </button>

        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        ) : data ? (
          <div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
                <p className="text-sm text-gray-400">Stock</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data.symbol}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
                <p className="text-sm text-gray-400">Current Price</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ₹{data.last_price.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
                <p className="text-sm text-gray-400">Final Forecast</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  ₹{finalForecast.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
                <p className="text-sm text-gray-400">Expected Change</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {expectedChange >= 0 ? '+' : ''}
                  {expectedChange.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-blue-400">
                  Model Performance
                </h3>

                <span className="text-xs px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700">
                  Stacking ensemble
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-5">
                Performance is evaluated on a held-out historical test set.
                The stacking meta-model learns how to combine ARIMA, LSTM,
                and XGBoost predictions using chronological out-of-sample data.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: 'ARIMA', metrics: data.metrics.arima, hybrid: false },
                  { name: 'LSTM', metrics: data.metrics.lstm, hybrid: false },
                  { name: 'XGBoost', metrics: data.metrics.xgb, hybrid: false },
                  {
                    name: 'Stacking Meta-Model',
                    metrics: data.metrics.ensemble,
                    hybrid: true,
                  },
                ].map((model) => (
                  <div
                    key={model.name}
                    className={`rounded-xl p-5 ${
                      model.hybrid
                        ? 'border-2 border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-900/20'
                        : 'border border-gray-700 bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className={`font-semibold ${
                          model.hybrid ? 'text-blue-300' : 'text-white'
                        }`}
                      >
                        {model.name}
                      </h4>

                      {model.hybrid && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">
                          Final
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">
                        MAE:
                        <span className="text-white ml-1">
                          {model.metrics.mae.toFixed(2)}
                        </span>
                      </p>

                      <p className="text-sm text-gray-400">
                        RMSE:
                        <span className="text-white ml-1">
                          {model.metrics.rmse.toFixed(2)}
                        </span>
                      </p>

                      <p className="text-sm text-gray-400">
                        MAPE:
                        <span className="text-white ml-1">
                          {model.metrics.mape.toFixed(2)}%
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 rounded-xl bg-gray-900 border border-gray-700">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-blue-300">
                    Stacking improvement:
                  </span>{' '}
                  Average base-model MAPE{' '}
                  <span className="text-white font-semibold">
                    {averageBaseMape.toFixed(2)}%
                  </span>{' '}
                  → Stacking MAPE{' '}
                  <span className="text-white font-semibold">
                    {data.metrics.ensemble.mape.toFixed(2)}%
                  </span>
                </p>

                <p className="text-sm text-green-300 mt-2">
                  MAPE reduction:{' '}
                  <span className="font-semibold">
                    {stackingMapeReduction.toFixed(1)}%
                  </span>
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  The meta-model learns relationships between the three
                  base-model predictions instead of using fixed ensemble
                  weights.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-blue-400">
                    Market Sentiment
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Aggregated sentiment from recent financial news.
                  </p>
                </div>

                <span
                  className={`text-sm px-3 py-1 rounded-full border ${
                    data.sentiment.score > 0.05
                      ? 'bg-green-900/50 text-green-300 border-green-700'
                      : data.sentiment.score < -0.05
                        ? 'bg-red-900/50 text-red-300 border-red-700'
                        : 'bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                >
                  {data.sentiment.score > 0.05
                    ? 'Bullish'
                    : data.sentiment.score < -0.05
                      ? 'Bearish'
                      : 'Neutral'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sentiment Score</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {data.sentiment.score.toFixed(4)}
                  </p>
                </div>

                <button
                  onClick={() => setShowNews(!showNews)}
                  className="px-4 py-2 rounded-lg bg-blue-400 text-white font-semibold hover:bg-blue-500"
                >
                  {showNews ? 'Hide Recent News' : 'View Recent News'}
                </button>
              </div>

              {showNews && (
                <div className="mt-5 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">
                    Recent Headlines
                  </h4>

                  <ul className="space-y-2">
                    {data.sentiment.headlines.map((headline, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-400 border-b border-gray-700 pb-2 last:border-b-0"
                      >
                        {headline}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Chart */}
              <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">
                  Price Forecast (Next {horizon} Days)
                </h3>
                {predictionChartData && (
                  <div className="h-64">
                    <Line
                      data={predictionChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            ticks: {
                              color: '#ffffff'
                            },
                            grid: {
                              color: '#374151'
                            }
                          },
                          y: {
                            beginAtZero: false,
                            ticks: {
                              color: '#ffffff'
                            },
                            grid: {
                              color: '#374151'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            labels: {
                              color: '#ffffff'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SHAP Explanation */}
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg h-[500px]">
                <div className="flex items-center gap-10 mb-4">
                  <h3 className="text-xl font-semibold text-blue-400">
                    Model Explanation (SHAP)
                  </h3>

                  <button
                    onClick={() => {
                      if (showShapExplanation) {
                        setShowShapExplanation(false);
                      } else {
                        setShowShapExplanation(true);
                        if (!shapExplanation) {
                          fetchShapExplanation();
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-400 text-white text-sm font-semibold hover:bg-blue-500"
                  >
                    {showShapExplanation
                      ? 'Hide Explanation'
                      : 'View Explanation'}
                  </button>
                </div>

                <div className="h-[420px] overflow-y-auto pr-2">
                  {shapChartData && (
                    <div className="h-80">
                      <Bar
                        data={shapChartData}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              ticks: { color: '#ffffff' },
                              grid: { color: '#374151' },
                            },
                            y: {
                              ticks: { color: '#ffffff' },
                              grid: { color: '#374151' },
                            },
                          },
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                              labels: { color: '#ffffff' },
                            },
                          },
                        }}
                      />
                    </div>
                  )}

                  {showShapExplanation && (
                    <div className="mt-5 rounded-xl bg-gray-900 border border-gray-700 p-4">
                      {shapExplanationLoading ? (
                        <p className="text-gray-400">
                          Generating model explanation...
                        </p>
                      ) : (
                        <p className="text-gray-300 leading-relaxed">
                          {shapExplanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Forecast */}
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">
                  Detailed Forecast
                </h3>

                <div className="h-96 overflow-y-auto">
                  <ul className="space-y-2">
                    {data.forecast.map((point, i) => (
                      <li
                        key={i}
                        className="text-sm"
                      >
                        <div className="text-gray-300 mb-1">
                          {point.date}
                        </div>

                        <div className="flex gap-3 items-center whitespace-nowrap text-xs">
                          <span className="text-orange-300">
                            ARIMA: ₹{point.arima.toFixed(2)}
                          </span>
                            <span className="text-blue-300">
                              LSTM: ₹{point.lstm.toFixed(2)}
                            </span>
                          <span className="text-purple-300">
                            XGB: ₹{point.xgb.toFixed(2)}
                          </span>
                          <span className="text-white font-semibold">
                            Stacking: ₹{point.ensemble.toFixed(2)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">Enter a valid symbol to see predictions.</div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6 italic">
          Disclaimer: AI-generated predictions for educational purposes only. Not financial advice.
        </p>

      </div>
    </motion.div>
  );
};

export default Predictions;