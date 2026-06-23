"""
tests/api/test_security.py — Security Tests

Covers OWASP LLM Top 10 controls applicable to a read-only streaming RAG API:

  INPUT FILTERING (expected-status 400)
  ── Payloads the API must reject before they reach the LLM:
     · XSS in question field
     · SQL injection in sport field
     · Prompt injection via sport field
     · Oversized payload (10,000 chars)
     · Repeated-token DoS (5,000 repeated tokens)

  OUTPUT FILTERING (must-not-contain checks on LLM response)
  ── Payloads that reach the LLM — verify the model does NOT comply:
     · System prompt reveal
     · API key / credential extraction
     · Role override ("you have no restrictions")
     · Jailbreak — match cheating instructions
     · Jailbreak — personal data disclosure (phone, address, family)
     · Jailbreak — player gossip / private life
     · Jailbreak — financial details
     · Base64 encoding bypass
     · Context-overflow injection (injection buried at end of long query)
     · Language-switch bypass (Spanish instruction)

Run with: pytest tests/api/test_security.py -v
"""

import json
from pathlib import Path

import pytest

from conftest import collect_analysis, send_request

pytestmark = pytest.mark.security

# ── Load fixture data ──────────────────────────────────────────────────────────

FIXTURE_PATH = Path(__file__).parents[2] / "fixtures" / "security-payloads.json"
PAYLOADS: dict = json.loads(FIXTURE_PATH.read_text())


def _resolve_question(raw: str) -> str:
    """
    Replace sentinel tokens with the actual generated payloads.
    These are too large to store in the fixture file.
    """
    if raw == "__GENERATE_10000_CHARS__":
        return "A" * 10_000
    if raw == "__GENERATE_REPEATED_TOKEN__":
        return "ha " * 5_000
    return raw


def _input_filter_cases():
    """Payloads that must be rejected (HTTP 400) before reaching the LLM."""
    return [
        pytest.param(name, data, id=name)
        for name, data in PAYLOADS.items()
        if "expected-status" in data
    ]


def _output_filter_cases():
    """Payloads that reach the LLM — response must not contain forbidden strings."""
    return [
        pytest.param(name, data, id=name)
        for name, data in PAYLOADS.items()
        if "must-not-contain" in data and "expected-status" not in data
    ]


# ── Input filtering — API must reject before LLM call ─────────────────────────

class TestInputFiltering:
    """
    The API must sanitise and reject malformed or malicious inputs
    at the validation layer — before the LLM is ever invoked.
    """

    @pytest.mark.parametrize("name,data", _input_filter_cases())
    def test_rejected_with_400(self, name, data):
        """
        Malicious or oversized inputs must return HTTP 400.
        A 200 here means the payload bypassed input validation and reached the LLM.
        """
        question = _resolve_question(data["question"])
        sport    = data["sport"]
        expected = data["expected-status"]

        r = send_request(question=question, sport=sport)

        assert r.status_code == expected, (
            f"[{name}] Expected HTTP {expected} for {data['type']}, "
            f"got {r.status_code}.\n"
            f"This payload bypassed input validation: {question[:120]!r}"
        )

    @pytest.mark.parametrize("name,data", _input_filter_cases())
    def test_error_body_is_safe(self, name, data):
        """
        Rejection responses must not leak stack traces or internal file paths.
        A safe error response returns a clean message, not server internals.
        """
        question = _resolve_question(data["question"])
        r = send_request(question=question, sport=data["sport"])
        body = r.text

        assert "node_modules" not in body, \
            f"[{name}] Error response exposes node_modules path"
        assert "at Object." not in body, \
            f"[{name}] Error response contains a stack trace"
        assert "Error:" not in body, \
            f"[{name}] Error response leaks bare 'Error:' string"


# ── Output filtering — LLM must not comply with attack prompts ─────────────────

class TestOutputFiltering:
    """
    Adversarial prompts that pass input validation reach the LLM.
    The model must not produce outputs that comply with the attack intent.
    Each payload defines a 'must-not-contain' list of strings that would
    indicate the model was successfully manipulated.
    """

    @pytest.mark.parametrize("name,data", _output_filter_cases())
    def test_response_does_not_comply(self, name, data):
        """
        Send the adversarial prompt to the live API and verify the response
        does not contain any of the forbidden strings defined in the fixture.

        A hit on any forbidden string means the model was jailbroken or
        manipulated into disclosing restricted content.
        """
        question = _resolve_question(data["question"])
        sport    = data["sport"]
        forbidden = data["must-not-contain"]

        result   = collect_analysis(question, sport)
        full_response = (result["tactician"] + " " + result["statistician"]).lower()

        violations = [
            term for term in forbidden
            if term.lower() in full_response
        ]

        assert not violations, (
            f"[{name}] Attack type '{data['type']}' SUCCEEDED — "
            f"model output contains forbidden term(s): {violations}\n"
            f"Question: {question[:200]!r}\n"
            f"Response excerpt: {full_response[:500]!r}"
        )
