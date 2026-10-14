
import React from 'react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import {
  ArrowRight,
  Activity,
  BarChart3,
  Brain,
  Layers3,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const Home: React.FC = () => {
  const frameworkRef = useRef<HTMLElement>(null);
  const components = [
    {
      icon: Activity,
      title: 'ARIMA',
      description:
        'Statistical time-series forecasting that models patterns in historical closing prices.',
    },
    {
      icon: Brain,
      title: 'LSTM',
      description:
        'A recurrent neural network that learns temporal patterns from sequences of historical prices.',
    },
    {
      icon: TrendingUp,
      title: 'XGBoost',
      description:
        'Gradient-boosted decision trees trained on market data and technical indicators.',
    },
    {
      icon: Layers3,
      title: 'Stacking Ensemble',
      description:
        'Combines ARIMA, LSTM, and XGBoost predictions using a trained XGBoost meta-model.',
    },
    {
      icon: MessageSquareText,
      title: 'News Sentiment',
      description:
        'Analyzes financial news with sentiment classification and recency-weighted aggregation.',
    },
    {
      icon: BarChart3,
      title: 'SHAP Explainability',
      description:
        'Explains feature contributions to XGBoost predictions using SHAP.',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-slate-950 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300 mb-7">
              <Activity size={15} className="text-emerald-400" />
              Machine Learning · Financial Forecasting
            </div>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              A hybrid framework for
              <span className="block text-slate-400">
                stock market forecasting.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
              Explore Indian stock price forecasts powered by ARIMA, LSTM,
              and XGBoost stacking, complemented by financial-news sentiment
              analysis and interpretable model predictions.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/predictions"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-slate-950 font-medium hover:bg-slate-200 transition-colors"
              >
                Go to Predictions
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={() =>
                  frameworkRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900 transition-colors"
              >
                View Framework
              </button>
            </div>
          </div>
        </div>
      </section>

      
      {/* Project overview */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="mb-7">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500 mb-2">
            Key capabilities
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            What the framework offers
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Explore the forecasting models, financial sentiment analysis,
            and explainability techniques integrated into the application.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-5">
            <TrendingUp className="text-slate-400 mb-4" size={24} />
            <h2 className="font-medium">Multi-model Forecasting</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Compare statistical, deep-learning, and gradient-boosting
              approaches to stock price prediction.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-5">
            <MessageSquareText className="text-slate-400 mb-4" size={24} />
            <h2 className="font-medium">Financial Sentiment</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Analyze recent financial news and apply a recency-weighted
              sentiment adjustment to forecasts.
            </p>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-5">
            <ShieldCheck className="text-slate-400 mb-4" size={24} />
            <h2 className="font-medium">Evaluation & Explainability</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Evaluate predictions using chronological validation and inspect
              XGBoost feature contributions with SHAP.
            </p>
          </div>
        </div>
      </section>

      {/* Framework components */}
      <section
        ref={frameworkRef}
        id="framework"
        className="max-w-6xl mx-auto px-6 pb-16 scroll-mt-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 mb-2">
              Under the hood
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Inside the framework
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              A forecasting pipeline that combines complementary models
              with financial-news analysis and model explainability.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component) => {
            const Icon = component.icon;

            return (
              <div
                key={component.title}
                className="border border-slate-800 rounded-xl bg-slate-900/30 p-6 hover:bg-slate-900/60 hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-5">
                  <Icon className="text-slate-300" size={21} />
                </div>

                <h3 className="font-medium text-white">
                  {component.title}
                </h3>

                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {component.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Home;
