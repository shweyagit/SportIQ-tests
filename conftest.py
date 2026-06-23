"""
conftest.py — SportIQ RAG Test Suite
Session-scoped fixtures shared across tests/api/ and tests/eval/

The SportIQ API is a streaming SSE endpoint:
  POST /api/analyse/stream
  Events: tactician tokens | statistician tokens | sources (per-analyst contexts) | intent

Key design decisions:
  - api_responses is session-scoped: all 8 test cases collected ONCE and reused
    across deepeval and RAGAS tests — no redundant API calls.
  - Each analyst (tactician, statistician) gets its OWN retrieved context from the RAG
    pipeline, so faithfulness is measured per-analyst not as a combined response.
  - send_request() is a plain non-streaming POST used by contract and security tests
    that expect error responses (400s) before the stream begins.
  - ClaudeJudge wraps the same model family as the app under test (claude-haiku)
    to avoid cross-model bias in LLM-as-judge evaluations.
  - Test cases split into two groups:
      Q1-Q5: Real players — verify RAG routing, quality and intent classification
      Q6-Q8: Fictional players — definitively prove RAG retrieval is working
"""

import json
import os
import sys

import anthropic
import httpx
import pytest
from deepeval.models.base_model import DeepEvalBaseLLM
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

SPORTIQ_API_URL = os.getenv("SPORTIQ_API_URL", "https://sportiq-voxv.onrender.com")


# ── SSE streaming collector ────────────────────────────────────────────────────

def collect_analysis(question: str, sport: str) -> dict:
    """
    Hits the live streaming API and collects the full response by consuming
    all SSE events until the stream closes.

    Returns:
      tactician             — full tactician response text
      statistician          — full statistician response text
      intent                — 'factual' | 'opinion' | None
      tactician_contexts    — list of snippet strings retrieved for the tactician
      statistician_contexts — list of snippet strings retrieved for the statistician
      tactician_sources     — raw source objects (title, url, snippet)
      statistician_sources  — raw source objects
    """
    tactician    = ""
    statistician = ""
    sources      = {"tactician": [], "statistician": []}
    intent       = None

    with httpx.stream(
        "POST",
        f"{SPORTIQ_API_URL}/api/analyse/stream",
        json={"question": question, "sport": sport},
        timeout=60,
        headers={"Content-Type": "application/json"},
    ) as r:
        for line in r.iter_lines():
            if not line.startswith("data: "):
                continue
            raw = line[6:].strip()
            if not raw:
                continue
            try:
                event = json.loads(raw)
                if event["type"] == "tactician":
                    tactician += event["token"]
                elif event["type"] == "statistician":
                    statistician += event["token"]
                elif event["type"] == "sources":
                    sources = event
                elif event["type"] == "intent":
                    intent = event.get("intent")
            except Exception:
                continue

    return {
        "question":              question,
        "sport":                 sport,
        "tactician":             tactician,
        "statistician":          statistician,
        "intent":                intent,
        "tactician_contexts":    [s["snippet"] for s in sources.get("tactician", [])],
        "statistician_contexts": [s["snippet"] for s in sources.get("statistician", [])],
        "tactician_sources":     sources.get("tactician", []),
        "statistician_sources":  sources.get("statistician", []),
    }


def send_request(question=None, sport=None, body=None, timeout=30) -> httpx.Response:
    """
    Non-streaming POST — used for contract and security tests expecting
    error responses (400s) before the stream begins.
    """
    payload = body if body is not None else {"question": question, "sport": sport}
    return httpx.post(
        f"{SPORTIQ_API_URL}/api/analyse/stream",
        json=payload,
        timeout=timeout,
        headers={"Content-Type": "application/json"},
    )


# ── Test cases ─────────────────────────────────────────────────────────────────
#
# Q1-Q5: Real players — cover 5 distinct RAG routing behaviours
#   Q1: both entities in KB           → HIGH faithfulness expected
#   Q2: one entity in KB              → GOOD scores expected
#   Q3: one in KB, one not            → MIXED — tests graceful partial retrieval
#   Q4: opinion question              → intent classifier must SKIP retrieval
#   Q5: broad question, multiple in KB → tests retrieval ranking
#
# Q6-Q8: Fictional players — pure RAG pipeline proof
#   Claude has zero training data on these players.
#   A correct answer can ONLY come from the seeded knowledge base.
#   If the app returns their specific seeded facts → retrieval confirmed working.
#   If it hallucinates different facts → retrieval failed.

TEST_CASES = [
    {
        "id":       "q1_messi_ronaldo",
        "question": "Who is the better dribbler, Messi or Ronaldo?",
        "sport":    "football",
        "ground_truth": (
            "Messi is widely considered the better dribbler due to his low centre of gravity, "
            "close ball control using the outside of his right foot, and rapid changes of direction. "
            "Ronaldo relies more on pace, power, and step-overs rather than tight technical dribbling."
        ),
        "expected_rag":      "HIGH — both in knowledge base",
        "rag_proof_keywords": [],
    },
    {
        "id":       "q2_bumrah",
        "question": "Is Bumrah the best death bowler in cricket history?",
        "sport":    "cricket",
        "ground_truth": (
            "Bumrah is considered one of the best death bowlers due to his unorthodox action, "
            "yorker precision, and ability to generate reverse swing. His economy rate and "
            "wicket-taking ability in the final overs of ODIs and T20s are among the best recorded."
        ),
        "expected_rag":      "GOOD — Bumrah in knowledge base",
        "rag_proof_keywords": [],
    },
    {
        "id":       "q3_sinner_alcaraz",
        "question": "How does Sinner compare to Alcaraz as the next generation of tennis?",
        "sport":    "tennis",
        "ground_truth": (
            "Sinner and Alcaraz represent the dominant next generation. Sinner is known for his "
            "baseline consistency, powerful two-handed backhand and aggressive returning. "
            "Alcaraz is more explosive with greater variety and net play. Both have won multiple Grand Slams."
        ),
        "expected_rag":      "MIXED — Sinner in KB, Alcaraz not",
        "rag_proof_keywords": [],
    },
    {
        "id":       "q4_premier_league_opinion",
        "question": "Is the Premier League ruining international football?",
        "sport":    "football",
        "ground_truth": (
            "This is a subjective debate. Arguments for: fixture congestion reduces player availability "
            "and quality for national teams. Arguments against: Premier League raises technical standards "
            "that benefit international play."
        ),
        "expected_rag":      "SKIPPED — opinion question, intent classifier should skip retrieval",
        "rag_proof_keywords": [],
    },
    {
        "id":       "q5_greatest_test_batter",
        "question": "Who is the greatest Test match batter of all time?",
        "sport":    "cricket",
        "ground_truth": (
            "Sachin Tendulkar holds the record for most Test runs (15,921) and most Test centuries (51). "
            "Don Bradman has the highest average (99.94). Kohli is the leading active batter. "
            "The debate typically centres on Tendulkar vs Bradman."
        ),
        "expected_rag":      "BROAD — multiple players in KB, retrieval must choose",
        "rag_proof_keywords": [],
    },

    # ── Fictional players — RAG retrieval proof ────────────────────────────────
    {
        "id":       "q6_devraj_nambiar",
        "question": "How does Devraj Nambiar play against left-arm pace bowling?",
        "sport":    "cricket",
        "ground_truth": (
            "Devraj Nambiar has a documented weakness against left-arm pace — he averages 28.4 against it, "
            "his lowest against any bowling category. He has been dismissed seven times in his first twelve "
            "Test innings by short balls angled into his body from right-arm pace. He takes guard on off "
            "stump rather than the standard middle-and-leg to improve his sight line against left-arm pace."
        ),
        "expected_rag":      "FICTIONAL — facts exist ONLY in knowledge base",
        "rag_proof_keywords": ["left-arm pace", "28.4", "seven times", "off stump"],
    },
    {
        "id":       "q7_lucas_ferreira",
        "question": "What was Lucas Ferreira's most famous moment in his career?",
        "sport":    "football",
        "ground_truth": (
            "Lucas Ferreira's most famous moment was in the Copa America 2025 final against Argentina in Miami. "
            "With Brazil trailing 1-0 in the 89th minute, he turned two defenders and scored a dipping right-foot "
            "shot into the top-left corner, known in Brazilian media as 'O Giro' (The Turn). Brazil won on "
            "penalties after the match ended 1-1. He was named Player of the Tournament with 3 goals and 5 assists."
        ),
        "expected_rag":      "FICTIONAL — facts exist ONLY in knowledge base",
        "rag_proof_keywords": ["O Giro", "Copa America", "89th minute", "penalties"],
    },
    {
        "id":       "q8_mika_virtanen",
        "question": "How did Mika Virtanen win Wimbledon 2025?",
        "sport":    "tennis",
        "ground_truth": (
            "Mika Virtanen won Wimbledon 2025 by defeating Carlos Alcaraz 6-4 3-6 7-6 6-4 in the final. "
            "His path included a famous semi-final against Djokovic where he saved four match points — three "
            "with aces and one with a first-serve winner — before winning the fifth-set tiebreak 10-8. "
            "He was the first Finnish player to win a Grand Slam. He hit 94 aces across the tournament."
        ),
        "expected_rag":      "FICTIONAL — facts exist ONLY in knowledge base",
        "rag_proof_keywords": ["four match points", "Finnish", "94 aces", "Djokovic"],
    },
]


# ── Session fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def api_responses():
    """
    Collect all 8 API responses once per test session.
    Session-scoped so deepeval and RAGAS tests share the same responses
    without redundant API calls.
    """
    print("\n[SETUP] Collecting API responses from live SportIQ API...")
    responses = {}
    for case in TEST_CASES:
        print(f"  -> {case['id']} ({case['sport']}): {case['question'][:60]}...")
        try:
            result = collect_analysis(case["question"], case["sport"])
            result["ground_truth"]       = case["ground_truth"]
            result["expected_rag"]       = case["expected_rag"]
            result["id"]                 = case["id"]
            result["rag_proof_keywords"] = case["rag_proof_keywords"]
            responses[case["id"]]        = result
            print(
                f"     intent={result['intent']} | "
                f"tactician_docs={len(result['tactician_sources'])} | "
                f"statistician_docs={len(result['statistician_sources'])}"
            )
            if result["rag_proof_keywords"]:
                full = result["tactician"] + result["statistician"]
                hits = [kw for kw in result["rag_proof_keywords"] if kw.lower() in full.lower()]
                print(f"     RAG proof keywords matched: {len(hits)}/{len(result['rag_proof_keywords'])} {hits}")
        except Exception as e:
            print(f"     FAILED: {e}")
            responses[case["id"]] = None

    return responses


@pytest.fixture(scope="session")
def test_cases():
    return TEST_CASES


# ── DeepEval judge — LLM-as-judge ─────────────────────────────────────────────

class ClaudeJudge(DeepEvalBaseLLM):
    """
    Wraps Claude Haiku as the judge LLM for all deepeval metrics.

    Using the same model family as the app under test avoids cross-model bias —
    a GPT-4 judge scoring Claude outputs introduces its own preferences.
    Claude judging Claude gives more consistent benchmarks.
    """

    def load_model(self):
        return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    def generate(self, prompt: str, schema=None):
        client = self.load_model()
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text

        if schema is None:
            return text

        try:
            raw = text.strip()
            if "```" in raw:
                parts = raw.split("```")
                raw = parts[1] if len(parts) > 1 else raw
                if raw.startswith("json"):
                    raw = raw[4:]
            return schema.model_validate_json(raw.strip())
        except Exception:
            return text

    async def a_generate(self, prompt: str, schema=None):
        return self.generate(prompt, schema)

    def get_model_name(self) -> str:
        return "claude-haiku-4-5-20251001"


@pytest.fixture(scope="session")
def claude_judge():
    return ClaudeJudge()


# ── RAGAS LLM — LangChain-wrapped Claude ──────────────────────────────────────

@pytest.fixture(scope="session")
def ragas_llm():
    """
    LangChain-wrapped Claude Haiku for RAGAS metrics.
    RAGAS uses LangChain's LLM interface internally, so we wrap Claude
    via langchain-anthropic to keep the evaluator on the same model family
    as the application.
    """
    from langchain_anthropic import ChatAnthropic
    from ragas.llms import LangchainLLMWrapper

    return LangchainLLMWrapper(
        ChatAnthropic(
            model="claude-haiku-4-5-20251001",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        )
    )
