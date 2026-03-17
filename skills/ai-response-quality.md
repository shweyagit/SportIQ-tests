---
name: ai-response-quality
description: |
  Evaluates AI responses for quality — relevance, depth, persona adherence,
  and factual consistency. Uses LLM-as-judge scoring 1-10.
  Called by the eval runner for every @ai-quality and @persona scenario.
  Distinct from hallucination-guard — this skill scores quality, not fabrication.
disable-model-invocation: true
---

# Skill: AI Response Quality

## Purpose
Score AI response quality across four dimensions:
sport relevance, response depth, persona adherence, factual consistency.
Pass threshold: overall score >= 7.
This is not a hallucination check — use hallucination-guard for that.

---

## WHAT CROSSES THE LINE

These are quality failures. Score <= 4 or immediate FAIL.

### Sport Relevance
```
❌ CROSSES THE LINE
- Response contains no sport-specific vocabulary
- Response discusses a different sport than requested
  e.g. football question → cricket answer
- Response is generic life advice with no sports context
- Response is entirely off-topic
- Response discusses sport in general with no reference
  to the specific question asked

✅ DOES NOT CROSS THE LINE
- Response uses at least one sport-specific term
- Response stays within the requested sport domain
- Response addresses the specific question asked
- Response may be brief — length alone is not a failure
```

---

### Response Depth
```
❌ CROSSES THE LINE
- Response is fewer than 50 characters
- Response is a single word or single sentence with no analysis
- Response restates the question without answering it
- Response says only "I don't know" with no attempt at analysis
- Both analysts give responses of fewer than 50 characters

✅ DOES NOT CROSS THE LINE
- Response is concise but contains a clear analytical point
- Response acknowledges uncertainty but still engages
- Response may vary in length — quality matters, not word count
- One analyst shorter than the other — not a failure by itself
```

---

### Persona Adherence — ALEX (Tactical)
```
❌ CROSSES THE LINE
- ALEX leads with statistics or metrics as primary argument
- ALEX uses "xG", "xA", "percentile" as core reasoning
- ALEX sounds identical to PEP
- ALEX makes no reference to tactical concepts

✅ DOES NOT CROSS THE LINE
- ALEX mentions a statistic in passing to support a tactical point
- ALEX uses numbers to illustrate — not as the main argument
- ALEX's primary framing is tactical — formation, shape, pressing
```

---

### Persona Adherence — PEP (Data-Driven)
```
❌ CROSSES THE LINE
- PEP makes a claim without any statistical basis
- PEP uses purely emotional or narrative reasoning
- PEP sounds identical to ALEX
- PEP makes no reference to data or metrics

✅ DOES NOT CROSS THE LINE
- PEP uses narrative to contextualise a data point
- PEP references data that supports a broader argument
- PEP's primary framing is data — metrics, percentiles, averages
```

---

### Analyst Differentiation
```
❌ CROSSES THE LINE
- analystA and analystB responses have word overlap > 70%
- Both analysts reach the same conclusion via the same reasoning
- Both responses are structurally identical — different wording only
- Responses are copy-paste with synonyms swapped

✅ DOES NOT CROSS THE LINE
- Analysts agree on conclusion but via different reasoning
- Some shared vocabulary — sport terms will overlap naturally
- Different emphasis, different evidence, different framing
```

---

### Factual Consistency
```
❌ CROSSES THE LINE
- Same factual claim stated differently across 3 runs
  e.g. "8 Ballon d'Or" in run 1, "7" in run 2
- Key number changes between runs
- Contradicts verified fact in golden dataset

✅ DOES NOT CROSS THE LINE
- Wording varies across runs — expected
- Emphasis or framing varies — expected
- Additional context added in one run but not another
- Opinion or analysis differs between runs — non-deterministic by design
```

---

## SCORING GUIDE

| Dimension | Weight | What to Score |
|---|---|---|
| Sport relevance | 25% | Is the response on topic for the sport? |
| Response depth | 25% | Does it contain analytical content? |
| Persona adherence | 25% | Does each analyst stay in their lane? |
| Analyst differentiation | 25% | Are the perspectives genuinely different? |

Score each dimension 1–10.
Overall = weighted average.
Pass = overall >= 7.
Fail = overall < 7.

---

## SCORING PROMPT — LLM-as-Judge

Send this to the judge model (not Claude — use a different model):

```
You are a quality evaluator for an AI sports analysis platform.
Score the following response 1-10 on each dimension.
Respond in JSON only — no preamble, no markdown.

Sport: [sport]
Question: [question]
AnalystA: [response]
AnalystB: [response]

Dimensions:
- sport_relevance: Does the response stay on topic for [sport]?
- response_depth: Does the response contain real analytical content?
- persona_differentiation: Are the two analysts genuinely different?
- factual_plausibility: Are the claims plausible for a real [sport] analyst?

{
  "sport_relevance": 0,
  "response_depth": 0,
  "persona_differentiation": 0,
  "factual_plausibility": 0,
  "overall": 0,
  "pass": true | false,
  "reason": "one sentence"
}
```

---

## WHAT NOT TO DO IN EVALUATION

```
❌ Do not score hallucination here
   → Use hallucination-guard for fabrication
   → This skill scores quality only

❌ Do not assert exact wording
   → "response should say Messi won 8 Ballon d'Or"
   → Non-deterministic — wrong every time

❌ Do not fail a response for being too short
   → Length alone is not a failure
   → 60 characters of relevant analysis > PASS
   → 500 characters of off-topic content > FAIL

❌ Do not require both analysts to disagree
   → Analysts can reach the same conclusion
   → Failure is identical reasoning — not identical conclusion

❌ Do not use Claude to judge Claude responses
   → Self-evaluation bias
   → Use a different model as judge — GPT-4 or rule-based scoring

❌ Do not run quality eval without logging temperature
   → Score without temperature = useless data
   → Always attach ANALYST_TEMPERATURE to the result

❌ Do not treat persona failure as hallucination
   → ALEX sounding like PEP = quality issue
   → ALEX inventing a career = hallucination
   → Different skills — different failures

❌ Do not PASS a response that scores 7 on one dimension
   but 2 on another
   → Overall score is the gate — not any single dimension
   → Overall < 7 = FAIL regardless of individual highs
```

---

## RESULT FORMAT

```json
{
  "scenario_id": "SC-040",
  "sport": "football",
  "temperature": 0.7,
  "scores": {
    "sport_relevance": 0,
    "response_depth": 0,
    "persona_differentiation": 0,
    "factual_plausibility": 0,
    "overall": 0
  },
  "pass": true | false,
  "threshold": 7,
  "reason": "one sentence",
  "flag": "persona_drift | off_topic | low_depth | null"
}
```

---

## INTEGRATION

Called by:
- eval runner — for every @ai-quality and @persona scenario

References:
- `ai-planning-tests/references/ai-testing-rules.md`
  → scoring prompt structure, temperature strategy, LLM-as-judge rules
