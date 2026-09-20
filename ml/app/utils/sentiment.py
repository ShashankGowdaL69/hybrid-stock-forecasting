import os
import statistics
from urllib.parse import quote

import feedparser
import yfinance as yf
from dotenv import load_dotenv
from transformers import pipeline
from google import genai
from google.genai import types
import json


load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        ".env"
    )
)


SENTIMENT_MODEL = (
    "mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis"
)


def compute_sentiment(symbol: str) -> dict:
    """
    Fetch recent financial news for a stock and calculate
    an aggregated financial sentiment score.

    Score range:
        -1 = strongly negative
         0 = neutral
        +1 = strongly positive
    """

    try:
        # Resolve the Indian stock ticker to its company name.
        ticker = yf.Ticker(f"{symbol}.NS")

        company_name = (
            ticker.info.get("longName")
            or ticker.info.get("shortName")
            or symbol
        )

        # Search Google News for the resolved company name.
        query = quote(f'"{company_name}"')

        rss_url = (
            f"https://news.google.com/rss/search"
            f"?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
        )

        feed = feedparser.parse(rss_url)

        articles = [
            entry
            for entry in feed.entries
            if not any(
                source in entry.title.lower()
                for source in [
                    "facebook.com",
                    "instagram.com",
                    "x.com",
                    "twitter.com",
                    "youtube.com",
                ]
            )
        ][:10]

        if not articles:
            return {
                "score": 0.0,
                "headlines": ["No recent news found."],
                "posts": [],
                "trends": [],
            }

        # Use article title + RSS summary as input to the
        # financial sentiment model.
        texts = [
            entry.title
            for entry in articles
        ]

        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=SENTIMENT_MODEL,
        )

        results = sentiment_pipeline(texts)

        scores = []

        for result in results:
            label = result["label"].lower()
            confidence = float(result["score"])

            if label == "positive":
                scores.append(confidence)

            elif label == "negative":
                scores.append(-confidence)

            else:
                scores.append(0.0)

        aggregated_score = (
            statistics.mean(scores)
            if scores
            else 0.0
        )

        headlines = [
            entry.title
            for entry in articles[:5]
        ]

        return {
            "score": round(float(aggregated_score), 4),
            "headlines": headlines,
            "posts": headlines,
            "trends": [
                {
                    "term": "news",
                    "frequency": len(headlines),
                },
                {
                    "term": symbol.lower(),
                    "frequency": len(headlines),
                },
            ],
        }

    except Exception as e:
        print(f"Sentiment analysis failed: {str(e)}")

        return {
            "score": 0.0,
            "headlines": ["Failed to fetch news."],
            "posts": [],
            "trends": [],
        }

def analyze_text_sentiment(text: str, symbol: str) -> dict:
    try:
        ticker = yf.Ticker(f"{symbol}.NS")

        company_name = (
            ticker.info.get("longName")
            or ticker.info.get("shortName")
            or symbol
        )

        client = genai.Client(
            api_key=os.getenv("GEMINI_API_KEY"),
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(
                    attempts=0,
                    http_status_codes=[999]
                )
            )
        )

        prompt = f"""
You are analyzing sentiment for a stock-market simulation.

Selected stock:
- Symbol: {symbol}
- Company: {company_name}

News/text entered by the user:
"{text}"

Analyze how this news could affect the selected stock.

First determine the relationship between the news and the selected company.

Pay special attention to these relationships:

1. direct_company
   The news is directly about the selected company.

2. owner_or_promoter
   The news concerns the owner, promoter, founder, or key controlling person
   of the selected company.
   This relationship is important, but should generally have less influence
   than news directly about the company.

3. parent_or_group_company
   The news concerns the parent company or another company in the same
   corporate group.

4. subsidiary
   The news concerns a subsidiary, child company, or major business
   operating under the selected company.

5. related_entity
   The news concerns another entity that has a meaningful business
   relationship with the selected company.

6. unrelated
   The news has no meaningful relationship to the selected company.

Then determine:

- sentiment_score: the underlying sentiment of the news from -1.0 to +1.0
- relevance: how strongly the news should affect the selected stock, from 0.0 to 1.0
- relationship: one of the categories above
- effective_score: sentiment_score multiplied by relevance
- label: Bullish, Bearish, or Neutral based on effective_score

Use the full continuous range when appropriate. Do NOT default to values near -1 or +1.

Guidelines for relevance:

- Direct company news can have relevance close to 1.0.
- Owner/promoter news is relevant, but should generally be less influential
  than direct company news.
- Parent/group-company and subsidiary news should generally have meaningful
  but reduced influence compared with direct company news.
- Related entities should have weaker influence.
- Unrelated news should have relevance close to 0.

Do not invent a relationship if there is insufficient basis.
If the relationship is uncertain, use a lower relevance.

Return ONLY valid JSON in exactly this format:

{{
  "sentiment_score": 0.0,
  "relevance": 0.0,
  "relationship": "direct_company",
  "effective_score": 0.0,
  "label": "Neutral"
}}
"""

        response = client.interactions.create(
            model="gemini-3.6-flash",
            input=prompt,
        )

        print("GEMINI RAW OUTPUT:")
        print(response.output_text)

        raw_output = response.output_text.strip()

        if raw_output.startswith("```"):
            raw_output = raw_output.replace("```json", "", 1)
            raw_output = raw_output.replace("```", "", 1)
            raw_output = raw_output.strip()

        result = json.loads(raw_output)

        sentiment_score = float(result["sentiment_score"])
        relevance = float(result["relevance"])

        effective_score = sentiment_score * relevance

        if effective_score > 0.05:
            direction = "Bullish"
        elif effective_score < -0.05:
            direction = "Bearish"
        else:
            direction = "Neutral"

        return {
            "score": round(effective_score, 4),
            "label": direction,
            "sentiment_score": round(sentiment_score, 4),
            "relevance": round(relevance, 4),
            "relationship": result["relationship"],
        }

    except Exception as e:
        error_message = str(e)

        print(
            f"Text sentiment analysis failed: "
            f"{type(e).__name__}: {error_message}"
        )

        if "429" in error_message or "Rate limit exceeded" in error_message:
            raise RuntimeError(
                "Gemini rate limit reached. Please try again later."
            )

        raise