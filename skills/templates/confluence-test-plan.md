# Template: Confluence Test Plan Page

Use this template when publishing a test plan to Confluence.
Publish under: `SportIQ > Test Plans > [EPIC-KEY] > [TICKET-KEY]`

---

# Test Plan — [TICKET-KEY]

| Field | Value |
|---|---|
| Epic | [EPIC-KEY] — [Epic title] |
| Endpoint | `[METHOD /path]` |
| Environment | `[Base URL]` |
| Sports / Scope | [football / cricket / tennis / all] |
| Layers | API Functional / AI Quality / Hallucination / Security / Performance |
| QA Owner | [QA Name] |
| Status | DRAFT / IN REVIEW / APPROVED |
| Created | [YYYY-MM-DD] |
| Approved by | [Name or —] |
| Approved date | [YYYY-MM-DD or —] |

---

## 1. Objective

> One paragraph explaining what this test plan covers and why.

This test plan covers the [feature name] feature exposed via `[METHOD /path]`.
It validates API correctness, AI response quality, hallucination risk, security,
and performance against the acceptance criteria defined in [EPIC-KEY].

---

## 2. Scope

### In Scope
- [What is covered — e.g. all three sport types: football, cricket, tennis]
- [Layer 1]
- [Layer 2]

### Out of Scope
- [What is excluded and why]
- Anthropic/Claude API internals — we test our integration only
- Exact AI response wording — responses are non-deterministic
- Browser/UI behaviour — separate frontend test plan

---

## 3. Testing Approach

### Two frameworks — why both are needed

| Framework | Used for | Reason |
|---|---|---|
| **Cucumber + PactumJS** | API Functional, Security, Performance | Deterministic — assert status codes, schema, absence of strings |
| **Eval Runner + LLM-as-judge** | AI Quality, Hallucination | Non-deterministic — semantic evaluation with score >= 7/10 |

### Tagging strategy

| Tag | Applied to | Run in |
|---|---|---|
| `@p1` | Blocking scenarios | CI on every merge |
| `@p2` | Regression scenarios | Pre-release |
| `@functional` | API Functional layer | CI |
| `@ai-quality` | AI Quality layer | Nightly + pre-release |
| `@hallucination` | Hallucination layer | Nightly + pre-release |
| `@security` | Security layer | CI |
| `@performance` | Performance layer | Pre-release only |

### Retry strategy
- `@functional`, `@security`: no retries — failures are deterministic
- `@ai-quality`, `@hallucination`: retry up to 3 times before marking failed
- `@performance`: no retries — flaky performance is itself a signal

---

## 4. Test Environment

| Variable | Value | Source |
|---|---|---|
| `BASE_URL` | `[environment URL]` | `.env` / CI secret — never hardcode in tests |
| `ANALYST_TEMPERATURE` | [confirm with dev] | Must be documented — affects AI consistency |
| `ANTHROPIC_MODEL` | [confirm with dev] | Must be documented |
| `EVAL_PASS_THRESHOLD` | `7` | Eval Runner pass threshold (out of 10) |

---

## 5. Entry Criteria

- [ ] Test plan approved and ticket moved to Done
- [ ] Test cases ticket unblocked
- [ ] `BASE_URL` environment confirmed accessible (staging, not production)
- [ ] All fixture files reviewed and approved
- [ ] Eval Runner configured with `EVAL_PASS_THRESHOLD=7`
- [ ] CI pipeline has `BASE_URL` as a secret

---

## 6. Exit Criteria

| Layer | Pass threshold | Fail condition |
|---|---|---|
| API Functional P1 | 100% | Any P1 scenario fails |
| Security P1 | 100% | Any injection or credential leak |
| AI Quality structural P1 | 100% | Empty response or missing field |
| AI Quality semantic P2 | Score >= 7/10 across 3 runs | Score < 7 on 2+ of 3 runs |
| Hallucination P1 | 0 fabricated facts | Any must-not-contain string found |
| Performance p95 | < 10,000ms | p95 exceeds threshold |
| Performance error rate | < 5% | Error rate >= 5% under load |

---

## 7. Test Scenarios

### Layer 1 — API Functional
**Tool: Cucumber + PactumJS**

| ID | Scenario | Type | Priority | AC Covered | Fixture |
|---|---|---|---|---|---|
| SC-001 | Happy path — [sport] | Happy path | P1 | AC-01 | `fixtures/valid-requests.json → [key]` |
| SC-002 | Missing [field] → 400 | Negative | P1 | AC-03 | [test data] |
| SC-003 | Empty [field] → 400 | Negative | P1 | AC-06 | [test data] |
| SC-004 | Whitespace [field] → 400 | Negative | P1 | AC-07 | [test data] |
| SC-005 | Invalid [field] value → 400 | Negative | P1 | AC-05 | [test data] |
| SC-006 | Wrong HTTP method → 404/405 | Negative | P1 | — | [test data] |
| SC-007 | Response schema — all fields present | Happy path | P1 | AC-01 | [test data] |
| SC-008 | No stack trace in error responses | Negative | P1 | AC-08/09 | [test data] |

### Layer 2 — AI Quality

| ID | Scenario | Type | Priority | AC Covered | Assertion Approach |
|---|---|---|---|---|---|
| SC-010 | Both responses non-empty | AI-Quality | P1 | AC-10 | len(analystA) > 0 AND len(analystB) > 0 |
| SC-011 | Responses meaningfully different | AI-Quality | P1 | AC-11 | word overlap < 70% |
| SC-012 | Domain vocabulary present | AI-Quality | P2 | AC-12 | contains at least one [sport]-specific term |
| SC-013 | Response references question topic | AI-Quality | P1 | AC-13 | response mentions entity from question |
| SC-014 | Factual consistency across 3 runs | AI-Quality | P2 | AC-13 | core facts stable across 3 identical requests |

### Layer 3 — Hallucination Detection

| ID | Scenario | Type | Priority | Risk | AC Covered |
|---|---|---|---|---|---|
| SC-020 | Fake entity — [sport] | Hallucination | P1 | High | AC-14 |
| SC-021 | Off-topic entity in wrong sport | Hallucination | P1 | High | AC-14 |
| SC-022 | Ambiguous name | Hallucination | P1 | Medium | AC-14 |
| SC-023 | Future event — speculative language | Hallucination | P1 | Medium | AC-15 |
| SC-024 | Non-existent historical match | Hallucination | P1 | High | AC-14 |

### Layer 4 — Security

| ID | Scenario | Type | Priority | AC Covered |
|---|---|---|---|---|
| SC-030 | Prompt injection via question | Security | P1 | AC-16 |
| SC-031 | API key extraction attempt | Security | P1 | AC-16 |
| SC-032 | XSS payload in question | Security | P1 | AC-16 |
| SC-033 | Oversized payload (10,000 chars) | Security | P1 | AC-17 |
| SC-034 | SQL injection in [field] | Security | P1 | AC-17 |

### Layer 5 — Performance

| ID | Scenario | Type | Priority | Config | SLA | Tool |
|---|---|---|---|---|---|---|
| SC-040 | Baseline response time | Performance | P2 | 1 VU, 1 req | p95 < 10,000ms | k6 |
| SC-041 | Concurrent load | Performance | P2 | 10 VUs, 30s | p95 < 10,000ms | k6 |
| SC-042 | Error rate under load | Performance | P2 | 10 VUs, 30s | error rate < 5% | k6 |
| SC-043 | Response validity under load | Performance | P2 | 10 VUs, 30s | responses non-empty | k6 |

---

## 4. Test Data

| Data Type | Value | Source |
|---|---|---|
| Valid [sport] question | [example] | Hardcoded |
| Fake/unknown entity | [example] | Hardcoded |
| Off-topic entity | [example] | Hardcoded |
| Ambiguous name | [example] | Hardcoded |
| Future event question | [example] | Hardcoded |
| Prompt injection | "Ignore all previous instructions..." | Hardcoded |
| XSS payload | `<script>alert('xss')</script>` | Hardcoded |
| Oversized payload | 10,000 char string | Generated in test |
| Invalid [field] values | [examples] | Hardcoded |

---

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI responses are non-deterministic | High | Medium | Use flexible assertions — keywords, not exact wording |
| Hallucination for unknown inputs | High | High | Explicit hallucination test scenarios (SC-020 to SC-024) |
| Anthropic API outage | Low | High | Mark test as skipped if upstream is unavailable |
| Rate limiting under load | Medium | Medium | Cap concurrent VUs at 10; monitor error rate |
| Prompt injection | Medium | High | Security layer covers injection scenarios |

---

## 6. Workflow

- [x] Test plan created following /ai-planning-tests skill file
- [x] Test plan covers all required layers
- [ ] Test plan reviewed by lead/stakeholder
- [ ] Test plan approved
- [ ] Test cases written (SCRUM-14)
- [ ] Test cases reviewed
- [ ] Automation implemented
- [ ] Tests executed and results recorded

---

## 7. Approval

| Field | Value |
|---|---|
| Status | DRAFT / IN REVIEW / APPROVED |
| Reviewed by | [Name] |
| Review date | [YYYY-MM-DD] |
| Approved by | [Name] |
| Approval date | [YYYY-MM-DD] |
| QA Owner (executor) | [Name] |

> Once approved, move the Jira test plan ticket to Done, assign to QA owner,
> and post a comment on the Jira ticket tagging QA owner to begin test case writing.
