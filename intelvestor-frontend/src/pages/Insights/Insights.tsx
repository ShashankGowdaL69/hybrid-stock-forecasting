import { useEffect } from 'react';



const Insights = () => {
  useEffect(() => {
    const scriptChart = document.createElement('script');
    scriptChart.src = 'https://s3.tradingview.com/tv.js';
    scriptChart.async = true;
    scriptChart.onload = () => {
      if ((window as { TradingView?: unknown }).TradingView) {
        new ((window as { TradingView: { widget: new (config: unknown) => unknown } }).TradingView.widget)({
          width: '100%',
          height: 500,
          symbol: 'BSE:RELIANCE',
          interval: 'D',
          timezone: 'Asia/Kolkata',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          withDateRanges: true,
          hide_side_toolbar: false,
          details: true,
          hotlist: true,
          calendar: true,
          container_id: 'tradingview_chart',
        });
      }
    };
    document.body.appendChild(scriptChart);

    const scriptOverview = document.createElement('script');
    scriptOverview.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    scriptOverview.async = true;
    scriptOverview.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '12M',
      showChart: true,
      locale: 'en',
      largeChartUrl: '',
      isTransparent: false,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      width: '100%',
      height: '400',
      plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
      plotLineColorFalling: 'rgba(41, 98, 255, 1)',
      gridLineColor: 'rgba(42, 46, 57, 0)',
      scaleFontColor: 'rgba(134, 142, 150, 1)',
      belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
      belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
      belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
      symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
      tabs: [
        {
          title: 'Indices',
          symbols: [
            { s: 'BSE:SENSEX' },
            { s: 'NSE:NIFTY' },
            { s: 'BSE:BANKEX' },
          ],
          originalTitle: 'Indices',
        },
        {
          title: 'Futures',
          symbols: [
            { s: 'CME_MINI:ES1!' },
            { s: 'CME:6E1!' },
          ],
          originalTitle: 'Futures',
        },
      ],
    });
    const overviewContainer = document.getElementById('tradingview_market_overview');
    if (overviewContainer) overviewContainer.appendChild(scriptOverview);

    return () => {
      document.body.removeChild(scriptChart);
      if (overviewContainer) {
        overviewContainer.removeChild(scriptOverview);
        overviewContainer.innerHTML = '';
      }
      const chartContainer = document.getElementById('tradingview_chart');
      if (chartContainer) chartContainer.innerHTML = '';
    };
  }, []);

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">Stock Chart</h3>
          <div className="tradingview-widget-container">
            <div id="tradingview_chart" className="w-full"></div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">Market Overview</h3>
          <div className="tradingview-widget-container">
            <div id="tradingview_market_overview" className="w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
