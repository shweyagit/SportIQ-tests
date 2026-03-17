# API Best Practices — AI Platform Testing (Planning)

## Purpose
Planning-level standards for API testing on an AI platform.
Tells you WHAT to cover in the test plan — not HOW to assert.
Assertion detail lives in /ai-designing-cases/references/test-case-rules.md

---

## 1. What to Cover — Always

For every AI platform API endpoint include all of these
in the test plan scope:

| Coverage Area | Why |
|---|---|
| Schema / Contract | Any deviation from contract is a bug |
| Input validation | Every field type must be tested for invalid input |
| Error response format | Errors must be consistent and descriptive |
| HTTP method handling | Wrong method must never return 500 |
| Security — injection | AI endpoints are injection targets |
| Security — credential exposure | API keys must never appear in responses |
| AI quality | AI endpoints have quality promises to verify |
| Hallucination detection | Free-text AI input creates hallucination risk |
| Performance SLA | AI latency is outside our control — must be planned for |

---

## 2. Contract Testing

The API contract = documented request/response schema.
Deviation from contract = bug, even if feature appears to work.

Plan tests for:
- Request schema — correct fields accepted, incorrect rejected
- Response schema — correct fields returned, no extras
- Error response schema — consistent format across all 400s
- HTTP methods — wrong method returns 405 not 500

---

## 3. Input Validation — What to Plan

Plan negative scenarios for every field.
Detail of what to assert is in /ai-designing-cases/references/test-case-rules.md

For every string field plan:
- Valid value — happy path
- Missing field
- Empty string
- Whitespace only
- Oversized payload

For every enum field plan:
- Valid value — happy path
- Invalid value not in allowed list
- Missing field

---

## 4. HTTP Status Codes — What to Plan

| Scenario | Expected Status |
|---|---|
| Successful response | 200 |
| Missing required field | 400 |
| Invalid field value | 400 |
| Wrong HTTP method | 405 |
| Endpoint not found | 404 |
| Oversized payload | 400 — never 500 |

Plan a scenario for each. How to assert is in designing.

---

## 5. Response Time SLA

| Endpoint Type | p95 SLA |
|---|---|
| Standard API | < 3,000ms |
| AI-powered endpoint | < 10,000ms |
| Health check | < 500ms |

AI endpoints get higher SLA — external AI API latency
is outside our control. Always document this in the plan.

---

## 6. Security — What to Plan

Must plan all of these for every AI endpoint:

| Scenario | Category |
|---|---|
| Prompt injection — role override | OWASP LLM01 |
| Prompt injection — system prompt reveal | OWASP LLM01 |
| Prompt injection — jailbreak | OWASP LLM01 |
| API key exposure | OWASP LLM06 |
| XSS payload in input | Input handling |
| SQL injection in input | Input handling |
| Oversized payload | Input handling |

See /ai-designing-cases/references/hallucination-inputs.md
for full payload list.

---

## 7. Test Data — Planning Rules

Never hardcode test data in the test plan.
Always reference fixture file and key name.

```
/test-data/fixtures/
├── valid-requests.json
├── invalid-requests.json
├── security-payloads.json
└── hallucination-inputs.json

/eval/golden_dataset.json
```

In the test plan write:
✅ "Load from fixtures/valid-requests.json — football-question"
❌ "Send question: Is Mbappe worth his transfer fee?"

---

## 8. Retry Strategy — What to Plan

| Test Type | Retry | Reason |
|---|-------|---|
| Functional | 1     | Transient API/network failures |
| AI Quality | 2     | Non-deterministic — reduces false negatives |
| Security | 0     | Security failure is always real |
| Performance | 0     | Timing sensitive |

Document retry strategy in test plan Section 4.

---

## 9. What NOT to Plan

```
❌ Anthropic/OpenAI API internals — not our system
❌ AI model training data — outside our control
❌ Exact AI response wording — non-deterministic
❌ Third-party service internals — test integration only
❌ Frontend/UI behaviour — separate epic
❌ Other endpoints not in this ticket scope
❌ Browser compatibility — API only
```
