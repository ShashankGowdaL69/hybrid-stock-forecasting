import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Brain,
  MessageSquareText,
  Activity,
} from 'lucide-react';

const Home: React.FC = () => {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [horizon, setHorizon] = useState('30');

  const handleForecast = () => {
    console.log(`Forecast requested for ${symbol}, horizon: ${horizon} days`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-4">
              Stock Market Forecasting Research
            </p>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              A hybrid approach to
              <span className="block text-slate-400">
                stock price forecasting.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
              A framework combining traditional time-series modelling,
              deep learning, and financial sentiment analysis to study
              short-term stock price movements.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-slate-950 font-medium hover:bg-slate-200 transition-colors"
              >
                Open Framework
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/model-insights"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900 transition-colors"
              >
                View Methodology
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="text-slate-400" size={22} />
              <div>
                <h2 className="font-medium">Forecast Configuration</h2>
                <p className="text-sm text-slate-500">
                  Select the stock and forecast horizon.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="symbol"
                  className="block text-sm text-slate-400 mb-2"
                >
                  Stock Symbol
                </label>

                <input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-slate-500"
                  placeholder="e.g. RELIANCE"
                />
              </div>

              <div>
                <label
                  htmlFor="horizon"
                  className="block text-sm text-slate-400 mb-2"
                >
                  Forecast Horizon
                </label>

                <select
                  id="horizon"
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-slate-500"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleForecast}
              className="mt-5 w-full sm:w-auto px-5 py-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              Run Forecast
            </button>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-6">
            <p className="text-sm text-slate-500 mb-2">Current status</p>

            <h2 className="text-xl font-medium mb-3">
              Prototype Phase
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              The user interface and forecasting workflow are being
              developed first. Model training, hybrid prediction,
              sentiment integration, and explainability components
              will be connected incrementally.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="mb-6">
          <h2 className="text-xl font-medium">Framework Components</h2>
          <p className="text-sm text-slate-500 mt-1">
            The planned modelling pipeline.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/30">
            <Activity className="text-slate-400 mb-4" size={22} />
            <h3 className="font-medium">ARIMA</h3>
            <p className="text-sm text-slate-500 mt-2">
              Classical time-series forecasting component.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/30">
            <Brain className="text-slate-400 mb-4" size={22} />
            <h3 className="font-medium">LSTM</h3>
            <p className="text-sm text-slate-500 mt-2">
              Deep learning model for sequential market patterns.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/30">
            <MessageSquareText className="text-slate-400 mb-4" size={22} />
            <h3 className="font-medium">Sentiment</h3>
            <p className="text-sm text-slate-500 mt-2">
              Financial news sentiment as an additional signal.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/30">
            <BarChart3 className="text-slate-400 mb-4" size={22} />
            <h3 className="font-medium">Hybrid Model</h3>
            <p className="text-sm text-slate-500 mt-2">
              Combining model outputs into a unified forecast.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;