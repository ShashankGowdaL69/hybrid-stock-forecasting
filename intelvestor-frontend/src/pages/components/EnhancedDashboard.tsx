import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  AlertTriangle,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles
} from 'lucide-react';
import { getMarketOverview, analyzePortfolio, getPrediction } from '../../api/api';

interface MarketData {
  symbol: string;
  current_price: number;
  change_percent: number;
  volume: number;
  market_cap: number;
}

interface PortfolioData {
  portfolio: Array<{
    symbol: string;
    current_price: number;
    quantity: number;
    value: number;
    change_percent: number;
    weight: number;
  }>;
  total_value: number;
  overall_change: number;
  risk_score: number;
  diversification_score: number;
}

interface PredictionData {
  prediction: Array<{ date: string; pred: number; conf: number }>;
  shap: Array<{ feature: string; value: number }>;
  explanation: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState('RELIANCE');

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch market overview
      const marketResponse = await getMarketOverview(token);
      setMarketData(marketResponse.market_data || []);

      // Fetch portfolio analysis
      const portfolioSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'AXISBANK'];
      const portfolioResponse = await analyzePortfolio(portfolioSymbols, token);
      setPortfolioData(portfolioResponse);

      // Fetch prediction for selected stock
      const predictionResponse = await getPrediction(selectedStock, 30, token);
      setPredictionData(predictionResponse);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [getToken, selectedStock]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, change, icon: Icon, color }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1 text-sm font-medium">{Math.abs(change).toFixed(2)}%</span>
            </div>
          )}
        </div>
        <Icon className={`w-12 h-12 ${color}`} />
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time market insights and portfolio analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Portfolio Value"
            value={`₹${portfolioData?.total_value?.toLocaleString() || '0'}`}
            change={portfolioData?.overall_change}
            icon={DollarSign}
            color="text-green-600"
          />
          <StatCard
            title="Risk Score"
            value={`${portfolioData?.risk_score || 'N/A'}/10`}
            icon={AlertTriangle}
            color="text-orange-600"
          />
          <StatCard
            title="Diversification"
            value={`${portfolioData?.diversification_score || 'N/A'}/10`}
            icon={PieChartIcon}
            color="text-blue-600"
          />
          <StatCard
            title="Active Stocks"
            value={marketData.length}
            icon={Activity}
            color="text-purple-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Market Overview
            </h2>
            <div className="space-y-4">
              {marketData.map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">{stock.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{stock.symbol}</p>
                      <p className="text-sm text-gray-600">Vol: {(stock.volume / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{stock.current_price.toFixed(2)}</p>
                    <div className={`flex items-center ${stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change_percent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="ml-1 text-sm">{stock.change_percent.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Portfolio Allocation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-blue-600" />
              Portfolio Allocation
            </h2>
            {portfolioData && (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={portfolioData.portfolio}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ symbol, weight }) => `${symbol} ${weight}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="weight"
                  >
                    {portfolioData.portfolio.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Weight']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Stock Prediction Chart */}
        {predictionData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Price Prediction - {selectedStock}
              </h2>
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {marketData.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol}
                  </option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={predictionData.prediction}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pred"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* SHAP Analysis */}
        {predictionData?.shap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
              Feature Importance (SHAP Analysis)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={predictionData.shap}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Explanation:</strong> {predictionData.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;