export declare const API_BASE_URL: any;
export declare const getPrediction: (symbol: string, horizon: number, token: string) => Promise<any>;
export declare const getCurrentUser: (token: string) => Promise<any>;
export declare const getWatchlist: (token: string) => Promise<any>;
export declare const addToWatchlist: (symbol: string, token: string) => Promise<any>;
export declare const removeFromWatchlist: (symbol: string, token: string) => Promise<any>;
export declare const getForecastHistory: (token: string) => Promise<any>;
export declare const saveForecastHistory: (history: {
    symbol: string;
    horizon: number;
    currentPrice: number;
    finalForecast: number;
    expectedChange: number;
    sentimentScore: number;
    ensembleMape: number;
}, token: string) => Promise<any>;
