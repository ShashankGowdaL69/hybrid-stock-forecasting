import { useState, useEffect } from 'react';
import { getPrediction } from '../api/api';
import { useAuth } from '@clerk/clerk-react';
import ShapExplanation from './components/ShapExplaination';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PredictionData {
  symbol: string;
  prediction: { date: string; pred: number; conf: number }[];
  sentiment: { score: number; headlines: string[] };
  shap: { feature: string; value: number }[];
  explanation: string;
}

const Predictions: React.FC = () => {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<PredictionData | null>(null);
  const [symbol, setSymbol] = useState('AXISBANK');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication failed. Please sign in again.');
        const result = await getPrediction(symbol, 30, token);
        setData(result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prediction data. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoaded, getToken, symbol]);

  const predictionChartData = data ? {
    labels: data.prediction.map(p => p.date),
    datasets: [{
      label: 'Predicted Price',
      data: data.prediction.map(p => p.pred),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    }],
  } : null;

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Chart */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Price Forecast (Next 30 Days)</h3>
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

            {/* Detailed Predictions */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Detailed Predictions</h3>
              <div className="max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {data.prediction.map((pred, i) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{pred.date}</span>
                      <div className="text-right">
                        <div className="text-white font-semibold">₹{pred.pred.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Conf: {pred.conf.toFixed(2)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sentiment & Headlines */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Sentiment & Headlines</h3>
              <div className="mb-4">
                <p className="text-lg mb-2">
                  Sentiment Score: <span className="font-bold text-blue-300">{data.sentiment.score.toFixed(2)}</span>
                </p>
                <div className="text-xs text-gray-400">Higher = More Positive</div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {data.sentiment.headlines.map((headline: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 leading-relaxed">{headline}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SHAP Explanation */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <ShapExplanation shap={data.shap} explanation={data.explanation} />
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