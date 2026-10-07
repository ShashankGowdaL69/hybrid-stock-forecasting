import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../api/api';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SentimentSimulation = () => {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [startPrice, setStartPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [sentimentText, setSentimentText] = useState('');
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  const [sentimentLabel, setSentimentLabel] = useState<string | null>(null);
  const [sentimentAppliedPrice, setSentimentAppliedPrice] =
    useState<number | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

    const [sentimentStartTime, setSentimentStartTime] =
    useState<number | null>(null);

    const [prices, setPrices] = useState<number[]>([]);
    const latestPriceRef = useRef<number | null>(null);

    const runSimulation = async () => {
        try {
            setIsLoading(true);

            const cleanSymbol = symbol.trim().toUpperCase();

            if (!cleanSymbol) {
            return;
            }

            const response = await fetch(
                `${API_BASE_URL}/ml/current-price?symbol=${cleanSymbol}`
            );

            if (!response.ok) {
            throw new Error('Failed to fetch current price');
            }

            const data = await response.json();

            const currentPrice = Number(data.price);

            setStartPrice(currentPrice);
            setSentimentScore(null);
            setSentimentLabel(null);
            setSentimentAppliedPrice(null);
            setSentimentStartTime(null);

            const initialPrices = Array.from(
            { length: 120 },
            (_, index) => {
                let price = currentPrice;

                for (let i = 0; i <= index; i++) {
                price += (Math.random() - 0.5) * 0.08;
                }

                return price;
            }
            );

            setPrices(initialPrices);
        } catch (error) {
            console.error('Failed to fetch current price:', error);
        } finally {
            setIsLoading(false);
        }
        };

    const analyzeSentiment = async () => {
        if (!sentimentText.trim()) return;

        try {
            setSentimentLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/ml/sentiment?symbol=${encodeURIComponent(
                    symbol.trim().toUpperCase()
                )}&text=${encodeURIComponent(
                    sentimentText.trim()
                )}`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
            throw new Error('Failed to analyze sentiment');
            }

            const data = await response.json();

            setSentimentScore(Number(data.score));
            setSentimentLabel(data.label);
            setSentimentStartTime(Date.now());

            setSentimentAppliedPrice(latestPriceRef.current);

        } catch (error) {
            console.error('Sentiment analysis failed:', error);
        } finally {
            setSentimentLoading(false);
        }
        };


  useEffect(() => {
  if (startPrice === null) return;

    const interval = setInterval(() => {
        setPrices((currentPrices) => {
        if (currentPrices.length === 0) return currentPrices;

        const lastPrice =
            currentPrices[currentPrices.length - 1];

        const randomChange = (Math.random() - 0.5) * 0.12;

        const elapsedSeconds =
            sentimentStartTime !== null
                ? (Date.now() - sentimentStartTime) / 1000
                : 0;

        const decay = Math.exp(-elapsedSeconds / 4);

        const minimumInfluence = 0.08;

        const sentimentStrength =
            sentimentScore !== null
                ? Math.abs(sentimentScore) *
                (minimumInfluence + (1 - minimumInfluence) * decay)
                : 0;

        const sentimentDirection =
            sentimentScore !== null
                ? Math.sign(sentimentScore)
                : 0;

        const sentimentDrift =
            sentimentDirection * sentimentStrength * 0.06;

        const nextPrice = Math.max(
            1,
            lastPrice + randomChange + sentimentDrift
        );

        latestPriceRef.current = nextPrice;

        return [
            ...currentPrices.slice(-119),
            nextPrice,
        ];
        });
    }, 250);

    return () => clearInterval(interval);
    }, [startPrice, sentimentScore, sentimentStartTime]);

  const currentPrice =
    prices.length > 0
        ? prices[prices.length - 1]
        : startPrice ?? 0;

    const change =
    startPrice !== null
        ? currentPrice - startPrice
        : 0;

    const changePercent =
    startPrice !== null
        ? (change / startPrice) * 100
        : 0;

  const sentimentDirection =
    change > 0 ? 'Bullish' : change < 0 ? 'Bearish' : 'Neutral';

  const chartData = {
    labels: prices.map((_, index) => index),
    datasets: [
        {
            data: prices,
            borderWidth: 1.5,
            pointRadius: (context: any) =>
            context.dataIndex === prices.length - 1 ? 4 : 0,
            pointHoverRadius: 4,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#ffffff',
            tension: 0.15,
            segment: {
            borderColor: (context: any) =>
                context.p1.parsed.y >= context.p0.parsed.y
                ? '#22c55e'
                : '#ef4444',
            },
        },

        {
            label: 'Sentiment Applied',
            data: prices.map((price) =>
                price === sentimentAppliedPrice ? price : null
            ),
            borderWidth: 0,
            pointRadius: sentimentAppliedPrice !== null ? 5 : 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#facc15',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            showLine: false,
        },
        ],
    };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <h1 className="text-3xl font-bold text-white mb-2">
        Sentiment Simulation
      </h1>

      <p className="text-gray-400 mb-6">
        Explore how sentiment strength can influence simulated stock-price movement.
      </p>

      <div className="mb-6 flex items-end gap-3">
        <div className="flex-1 max-w-[180px]">
            <label className="block text-sm text-gray-400 mb-2">
            Stock Symbol
            </label>

            <input
            type="text"
            value={symbol}
            onChange={(e) =>
                setSymbol(e.target.value.toUpperCase())
            }
            placeholder="e.g. RELIANCE"
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none focus:border-blue-500"
            />
        </div>

        <button
            onClick={runSimulation}
            disabled={isLoading || !symbol.trim()}
            className="ml-4 px-4 py-2 rounded-lg bg-blue-400 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {isLoading ? 'Running...' : 'Run Simulation'}
        </button>
        </div>

      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Simulated Market Movement
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              A continuously moving simulation of stock-price behaviour.
            </p>
          </div>

          <div className="flex items-start gap-8 text-right">
            <div>
                <p className="text-gray-400 text-sm">
                Start Price
                </p>

                <p className="text-white text-2xl font-bold">
                {startPrice !== null
                    ? `₹${startPrice.toFixed(2)}`
                    : 'Loading...'}
                </p>
            </div>

            <div>
                <p className="text-gray-400 text-sm">
                Current Price
                </p>

                <p className="text-white text-2xl font-bold">
                ₹{currentPrice.toFixed(2)}
                </p>

                <p
                className={`text-sm font-semibold ${
                    change >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
                >
                {change >= 0 ? '+' : ''}
                {change.toFixed(2)} (
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(2)}%)
                </p>

                <p
                className={`text-sm font-semibold mt-1 ${
                    change > 0
                    ? 'text-green-400'
                    : change < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                }`}
                >
                {change > 0 ? '▲' : change < 0 ? '▼' : '●'}{' '}
                {sentimentDirection}
                </p>
            </div>
            </div>
        </div>

        <div className="h-96 w-full">
            <Line
                data={chartData}
                options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,

                interaction: {
                    intersect: false,
                    mode: 'index',
                },

                scales: {
                    x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#9ca3af',
                        font: {
                        size: 12,
                        },
                    },

                    grid: {
                        color: 'rgba(75, 85, 99, 0.45)',
                        lineWidth: 1,
                    },

                    ticks: {
                        color: '#9ca3af',
                        maxTicksLimit: 7,

                        callback: function (_value, index) {
                        const secondsAgo =
                            ((prices.length - 1 - index) * 0.25).toFixed(1);

                        return index === prices.length - 1
                            ? 'Now'
                            : `-${secondsAgo}s`;
                        },
                    },
                    },

                    y: {
                    title: {
                        display: true,
                        text: 'Price (₹)',
                        color: '#9ca3af',
                        font: {
                        size: 12,
                        },
                    },

                    grid: {
                        color: 'rgba(75, 85, 99, 0.55)',
                        lineWidth: 1,
                    },

                    ticks: {
                        color: '#9ca3af',
                        maxTicksLimit: 7,

                        callback: function (value) {
                        return `₹${Number(value).toFixed(2)}`;
                        },
                    },
                    },
                },

                plugins: {
                    legend: {
                    display: false,
                    },

                    tooltip: {
                    enabled: true,
                    backgroundColor: '#111827',
                    titleColor: '#ffffff',
                    bodyColor: '#d1d5db',
                    borderColor: '#374151',
                    borderWidth: 1,

                    callbacks: {
                        label: function (context) {
                        return `Price: ₹${Number(context.parsed.y).toFixed(2)}`;
                        },
                    },
                    },
                },
                }}
            />
        </div>

        <div className="mt-5 rounded-xl border border-gray-700 bg-gray-800 p-5">
            <p className="text-white font-semibold">
                Sentiment Analysis
            </p>

            <p className="text-gray-400 text-sm mt-1 mb-4">
                Enter a news statement or market-related text to analyze
                its sentiment.
            </p>

            <div className="flex items-stretch gap-4">
                <textarea
                    value={sentimentText}
                    onChange={(e) => setSentimentText(e.target.value)}
                    placeholder="Enter a news statement..."
                    rows={3}
                    className="w-[68%] rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                />

                <div className="flex-1 flex flex-col">
                    <button
                        type="button"
                        onClick={analyzeSentiment}
                        disabled={sentimentLoading || !sentimentText.trim()}
                        className="w-full px-4 py-2 rounded-lg bg-blue-400 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sentimentLoading ? 'Analyzing...' : 'Analyze Sentiment'}
                    </button>

                    {sentimentLabel !== null && (
                        <div className="flex-1 flex items-center justify-center gap-6">
                            <div>
                                <p className="text-gray-400 text-xs">
                                    Sentiment
                                </p>

                                <p
                                    className={`text-sm font-semibold ${
                                        sentimentLabel === 'Bullish'
                                            ? 'text-green-400'
                                            : sentimentLabel === 'Bearish'
                                            ? 'text-red-400'
                                            : 'text-gray-300'
                                    }`}
                                >
                                    {sentimentLabel}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-xs">
                                    Score
                                </p>

                                <p
                                    className={`text-sm font-semibold ${
                                        sentimentLabel === 'Bullish'
                                            ? 'text-green-400'
                                            : sentimentLabel === 'Bearish'
                                            ? 'text-red-400'
                                            : 'text-gray-300'
                                    }`}
                                >
                                    {sentimentScore?.toFixed(4)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SentimentSimulation;