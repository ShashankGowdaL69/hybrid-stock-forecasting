import { useState, useEffect } from 'react';
import { getSocialInsights } from '../api/api';
import { useAuth } from '@clerk/clerk-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SocialData {
  trends: { term: string; frequency: number }[];
  sentiment: { score: number; posts: string[] };
}

const SocialInsights: React.FC = () => {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<SocialData | null>(null);
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
        const result = await getSocialInsights(symbol, token);
        setData({
          trends: result.sentiment.trends || [], // Fallback if not provided
          sentiment: {
            score: result.sentiment.score,
            posts: result.sentiment.posts || result.sentiment.headlines || [], // Use posts or fallback to headlines
          },
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insights. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoaded, getToken, symbol]);

  const trendsChartData = data ? {
    labels: data.trends.map(t => t.term),
    datasets: [{
      label: 'Trend Frequency',
      data: data.trends.map(t => t.frequency),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }],
  } : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Social Insights</h1>
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
            {/* Social Trends Chart */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Social Trends</h3>
              {trendsChartData && data.trends.length > 0 ? (
                <div className="h-64">
                  <Bar 
                    data={trendsChartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      plugins: { 
                        legend: { 
                          display: true, 
                          position: 'top',
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      },
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
                          ticks: {
                            color: '#ffffff'
                          },
                          grid: {
                            color: '#374151'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">📊</p>
                    <p>No trending topics data available</p>
                    <p className="text-sm">Trends will appear here when data is available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sentiment & Social Posts */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Social Sentiment</h3>
              <div className="mb-4">
                <p className="text-lg mb-2">
                  Sentiment Score: <span className="font-bold text-blue-300">{data.sentiment.score.toFixed(2)}</span>
                </p>
                <div className="text-xs text-gray-400">Range: -1 (Very Negative) to +1 (Very Positive)</div>
              </div>
              
              <h4 className="text-lg font-semibold mb-3 text-blue-300">Recent Social Posts/Headlines</h4>
              <div className="max-h-64 overflow-y-auto">
                {data.sentiment.posts.length > 0 ? (
                  <ul className="space-y-2">
                    {data.sentiment.posts.map((post: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300 leading-relaxed p-2 bg-gray-700 rounded">
                        {post}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-lg mb-2">💬</p>
                    <p>No social posts available</p>
                    <p className="text-sm">Social sentiment data will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Social Analytics Summary */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Social Analytics Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-300">{data.trends.length}</div>
                  <div className="text-sm text-gray-400">Trending Topics</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{data.sentiment.posts.length}</div>
                  <div className="text-sm text-gray-400">Social Posts Analyzed</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className={`text-2xl font-bold ${data.sentiment.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.sentiment.score >= 0 ? 'Positive' : 'Negative'}
                  </div>
                  <div className="text-sm text-gray-400">Overall Sentiment</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">Enter a valid symbol to see social insights.</div>
        )}
        <p className="text-center text-sm text-gray-500 mt-6 italic">
          Disclaimer: Social insights from public sources; may include unverified information.
        </p>
      </div>
    </motion.div>
  );
};

export default SocialInsights;