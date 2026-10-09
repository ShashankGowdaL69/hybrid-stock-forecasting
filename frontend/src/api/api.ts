import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

axios.defaults.baseURL = API_BASE_URL;

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const getPrediction = async (
  symbol: string,
  horizon: number,
  token: string
) => {
  if (!symbol || symbol.includes('{') || symbol.includes('}')) {
    throw new Error('Invalid symbol provided');
  }

  const response = await axios.get(
    `/api/stocks/${encodeURIComponent(
      symbol.trim().toUpperCase()
    )}/predict`,
    {
      headers: authHeaders(token),
      params: {
        horizon,
      },
    }
  );

  return response.data;
};

export const getCurrentUser = async (token: string) => {
  const response = await axios.get('/api/users/me', {
    headers: authHeaders(token),
  });

  return response.data;
};

export const getWatchlist = async (token: string) => {
  const response = await axios.get('/api/users/watchlist', {
    headers: authHeaders(token),
  });

  return response.data;
};

export const getMarketData = async (
  symbol: string,
  token: string
) => {
  const response = await axios.get('/api/market-data', {
    headers: authHeaders(token),
    params: {
      symbol: symbol.trim().toUpperCase(),
    },
  });

  return response.data;
};

export const addToWatchlist = async (
  symbol: string,
  token: string
) => {
  try {
    const response = await axios.post(
      `/api/users/watchlist/${encodeURIComponent(
        symbol.trim().toUpperCase()
      )}`,
      null,
      {
        headers: authHeaders(token),
      }
    );

    return {
      added: true,
      alreadyExists: false,
      data: response.data,
    };
  } catch (error: unknown) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 409
    ) {
      return {
        added: false,
        alreadyExists: true,
        data: error.response.data,
      };
    }

    throw error;
  }
};

export const removeFromWatchlist = async (
  symbol: string,
  token: string
) => {
  const response = await axios.delete(
    `/api/users/watchlist/${encodeURIComponent(
      symbol.trim().toUpperCase()
    )}`,
    {
      headers: authHeaders(token),
    }
  );

  return response.data;
};

export const getForecastHistory = async (
  token: string
) => {
  const response = await axios.get('/api/users/history', {
    headers: authHeaders(token),
  });

  return response.data;
};

export const saveForecastHistory = async (
  history: {
    symbol: string;
    horizon: number;
    currentPrice: number;
    finalForecast: number;
    expectedChange: number;
    sentimentScore: number;
    ensembleMape: number;
  },
  token: string
) => {
  const response = await axios.post(
    '/api/users/history',
    history,
    {
      headers: authHeaders(token),
    }
  );

  return response.data;
};