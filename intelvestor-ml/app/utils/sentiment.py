from transformers import pipeline
from newsapi import NewsApiClient
import os
import statistics

def compute_sentiment(symbol):
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        # Return mock sentiment data when API key is missing
        return {
            "score": 0.2, 
            "headlines": [f"Mock: {symbol} shows positive momentum in recent trading"],
            "posts": [f"Investors optimistic about {symbol}'s future prospects"],
            "trends": [{"term": "earnings", "frequency": 10}, {"term": "growth", "frequency": 8}]
        }
    
    newsapi = NewsApiClient(api_key=api_key)
    try:
        articles = newsapi.get_everything(q=symbol, language='en', sort_by='publishedAt', page_size=10)
        if not articles or not articles.get('articles'):
            return {
                "score": 0, 
                "headlines": ["No recent news found"],
                "posts": ["No social posts available"],
                "trends": []
            }
            
        texts = [article['title'] + ' ' + (article['description'] or '') for article in articles['articles']]
        sentiment_pipeline = pipeline("sentiment-analysis", model="mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis")
        results = sentiment_pipeline(texts)
        scores = [res['score'] if res['label'] == 'positive' else -res['score'] for res in results]
        aggregated_score = statistics.mean(scores) if scores else 0
        
        headlines = [article['title'] for article in articles['articles'][:5]]
        
        return {
            "score": aggregated_score, 
            "headlines": headlines,
            "posts": headlines,  # Use headlines as posts for social insights
            "trends": [{"term": "news", "frequency": len(headlines)}, {"term": symbol.lower(), "frequency": len(headlines)}]
        }
    except Exception as e:
        print(f"Sentiment analysis failed: {str(e)}")
        return {
            "score": 0, 
            "headlines": ["Failed to fetch news"],
            "posts": ["Error fetching social data"],
            "trends": []
        }