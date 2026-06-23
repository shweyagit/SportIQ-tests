"""
tests/eval/test_hallucination.py — Hallucination Detection Tests

Tests that SportIQ's dual analysts refuse to fabricate content when faced with:

  FAKE ENTITIES        — completely made-up players (XYZ Fakeplayer123)
  OFF-TOPIC ENTITIES   — real people who are not athletes (Salman Khan)
  AMBIGUOUS ENTITIES   — names that match a celebrity, not an athlete
  FUTURE EVENTS        — questions about events that haven't happened yet
  NONEXISTENT EVENTS   — events with false premises (Brazil in Cricket World Cup)
  CONTRADICTION TRAPS  — false premise embedded in the question (Federer 2024)
  KNOWLEDGE CUTOFF     — events beyond the model's training data (2028 Olympics)

Each test case defines:
  must-not-contain — strings that would indicate the model hallucinated
  must-contain     — strings that indicate the model correctly hedged / declined

These are output-only tests. No deepeval judge is used — assertions are
deterministic string checks, making them fast and reliable in CI.

Run with: pytest tests/eval/test_hallucination.py -v
"""

import json
from pathlib import Path

import pytest

from conftest import collect_analysis

pytestmark = pytest.mark.hallucination

# ── Load fixture ───────────────────────────────────────────────────────────────

FIXTURE_PATH = Path(__file__).parents[2] / "fixtures" / "hallucination-inputs.json"
CASES: dict = json.loads(FIXTURE_PATH.read_text())


def _all_cases():
    return [pytest.param(name, data, id=name) for name, data in CASES.items()]


def _get_full_response(question: str, sport: str) -> str:
    """Collect full response (both analysts) as a single lowercase string."""
    result = collect_analysis(question, sport)
    return (result["tactician"] + " " + result["statistician"]).lower()


# ── Must-not-contain — model must not hallucinate ─────────────────────────────

class TestHallucinationMustNotContain:
    """
    Verify the model does NOT produce fabricated content.
    A hit on any must-not-contain term means the model hallucinated.
    """

    @pytest.mark.parametrize("name,data", _all_cases())
    def test_does_not_hallucinate(self, name, data):
        """
        The response must not contain terms that signal fabricated content.

        Examples:
          - "batting average" for a fake cricketer — model invented stats
          - "won the 2030" for a future event — model stated speculation as fact
          - "Federer defeated" for a retired player — model validated a false premise
        """
        forbidden = data.get("must-not-contain", [])
        if not forbidden:
            pytest.skip(f"[{name}] No must-not-contain terms defined")

        response = _get_full_response(data["question"], data["sport"])

        violations = [term for term in forbidden if term.lower() in response]

        assert not violations, (
            f"[{name}] HALLUCINATION DETECTED — type: {data['type']}\n"
            f"Risk: {data.get('risk', 'unknown')} | "
            f"Severity: {data.get('severity-if-fails', 'unknown')}\n"
            f"Expected behaviour: {data.get('expected-behaviour', '')}\n"
            f"Forbidden terms found in response: {violations}\n"
            f"Response excerpt: {response[:500]!r}"
        )


# ── Must-contain — model must hedge / decline correctly ───────────────────────

class TestHallucinationMustContain:
    """
    Verify the model DOES produce the expected hedge or refusal language.
    These terms confirm the model recognised the hallucination risk and handled it.
    """

    @pytest.mark.parametrize("name,data", _all_cases())
    def test_contains_correct_hedging(self, name, data):
        """
        The response must contain at least one term showing the model
        correctly declined, corrected the premise, or expressed uncertainty.

        Examples:
          - "don't recognise" for a fake player
          - "retired" for the Federer contradiction trap
          - "cannot confirm" for a post-cutoff event
        """
        required = data.get("must-contain", [])
        if not required:
            pytest.skip(f"[{name}] No must-contain terms defined")

        response = _get_full_response(data["question"], data["sport"])

        matched = [term for term in required if term.lower() in response]

        assert matched, (
            f"[{name}] MISSING HEDGE — type: {data['type']}\n"
            f"Risk: {data.get('risk', 'unknown')}\n"
            f"Expected behaviour: {data.get('expected-behaviour', '')}\n"
            f"None of the required hedge terms found: {required}\n"
            f"Response excerpt: {response[:500]!r}"
        )


# ── Must-contain-one-of — at least one hedging phrase required ────────────────

class TestHallucinationMustContainOneOf:
    """
    Some cases only require at least one hedging phrase from a list
    rather than all of them. Used for future-event scenarios where the
    model might use different hedging language (likely / could / might / etc.)
    """

    @pytest.mark.parametrize("name,data", _all_cases())
    def test_contains_at_least_one_hedge(self, name, data):
        """
        For future events, the model can use any hedging language.
        We just need to confirm it's not presenting speculation as fact.
        """
        one_of = data.get("must-contain-one-of", [])
        if not one_of:
            pytest.skip(f"[{name}] No must-contain-one-of terms defined")

        response = _get_full_response(data["question"], data["sport"])

        matched = [term for term in one_of if term.lower() in response]

        assert matched, (
            f"[{name}] NO HEDGING LANGUAGE FOUND — type: {data['type']}\n"
            f"Expected at least one of: {one_of}\n"
            f"Response excerpt: {response[:500]!r}"
        )
