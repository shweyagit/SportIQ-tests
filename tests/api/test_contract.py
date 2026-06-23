"""
tests/api/test_contract.py — API Contract and Schema Tests

Validates that the streaming SSE endpoint behaves correctly:
  - Returns the right HTTP status codes
  - Streams all expected event types (tactician, statistician, sources, intent)
  - Rejects invalid inputs before the stream begins
  - Never leaks stack traces or internal file paths in error responses

These tests are fast and deterministic — no LLM calls, no API key needed.
Run on every PR: pytest tests/api/
"""

import re

import httpx
import pytest

from conftest import SPORTIQ_API_URL, collect_analysis, send_request

pytestmark = pytest.mark.contract


# ── Streaming contract ─────────────────────────────────────────────────────────

class TestStreamingContract:

    def test_endpoint_returns_200_for_valid_request(self):
        """SSE endpoint should accept a valid request and start streaming."""
        with httpx.stream(
            "POST",
            f"{SPORTIQ_API_URL}/api/analyse/stream",
            json={"question": "Who is the best striker in football?", "sport": "football"},
            timeout=60,
            headers={"Content-Type": "application/json"},
        ) as r:
            assert r.status_code == 200, \
                f"Expected 200 for valid request, got {r.status_code}"

    def test_response_contains_tactician_content(self):
        """Tactician event tokens should arrive and build a non-empty response."""
        result = collect_analysis("Who is the best striker in football?", "football")
        assert result["tactician"], "No tactician tokens received from stream"
        assert len(result["tactician"]) >= 100, \
            f"Tactician response too short: {len(result['tactician'])} chars"

    def test_response_contains_statistician_content(self):
        """Statistician event tokens should arrive and build a non-empty response."""
        result = collect_analysis("Who is the best striker in football?", "football")
        assert result["statistician"], "No statistician tokens received from stream"
        assert len(result["statistician"]) >= 100, \
            f"Statistician response too short: {len(result['statistician'])} chars"

    def test_response_contains_intent_event(self):
        """Intent classification event must be present in every stream."""
        result = collect_analysis("Who is the best striker in football?", "football")
        assert result["intent"] is not None, \
            "No intent event received — intent classifier may not be running"

    def test_sources_returned_for_factual_question(self):
        """
        A factual question about a known player should trigger retrieval
        and return context snippets in the sources event.
        """
        result = collect_analysis("Who is the better dribbler, Messi or Ronaldo?", "football")
        total = len(result["tactician_contexts"]) + len(result["statistician_contexts"])
        assert total > 0, \
            "No context snippets returned for factual question — RAG retrieval may have failed"

    @pytest.mark.parametrize("sport", ["football", "cricket", "tennis"])
    def test_all_supported_sports_return_200(self, sport):
        """All three supported sports must return a valid streaming response."""
        questions = {
            "football": "Who is the best striker?",
            "cricket":  "Who is the best Test batsman?",
            "tennis":   "Who has the best serve?",
        }
        with httpx.stream(
            "POST",
            f"{SPORTIQ_API_URL}/api/analyse/stream",
            json={"question": questions[sport], "sport": sport},
            timeout=60,
            headers={"Content-Type": "application/json"},
        ) as r:
            assert r.status_code == 200, \
                f"Expected 200 for sport='{sport}', got {r.status_code}"


# ── Input validation ───────────────────────────────────────────────────────────

class TestInputValidation:

    def test_missing_question_returns_400(self):
        r = send_request(body={"sport": "football"})
        assert r.status_code == 400, \
            f"Missing question should return 400, got {r.status_code}"

    def test_missing_sport_returns_400(self):
        r = send_request(body={"question": "Who is the best striker?"})
        assert r.status_code == 400, \
            f"Missing sport should return 400, got {r.status_code}"

    def test_empty_question_returns_400(self):
        r = send_request(question="", sport="football")
        assert r.status_code == 400, \
            f"Empty question should return 400, got {r.status_code}"

    def test_whitespace_only_question_returns_400(self):
        r = send_request(question="   ", sport="football")
        assert r.status_code == 400, \
            f"Whitespace question should return 400, got {r.status_code}"

    def test_empty_sport_returns_400(self):
        r = send_request(question="Who is the best striker?", sport="")
        assert r.status_code == 400, \
            f"Empty sport should return 400, got {r.status_code}"

    def test_empty_body_returns_400(self):
        r = send_request(body={})
        assert r.status_code == 400, \
            f"Empty body should return 400, got {r.status_code}"

    @pytest.mark.parametrize("sport", ["basketball", "rugby", "baseball"])
    def test_unsupported_sport_returns_400(self, sport):
        """SportIQ only supports football, cricket and tennis."""
        r = send_request(question="Who is the best player?", sport=sport)
        assert r.status_code == 400, \
            f"Unsupported sport '{sport}' should return 400, got {r.status_code}"

    def test_wrong_http_method_not_500(self):
        """GET on a POST-only endpoint should return 404 or 405, never 500."""
        r = httpx.get(f"{SPORTIQ_API_URL}/api/analyse/stream", timeout=10)
        assert r.status_code in (404, 405), \
            f"Expected 404 or 405 for GET request, got {r.status_code}"


# ── Error response safety ──────────────────────────────────────────────────────

class TestErrorResponseSafety:

    def test_error_response_has_no_stack_trace(self):
        """
        Error responses must never expose server-side stack traces.
        Stack traces reveal implementation details and server file paths.
        """
        r = send_request(body={})
        assert not re.search(r'at \w[\w.]* \(.*:\d+:\d+\)', r.text), \
            "Error response contains a stack trace"
        assert "Error:" not in r.text, \
            "Error response contains bare 'Error:' string"

    def test_error_response_has_no_internal_file_paths(self):
        """Error responses must not expose server directory structure."""
        r = send_request(body={})
        assert "node_modules" not in r.text, \
            "Error response exposes node_modules path"
        assert not re.search(r'/home/|/Users/|[A-Z]:\\', r.text), \
            "Error response exposes internal file path"
