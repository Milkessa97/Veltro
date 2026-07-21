import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from fastapi import status
from app.services import ai as ai_service
from app.services import digest as digest_service
from app.models.digest import Digest
from app.models.repositories import Repositories
from app.models.contributors import Contributors


@patch("google.generativeai.GenerativeModel")
@patch("google.generativeai.configure")
def test_generate_digest_success(mock_configure, mock_gen_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.return_value.text = "This is a mock digest content from Gemini flash 2.0."
    mock_gen_model_class.return_value = mock_model

    metrics = {"some": "data"}
    res = ai_service.generate_digest(metrics, "mock-api-key")

    assert res == "This is a mock digest content from Gemini flash 2.0."
    mock_configure.assert_called_once_with(api_key="mock-api-key")
    mock_gen_model_class.assert_called_once_with("gemini-2.0-flash")


def test_generate_digest_missing_key():
    with pytest.raises(ValueError, match="Gemini API key is required"):
        ai_service.generate_digest({"some": "data"}, "")


@patch("google.generativeai.GenerativeModel")
@patch("google.generativeai.configure")
def test_generate_bottleneck_explanation_success(mock_configure, mock_gen_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.return_value.text = "This contributor is bottlenecked due to many pending reviews."
    mock_gen_model_class.return_value = mock_model

    contributor_data = {"login": "testuser", "pending_reviews": 5, "avg_pending_days": 3.2}
    res = ai_service.generate_bottleneck_explanation(contributor_data, "mock-api-key")

    assert res == "This contributor is bottlenecked due to many pending reviews."
    mock_configure.assert_called_once_with(api_key="mock-api-key")
    mock_gen_model_class.assert_called_once_with("gemini-2.0-flash")


def test_ai_service_exception_translation():
    with patch("google.generativeai.configure", side_excel=Exception("API limit exceeded")):
        with pytest.raises(RuntimeError, match="Gemini API call failed"):
            ai_service.generate_digest({"some": "data"}, "mock-api-key")
