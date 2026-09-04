import { useState, useEffect } from 'react';
import { getPrediction } from '../api/api';
import { useAuth } from '@clerk/clerk-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PredictionData {
  symbol: string;
  prediction: { date: string; pred: number; conf: number }[];
  sentiment: { score: number; headlines: string[] };
  shap: { feature: string; value: number }[];
  explanation: string;
}

const SentimentAnalysis: React.FC = () => {
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
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sentiment data. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoaded, getToken, symbol]);

  const sentimentChartData = data ? {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [
        Math.max(0, data.sentiment.score),
        1 - Math.abs(data.sentiment.score),
        Math.max(0, -data.sentiment.score),
      ],
      backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
      hoverOffset: 4,
    }],
  } : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Sentiment Analysis</h1>
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
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg flex justify-center items-center">
              <div className="w-64 h-64">
                {sentimentChartData && (
                  <Doughnut 
                    data={sentimentChartData} 
                    options={{ 
                      responsive: true, 
                      cutout: '70%', 
                      plugins: { 
                        legend: { 
                          display: true, 
                          position: 'bottom',
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      }
                    }} 
                  />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <p className="text-lg text-center mb-4">
                Sentiment Score: <span className="font-bold text-blue-300">{data.sentiment.score.toFixed(2)}</span>
              </p>
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Top Headlines Influencing Sentiment</h3>
              <ul className="list-disc pl-5 space-y-2 max-h-64 overflow-y-auto">
                {data.sentiment.headlines.map((headline: string, i: number) => (
                  <li key={i} className="text-gray-300">{headline}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">Enter a valid symbol to analyze sentiment.</div>
        )}
      </div>
    </motion.div>
  );
};

export default SentimentAnalysis;