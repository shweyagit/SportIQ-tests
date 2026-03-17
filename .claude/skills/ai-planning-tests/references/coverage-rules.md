# Coverage Rules — AI Platform API Testing

## Purpose
Decision matrix for which test type applies to which
acceptance criterion. Read this before assigning layers
in the test plan.

---

## Rule 1 — Always Test Functional If

- New endpoint is introduced
- Request schema has changed
- Response schema has changed
- Supported input values have changed (new sport added etc)
- Error response format has changed

**Layers:** Cucumber + PactumJS
**Tags:** @functional @schema @negative

---

## Rule 2 — Always Test AI Quality If

- Endpoint calls an AI model (Anthropic, OpenAI etc)
- Response contains free-text AI-generated content
- Feature promise includes quality claim
  ("analysts give different perspectives",
   "response is sport-relevant" etc)

**Layers:** JavaScript Eval Runner + LLM-as-judge
**Tags:** @ai-quality @persona
**Note:** Never use exact match assertions — AI is non-deterministic

---

## Rule 3 — Always Test Hallucination If

- Endpoint accepts free-text user input
- Input is passed directly or indirectly to an AI model
- Feature handles unknown, ambiguous or adversarial inputs

**Layers:** JavaScript Eval Runner + Golden Dataset
**Tags:** @hallucination
**Priority:** Always P1 — hallucination is a release blocker

---

## Rule 4 — Always Test Security If

- Endpoint accepts user input
- Endpoint calls an AI model
- Response includes any system or configuration data

**Must include:**
- Prompt injection — role override
- Prompt injection — system prompt reveal
- Prompt injection — jailbreak attempts
- API key exposure
- XSS payload in input
- SQL injection in input
- Oversized payload

**Layers:** Cucumber + PactumJS
**Tags:** @security
**Retry:** 0 — security failures are never transient

---

## Rule 5 — Always Test Performance If

- Performance AC exists in ticket
- Endpoint calls external AI API
  (AI latency must be accounted for in SLA)
- Endpoint is user-facing

**SLA for AI endpoints:** p95 < 10,000ms
**SLA for standard endpoints:** p95 < 3,000ms
**Layers:** k6
**Tags:** @performance

---

## Rule 6 — Skip If

| Scenario | Skip |
|---|---|
| Endpoint unchanged, existing passing tests cover it | Skip functional |
| No AI model involved | Skip ai-quality + hallucination |
| No user input | Skip security injection tests |
| No performance AC in ticket | Skip performance |
| Internal config change only | Skip all except smoke |
| Third-party service internals | Always skip — test integration only |

---

## Priority Rules

| Test Type | Default Priority | Rationale |
|---|---|---|
| Functional — happy path | P1 | Blocks release if broken |
| Schema / contract | P1 | Contract change breaks consumers |
| Negative / validation | P1 | Invalid inputs must always be handled |
| Security | P1 | Security failure is always a blocker |
| Hallucination | P1 | Trust issue — always a blocker |
| AI quality | P2 | Quality concern — not a hard blocker |
| Persona consistency | P2 | Quality concern |
| Performance | P2 | Baseline — run before release |

---

## Coverage Matrix — Quick Reference

| AC Type | Functional | Schema | Negative | Security | AI Quality | Hallucination | Performance |
|---|---|---|---|---|---|---|---|
| Returns 200 | ✅ | ✅ | | | | | |
| Response schema correct | | ✅ | | | | | |
| Missing field → 400 | | | ✅ | | | | |
| Invalid value → 400 | | | ✅ | | | | |
| Empty input → 400 | | | ✅ | | | | |
| No stack trace | | | ✅ | | | | |
| Analysts different | | | | | ✅ | | |
| Sport vocabulary | | | | | ✅ | | |
| Factual consistency | | | | | ✅ | | |
| No fabrication | | | | | | ✅ | |
| Prompt injection | | | | ✅ | | | |
| API key not exposed | | | | ✅ | | | |
| Response time SLA | | | | | | | ✅ |
| Concurrent load | | | | | | | ✅ |
