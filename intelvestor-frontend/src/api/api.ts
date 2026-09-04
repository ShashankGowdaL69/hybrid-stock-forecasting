import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const getPrediction = async (symbol: string, horizon: number, token: string) => {
  console.log(`Fetching prediction for symbol: ${symbol}`); // Debug log
  if (!symbol || symbol.includes('{') || symbol.includes('}')) {
    throw new Error('Invalid symbol provided');
  }
  const response = await axios.get(`/api/stocks/${encodeURIComponent(symbol)}/predict`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { horizon }
  });
  return response.data;
};

export const getPortfolio = async (token: string) => {
  const response = await axios.get('/api/portfolio', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getSocialInsights = async (symbol: string, token: string) => {
  console.log(`Fetching social insights for symbol: ${symbol}`); // Debug log
  if (!symbol || symbol.includes('{') || symbol.includes('}')) {
    throw new Error('Invalid symbol provided');
  }
  const response = await axios.get(`/api/stocks/${encodeURIComponent(symbol)}/social`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getMarketOverview = async (token: string) => {
  const response = await axios.get('/api/market/overview', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const analyzePortfolio = async (symbols: string[], token: string) => {
  const symbolsString = symbols.join(',');
  const response = await axios.get(`/api/portfolio/analyze?symbols=${symbolsString}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};