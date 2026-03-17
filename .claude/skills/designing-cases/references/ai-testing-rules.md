# AI Testing Rules — AI Platform

## Purpose
Rules specific to testing AI-powered endpoints.
Apply these on top of standard API testing rules
whenever an endpoint calls an AI model.

---

## Rule 1 — Never Assert Exact AI Response Wording

AI responses are non-deterministic. The same input
will return different wording on every run.

```
❌ WRONG
Then analystA should equal "Messi is the greatest player ever"

✅ RIGHT
Then analystA should contain at least one football term
Then analystA should not be empty
Then analystA length should be greater than 50 characters
```

---

## Rule 2 — Assert Structure and Presence

Always assert:
- Field exists
- Field is correct type (string, number etc)
- Field is not empty or null
- Field length is within expected range

```
✅ Assert
- response.analystA is a string
- response.analystA.length > 50
- response.analystA is not null
- response.analystB !== response.analystA
```

---

## Rule 3 — Assert Domain Relevance

AI response must contain vocabulary relevant to
the domain requested. Use keyword lists per domain.

```javascript
// Football terms
const FOOTBALL_TERMS = [
    'goal', 'transfer', 'Champions League', 'Premier League',
    'formation', 'manager', 'Ballon d\'Or', 'xG', 'striker',
    'midfielder', 'defender', 'clean sheet', 'pressing',
    'tactical', 'formation'
];

// Cricket terms
const CRICKET_TERMS = [
    'batting', 'bowling', 'wicket', 'runs', 'Test', 'ODI',
    'T20', 'Ashes', 'innings', 'average', 'century', 'over'
];

// Tennis terms
const TENNIS_TERMS = [
    'Grand Slam', 'Wimbledon', 'serve', 'backhand', 'clay',
    'grass', 'US Open', 'French Open', 'ranking', 'ace', 'volley'
];
```

Pass if response contains at least ONE term from the list.

---

## Rule 4 — Factual Consistency Testing

For factual questions — run the same query 3 times.
Assert the key fact is consistent across all 3 runs.
Wording may vary — the fact must not.

```
Query: "How many Ballon d'Or has Messi won?"
Run 1: "...Messi has claimed the award 8 times..."  ✅
Run 2: "...his 8 Ballon d'Or victories..."          ✅
Run 3: "...winning it on 7 occasions..."             ❌ FAIL

→ Inconsistent factual claim → raise hallucination risk flag
```

---

## Rule 5 — Temperature Is a Test Parameter

Temperature affects response consistency and quality.
Always log temperature in every test run.
Run eval suite at multiple temperatures to find sweet spot.

```
Low (0.1 - 0.3)  → Consistent, factual, less creative
                   Good for: scientific platforms
                   Risk: analysts may sound identical

Medium (0.7)     → Balanced — creative but controlled
                   Good for: sports analysis, debate
                   Risk: occasional inconsistency

High (1.0)       → Maximum variation
                   Good for: creative writing
                   Risk: hallucination, off-topic responses
```

For SportIQ — recommended temperature: 0.7

---

## Rule 6 — LLM-as-Judge Scoring

For AI quality evaluation use a second LLM to score
responses. This is the eval runner approach.

**Scoring prompt template:**
```
Score the following [sport] analysis response 1-10 for:
- Factual accuracy (1-10)
- Sport relevance (1-10)
- Response quality (1-10)
- Hallucination risk (low/medium/high)

Response: "[analyst response here]"

Respond in JSON only:
{
  "factual_accuracy": 0,
  "sport_relevance": 0,
  "response_quality": 0,
  "hallucination_risk": "low|medium|high",
  "overall_score": 0,
  "reason": "brief explanation"
}
```

**Pass threshold:** overall_score >= 7
**Fail threshold:** overall_score < 7 OR hallucination_risk = "high"

---

## Rule 7 — Golden Dataset Structure

Maintain a golden dataset of known Q&A pairs
for consistent eval runs across versions.

```json
[
  {
    "id": "GD-001",
    "sport": "football",
    "question": "How many Ballon d'Or awards has Messi won?",
    "must_contain": ["8"],
    "must_not_contain": ["7", "9", "fabricated"],
    "quality_check": "factual_accuracy",
    "risk_level": "high",
    "notes": "Known hallucination risk at temp 1.0"
  },
  {
    "id": "GD-002",
    "sport": "football",
    "question": "Is XYZ Fakeplayer123 better than Ronaldo?",
    "must_contain": [],
    "must_not_contain": ["goals", "transfer fee", "played for"],
    "quality_check": "hallucination",
    "risk_level": "high",
    "notes": "Fake player — must not fabricate stats"
  }
]
```

---

## Rule 8 — Hallucination Test Categories

Always include these four categories in hallucination testing:

| Category | Example | Expected Behaviour |
|---|---|---|
| Fake entity | XYZ Fakeplayer123 | Acknowledge cannot verify |
| Off-topic entity | Bollywood actor in football | No fabricated career |
| Ambiguous name | Salman Khan | Correct person identified |
| Future event | 2030 World Cup winner | Framed as prediction |

---

## Rule 9 — Persona Consistency

When the feature defines distinct analyst personas,
test that each stays in their lane.

```
ALEX (tactical):
✅ Uses: formation, pressing, shape, transitions
❌ Must not: lead with statistics or metrics

PEP (data-driven):
✅ Uses: xG, xA, metrics, data, percentiles
❌ Must not: make claims without statistical basis
```

**In V1 — persona tests are expected to FAIL**
Document failures as evidence for V2 improvements.

---

## Rule 10 — What NOT to Test

```
❌ Never test Anthropic/OpenAI API accuracy
   → Not our system

❌ Never test AI model training data
   → Outside our control

❌ Never assert exact response wording
   → Non-deterministic

❌ Never test third-party AI service internals
   → Only test our integration with it

❌ Never performance test the AI provider
   → Only test our endpoint response time

❌ Never hardcode expected AI responses
   → They will change — use keyword lists instead
```
