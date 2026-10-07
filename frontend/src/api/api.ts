import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

axios.defaults.baseURL = API_BASE_URL;

export const getPrediction = async (
  symbol: string,
  horizon: number
) => {
  if (!symbol || symbol.includes('{') || symbol.includes('}')) {
    throw new Error('Invalid symbol provided');
  }

  const response = await axios.post('/ml/predict', null, {
    params: {
      symbol: symbol.trim().toUpperCase(),
      horizon,
    },
  });

  return response.data;
};