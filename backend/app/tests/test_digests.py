import pytest
from unittest.mock import MagicMock, patch

from app.services import ai as ai_service


@patch("app.services.ai.genai.Client")
def test_generate_digest_success(mock_client_class):
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value.text = (
        "This is a mock digest content from Gemini."
    )
    mock_client_class.return_value = mock_client

    metrics = {"some": "data"}
    res = ai_service.generate_digest(metrics, "mock-api-key")

    assert res == "This is a mock digest content from Gemini."

    mock_client_class.assert_called_once_with(api_key="mock-api-key")
    mock_client.models.generate_content.assert_called_once()


def test_generate_digest_missing_key():
    with pytest.raises(ValueError, match="Gemini API key is required"):
        ai_service.generate_digest({"some": "data"}, "")


@patch("app.services.ai.genai.Client")
def test_generate_bottleneck_explanation_success(mock_client_class):
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value.text = (
        "This contributor is bottlenecked due to many pending reviews."
    )
    mock_client_class.return_value = mock_client

    contributor_data = {
        "login": "testuser",
        "pending_reviews": 5,
        "avg_pending_days": 3.2,
    }

    res = ai_service.generate_bottleneck_explanation(
        contributor_data,
        "mock-api-key",
    )

    assert (
        res
        == "This contributor is bottlenecked due to many pending reviews."
    )

    mock_client_class.assert_called_once_with(api_key="mock-api-key")
    mock_client.models.generate_content.assert_called_once()


@patch("app.services.ai.genai.Client")
def test_ai_service_exception_translation(mock_client_class):
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception(
        "API limit exceeded"
    )
    mock_client_class.return_value = mock_client

    with pytest.raises(RuntimeError, match="Gemini API call failed"):
        ai_service.generate_digest({"some": "data"}, "mock-api-key")