import axios from 'axios';

axios.defaults.baseURL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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