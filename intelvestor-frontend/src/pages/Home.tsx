import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  BarChart,
  PieChart,
  TrendingUpIcon,
  BarChart3Icon,
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuoteIcon,
} from 'lucide-react';

declare global {
  interface Window {
    TradingView: unknown;
  }
}

const Home: React.FC = () => {
  const { isSignedIn } = useAuth();

  const features = [
    {
      icon: <TrendingUpIcon className="w-12 h-12 text-blue-500" />,
      title: 'AI Predictions',
      description: 'Hybrid models (LSTM/ARIMA + sentiment) for short-term stock price forecasts in Indian markets.',
      benefits: ['Trend confidence', 'Real-time adjustments', 'Backtesting support'],
    },
    {
      icon: <BarChart3Icon className="w-12 h-12 text-blue-500" />,
      title: 'Sentiment Analysis',
      description: 'Multi-source fusion from news, social media, and reports using FinBERT/XLNet.',
      benefits: ['Gauges for market tone', 'News/social integration', 'Investor sentiment dynamics'],
    },
    {
      icon: <AlertCircleIcon className="w-12 h-12 text-blue-500" />,
      title: 'Risk Management',
      description: 'VaR/CVaR, Black-Litterman for volatility assessment in Indian stocks.',
      benefits: ['Alerts for gaps/events', 'Exposure signals', 'Monte Carlo simulations'],
    },
    {
      icon: <PieChart className="w-12 h-12 text-blue-500" />,
      title: 'Portfolio Analytics',
      description: 'Allocation breakdowns and performance metrics with XAI explanations.',
      benefits: ['Diversification insights', 'SHAP/LIME transparency', 'Goal-based tracking'],
    },
  ];

  const testimonials = [
    {
      content: 'This AI tool transformed my stock predictions with accurate sentiment fusion.',
      name: 'Amit Sharma',
      title: 'Investor',
    },
    {
      content: 'Risk management features saved me from volatile Indian market swings!',
      name: 'Priya Singh',
      title: 'Trader',
    },
    {
      content: 'Explainable AI built my trust in forecasts—great for NSE/BSE analysis.',
      name: 'Rahul Verma',
      title: 'Financial Analyst',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const goToNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % testimonials.length), [testimonials.length]);
  const goToPrev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [goToNext]);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 z-0" />
        <div className="absolute top-1/3 -left-20 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <motion.div
          className="absolute top-20 left-10 md:left-20 text-blue-400/20 z-0"
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
        >
          <BarChart size={64} />
        </motion.div>
        <div className="z-10 w-full max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to IntelVestor <span className="text-blue-400">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
              Empower your investments with AI-driven stock predictions, sentiment analysis, and portfolio insights for Indian markets.
            </p>
            <div className="flex gap-4">
              {isSignedIn ? (
                <Link
                  to="/Insights"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
                >
                  Go to Insights <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Get Started <Sparkles className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-full hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700 relative group overflow-hidden hover:border-blue-600/50"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative z-10">
                  <motion.div
                    className="mb-6 p-3 bg-blue-900/20 inline-block rounded-2xl border border-blue-700/30"
                    whileHover={{ y: -5, rotate: [-5, 0, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 mb-6">{feature.description}</p>
                  <ul className="space-y-2 mb-6">
                    {feature.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start">
                        <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-gray-700">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center text-blue-400 font-medium hover:text-blue-300 transition-colors duration-200"
                    >
                      Learn more <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Widgets Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <div className="tradingview-widget-container my-8 flex justify-center">
            <div id="tradingview_chart"></div>
          </div>
          <div className="tradingview-widget-container my-8 flex justify-center">
            <div id="tradingview_market_overview"></div>
          </div>
          <div className="flex flex-col items-center">
            <QuoteIcon className="w-10 h-10 text-blue-400" />
            <p className="text-gray-200 italic text-center text-lg leading-relaxed">
              "{testimonials[activeIndex].content}"
            </p>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold text-white">{testimonials[activeIndex].name}</h3>
              <p className="text-blue-400 text-sm">{testimonials[activeIndex].title}</p>
            </div>
          </div>
          <div className="flex justify-center mt-8 gap-4">
            <button
              className="p-3 bg-gray-800 border border-gray-600 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white hover:border-blue-500 transition-all duration-200"
              onClick={goToPrev}
              aria-label="Previous testimonial"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              className="p-3 bg-gray-800 border border-gray-600 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white hover:border-blue-500 transition-all duration-200"
              onClick={goToNext}
              aria-label="Next testimonial"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;