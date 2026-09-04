import { useState, useEffect } from 'react';
import { getPortfolio } from '../api/api';
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

interface PortfolioData {
  holdings: { symbol: string; quantity: number; purchasePrice: number }[];
  totalValue: number;
}

const PortfolioAnalytics: React.FC = () => {
  const { getToken, isLoaded } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock prices; replace with backend API if needed
  const getCurrentPrice = (symbol: string): number => ({ 'AXISBANK': 1200, 'RELIANCE': 2500 }[symbol] || 1000);

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk

    const fetchPortfolio = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication failed. Please sign in again.');
        const result = await getPortfolio(token);
        setPortfolio(result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portfolio data. Please try again later.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [isLoaded, getToken]);

  const performanceData = portfolio ? {
    labels: portfolio.holdings.map(h => h.symbol),
    datasets: [{
      label: 'Performance (%)',
      data: portfolio.holdings.map(h => ((getCurrentPrice(h.symbol) - h.purchasePrice) / h.purchasePrice * 100)),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }],
  } : null;

  const calculatedTotalValue = portfolio ? portfolio.holdings.reduce((acc, h) => acc + h.quantity * getCurrentPrice(h.symbol), 0) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Portfolio Analytics</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        ) : portfolio ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Summary */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Portfolio Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Value:</span>
                  <span className="text-2xl font-bold text-green-400">₹{calculatedTotalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Holdings:</span>
                  <span className="text-lg font-semibold text-blue-300">{portfolio.holdings.length} stocks</span>
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Holdings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-blue-300">Symbol</th>
                      <th className="text-right py-2 text-blue-300">Qty</th>
                      <th className="text-right py-2 text-blue-300">Buy Price</th>
                      <th className="text-right py-2 text-blue-300">Current</th>
                      <th className="text-right py-2 text-blue-300">P&L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((holding, i) => {
                      const currentPrice = getCurrentPrice(holding.symbol);
                      const pnlPercent = ((currentPrice - holding.purchasePrice) / holding.purchasePrice * 100);
                      return (
                        <tr key={i} className="border-b border-gray-700">
                          <td className="py-2 font-medium text-white">{holding.symbol}</td>
                          <td className="text-right py-2 text-gray-300">{holding.quantity}</td>
                          <td className="text-right py-2 text-gray-300">₹{holding.purchasePrice}</td>
                          <td className="text-right py-2 text-gray-300">₹{currentPrice}</td>
                          <td className={`text-right py-2 font-semibold ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Performance Metrics</h3>
              {performanceData && (
                <div className="h-64">
                  <Bar 
                    data={performanceData} 
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
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">No portfolio data available. Add holdings to see analytics.</div>
        )}
      </div>
    </motion.div>
  );
};

export default PortfolioAnalytics;