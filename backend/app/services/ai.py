import logging
import time
from typing import Any, Dict
from google import genai
from google.genai.errors import APIError

logger = logging.getLogger(__name__)

# Model cascade order for reliability
PRIMARY_MODEL = "gemini-3.5-flash"
FALLBACK_MODELS = ["gemini-3.5-flash-lite"]


def _call_gemini_with_retry(
    prompt: str,
    api_key: str,
    max_retries: int = 3,
    initial_delay: float = 2.0,
) -> str:
    """
    Executes content generation using the modern google-genai SDK
    with exponential backoff and fallback model support.
    """
    client = genai.Client(api_key=api_key)
    models_to_try = [PRIMARY_MODEL] + FALLBACK_MODELS

    for model_name in models_to_try:
        delay = initial_delay

        for attempt in range(1, max_retries + 1):
            try:
                logger.debug(f"Calling model '{model_name}' (Attempt {attempt}/{max_retries})")
                
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )

                if response and response.text:
                    return response.text.strip()

                raise RuntimeError("Gemini API returned an empty response.")

            except APIError as e:
                # Catch 429 Rate Limits / Quotas
                if e.code == 429:
                    logger.warning(
                        f"Rate limit (429) on model '{model_name}' (Attempt {attempt}/{max_retries}). "
                        f"Retrying in {delay}s..."
                    )
                    if attempt < max_retries:
                        time.sleep(delay)
                        delay *= 2
                        continue
                    else:
                        logger.error(f"Quota exhausted for '{model_name}'. Trying fallback...")
                        break
                
                # If model is not found (404), fall back immediately
                elif e.code == 404:
                    logger.warning(f"Model '{model_name}' returned 404. Switching to fallback...")
                    break
                else:
                    logger.error(f"Gemini API Error ({e.code}) with model '{model_name}': {e.message}")
                    break

            except Exception as e:
                logger.error(f"Unexpected error with model '{model_name}': {str(e)}")
                break

    raise RuntimeError("All Gemini API model attempts failed. Check API key status or quotas.")


def generate_digest(metrics: Dict[str, Any], api_key: str) -> str:
    """
    Takes structured metrics data and a Gemini API key.
    Formats the metrics into a prompt and calls Gemini.
    """
    if not api_key:
        raise ValueError("Gemini API key is required.")

    prompt = (
        "You are a senior engineering manager reviewing the team's engineering metrics.\n"
        f"Here are the metrics for the current period:\n{metrics}\n\n"
        "Please write a 3-paragraph plain-English summary of team activity based on these metrics.\n"
        "Follow these rules strictly:\n"
        "- Be specific about numbers (mention actual cycle times and counts).\n"
        "- Flag anything that looks like a bottleneck.\n"
        "- Do not use bullet points, headers, or markdown formatting (no asterisks, no bolding).\n"
        "- Keep it under 200 words.\n"
        "- Be direct and actionable."
    )

    try:
        return _call_gemini_with_retry(prompt=prompt, api_key=api_key)
    except Exception as e:
        logger.error(f"Gemini API error during digest generation: {str(e)}")
        raise RuntimeError(f"Gemini API call failed: {str(e)}") from e


def generate_bottleneck_explanation(contributor_data: Dict[str, Any], api_key: str) -> str:
    """
    Generates a context-aware plain-English explanation of why a contributor is flagged.
    """
    if not api_key:
        raise ValueError("Gemini API key is required.")

    login = contributor_data.get("login", "Contributor")
    prompt = (
        f"Analyze the pending review data for contributor '{login}':\n"
        f"{contributor_data}\n\n"
        "Generate a context-aware plain-English explanation of why they are flagged as a bottleneck.\n"
        "Follow these rules strictly:\n"
        f"- Name the contributor specifically as '{login}'.\n"
        "- State exactly how many PRs are waiting for their review.\n"
        "- State the average wait time in days.\n"
        "- Compare to their previous period if previous period data is provided.\n"
        "- Keep it under 80 words.\n"
        "- Do not use markdown formatting (no bolding, no headers, no asterisks, no list items).\n"
        "- Sound like a neutral observation, not a criticism."
    )

    try:
        return _call_gemini_with_retry(prompt=prompt, api_key=api_key)
    except Exception as e:
        logger.error(f"Gemini API error during bottleneck explanation generation: {str(e)}")
        raise RuntimeError(f"Gemini API call failed: {str(e)}") from e