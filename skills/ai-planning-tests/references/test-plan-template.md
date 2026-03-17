# Test Plan — [TICKET_ID]
## [Feature Name] | [ENDPOINT] | [Version]

---

| Field | Detail |
|---|---|
| Test Plan ID | [TICKET_ID]-TP |
| Feature | [Feature Name] |
| Parent Epic | [EPIC_ID] |
| Test Plan Ticket | [SUBTASK_ID] |
| Version | [V1 / V2] |
| Prepared By | QA Engineer |
| Status | DRAFT |
| Date | [Date] |

---

## 1. Introduction

[Brief overview of the feature being tested.
What does it do? Why does it exist?
What is the scope of this test plan?]

---

## 2. Test Objectives

### General Objectives
- [Objective 1]
- [Objective 2]
- [Objective 3]

### By Testing Type

| Testing Type | Objective |
|---|---|
| Functional | [objective] |
| Schema / Contract | [objective] |
| Negative | [objective] |
| AI Quality | [objective] |
| Hallucination | [objective] |
| Security | [objective] |
| Performance | [objective] |

---

## 3. Scope

### In Scope
- [Endpoint]
- [Sports / domains covered]
- [Test types covered]

### Out of Scope

| Item | Reason |
|---|---|
| [Item] | [Why excluded] |
| [Item] | [Why excluded] |

---

## 4. Testing Approach

### Methodology
- [Methodology — BDD, API-first etc]

### Test Types and Tools

| Test Type | Tool | Layer |
|---|---|---|
| Functional | Cucumber + PactumJS | API |
| Schema / Contract | Cucumber + PactumJS | API |
| Negative / Validation | Cucumber + PactumJS | API |
| Security | Cucumber + PactumJS | API |
| AI Quality | JavaScript Eval Runner + LLM-as-judge | Eval |
| Hallucination Detection | JavaScript Eval Runner + Golden Dataset | Eval |
| Persona Consistency | JavaScript Eval Runner | Eval |
| Performance | k6 | Performance |

### Why Two Frameworks
[Explain why Cucumber handles deterministic tests
and Eval Runner handles non-deterministic AI tests]

### Gherkin Style
All scenarios written in declarative style.
See /ai-designing-cases/references/feature-file-rules.md

### Tagging Strategy
```
@functional @negative @schema @security
@ai-quality @hallucination @persona @performance
@p1 @p2 @p3
@football @cricket @tennis
```

---

## 5. Test Scenarios

### 5.1 Functional — Happy Path
`@functional @p1`

| ID | Scenario | AC |
|---|---|---|
| SC-001 | [scenario] | [AC ref] |

---

### 5.2 Negative and Validation
`@negative @p1`

| ID | Scenario | AC |
|---|---|---|
| SC-010 | [scenario] | [AC ref] |

---

### 5.3 Schema and Contract
`@schema @p1`

| ID | Scenario | AC |
|---|---|---|
| SC-020 | [scenario] | [AC ref] |

---

### 5.4 Security
`@security @p1`

| ID | Scenario | AC |
|---|---|---|
| SC-030 | [scenario] | [AC ref] |

---

### 5.5 AI Quality — Eval Runner
`@ai-quality @p2`

| ID | Scenario | Eval Criteria | Pass Threshold |
|---|---|---|---|
| SC-040 | [scenario] | [criteria] | [threshold] |

---

### 5.6 Hallucination Detection — Eval Runner
`@hallucination @p1`

| ID | Scenario | Risk | Known Bug |
|---|---|---|---|
| SC-050 | [scenario] | High/Med/Low | Yes/No |

---

### 5.7 Persona Consistency — Eval Runner
`@persona @p2`

| ID | Scenario | Eval Criteria |
|---|---|---|
| SC-060 | [scenario] | [criteria] |

---

### 5.8 Performance — k6
`@performance @p2`

| ID | Scenario | Config | SLA |
|---|---|---|---|
| SC-070 | [scenario] | [vus, duration] | [SLA] |

---

## 6. Test Data

| Data | Value | Source |
|---|---|---|
| [data type] | [value or reference] | fixtures/[file].json |

See /test-data/fixtures/ for all test data files.
See /eval/golden_dataset.json for eval runner data.

---

## 7. Test Environment

| Field | Detail |
|---|---|
| Base URL | ${BASE_URL} |
| Environment | [staging / production] |
| Auth required | [Yes / No] |
| AI Provider | Anthropic Claude API |
| Temperature | ${ANALYST_TEMPERATURE} — configurable |
| System prompt | [V1 / V2 — describe] |
| Postman Collection | [filename] |

### Environment Setup Steps
1. Confirm API is running — GET /api/health returns 200
2. Confirm all GitHub secrets and variables are set
3. Confirm test data fixtures are populated
4. Confirm k6 is installed for performance tests
5. Confirm Node.js dependencies installed — npm ci

---

## 8. Test Deliverables

| Deliverable | When | Location |
|---|---|---|
| Test plan | Before test cases | Confluence — [path] |
| Cucumber feature files | After approval | GitHub — /features/api/ |
| Eval runner scripts | After approval | GitHub — /eval/ai_quality/ |
| Golden dataset | After approval | GitHub — /eval/golden_dataset.json |
| k6 scripts | After approval | GitHub — /performance/ |
| Bug reports | During execution | Jira |
| Test execution report | After execution | ReportPortal + Jira |

---

## 9. Entry Criteria

Testing must not begin until ALL of the following are true:

- [ ] Test plan reviewed and approved
- [ ] Test plan published to Confluence
- [ ] API is running — GET /api/health returns 200
- [ ] All GitHub secrets and variables confirmed
- [ ] Test data fixtures confirmed
- [ ] Dependencies installed — npm ci passes
- [ ] ReportPortal project configured

---

## 10. Exit Criteria

Testing is complete when ALL of the following are true:

- [ ] 100% of P1 Cucumber test cases executed
- [ ] 95% pass rate on P1 functional and schema tests
- [ ] 100% pass rate on P1 security tests
- [ ] Eval runner executed — all AI quality scenarios scored
- [ ] All hallucination scenarios documented with evidence
- [ ] k6 performance baseline recorded
- [ ] All P1 bugs raised in Jira with reproduction steps
- [ ] No P1 bugs open without triage decision
- [ ] Test execution report published to ReportPortal

---

## 11. Risks and Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| AI responses non-deterministic | High | Eval runner runs 3x — majority pass |
| Anthropic API latency | Medium | SLA set to 10,000ms |
| Rate limiting | Medium | Stagger concurrent tests |
| Environment instability | Medium | Health check before suite |
| [AI platform specific risk] | [severity] | [mitigation] |

---

## 12. What NOT to Test

| Item | Reason |
|---|---|
| Anthropic API accuracy | Not our system |
| AI model training data | Outside our control |
| Exact AI response wording | Non-deterministic |
| UI / frontend behaviour | Separate epic |
| Other endpoints | Out of scope |

---

## 13. Approval

| Action | Status | Date |
|---|---|---|
| Test plan reviewed | ⬜ Pending | |
| Test plan approved | ⬜ Pending | |
| Published to Confluence | ⬜ Pending | |
| Jira subtask updated | ⬜ Pending | |

---

*Once approved this document will be attached to [SUBTASK_ID] in Jira
and published to Confluence under [PROJECT] > Test Plans > [TICKET_ID]*
