import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        ".env"
    )
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        retry_options=types.HttpRetryOptions(
            attempts=0,
            http_status_codes=[999]
        )
    )
)


def generate_shap_explanation(
    symbol: str,
    feature_values: dict,
    shap_values: list
) -> str:

    prompt = f"""
    You are explaining the recent market behaviour of a stock to a
    person with minimal stock-market knowledge.

    Stock: {symbol}

    Here are the actual technical indicators calculated from the
    stock's recent historical data:

    {feature_values}

    Here are the SHAP contributions calculated for the XGBoost model:

    {shap_values}

    Write a concise, natural-language explanation of what these
    numbers suggest about the stock's recent behaviour.

    Follow these rules carefully:

    1. Talk directly about the STOCK and its observed recent
    behaviour. Avoid repeatedly saying "the model sees",
    "the model predicts", or similar phrases.

    2. Use the actual values provided. Do not make up values,
    events, news, causes, or other information.

    3. Explain technical indicators in plain language for someone
    who may not know what RSI, SMA, MACD, Bollinger Bands, or
    trading volume mean.

    4. Do not merely translate SHAP values into phrases such as
    "strong positive influence", "moderate negative influence",
    or "the feature pushed the prediction higher". Instead,
    use the SHAP results to identify which observations are most
    relevant, and explain what those actual observations mean
    for the stock.

    5. Connect related indicators when the supplied values support
    doing so. For example, if the current price is below recent
    moving averages, explain what that means in terms of the
    stock's recent price behaviour. If volume is substantially
    different from its recent average, explain what that indicates
    about recent trading activity.

    6. Be cautious and descriptive rather than predictive. Describe
    the stock as showing signs of a particular behaviour rather
    than declaring that a trend or direction is definitely occurring.
    Prefer wording such as "shows signs of", "may suggest",
    "may indicate", or "is consistent with". For example, say
    "shows signs of weaker recent price behaviour" rather than
    "is experiencing a downward trend". Do not say that the stock
    WILL rise, WILL fall, or is definitely going up or down.

    7. Do not claim causation. In particular, do not say that one
    indicator caused a price movement. Higher volume, for example,
    can indicate increased trading activity but does not by itself
    establish why the price moved.

    8. Do not describe RSI as "buying interest" or "investor interest".
    Explain it in terms of the relative strength of recent upward
    and downward price movements.

    9. Do not give investment advice or recommend buying, selling,
    or holding the stock.

    10. Focus on the 3-4 most meaningful observations supported by
        both the actual feature values and the SHAP results. Do not
        unnecessarily explain every feature.

    11. The explanation should read naturally as a short paragraph,
        not as a list of features.

    12. The explanation should describe the stock's current/recent
        situation without turning those observations into a prediction
        about its future direction.

    13. SHAP values represent how individual features contributed to
        this particular XGBoost prediction relative to the model's
        baseline. They indicate model contribution, not causation.
        Do not overemphasize this technical detail in the user-facing
        explanation unless it is necessary for clarity.

    Return only the explanation text. Do not use a heading, bullet
    points, markdown, or introductory phrases such as "Here is the
    explanation:".
    """

    try:
        response = client.interactions.create(
            model="gemini-3.6-flash",
            input=prompt
        )

        return response.output_text.strip()

    except Exception as e:
        print(
            f"SHAP explanation generation failed: "
            f"{type(e).__name__}: {str(e)}"
        )

        return (
            "The model's SHAP analysis identified the most relevant "
            "technical factors, but a natural-language explanation "
            "could not be generated at this time."
        )