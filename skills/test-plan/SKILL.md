---
name: ai-planning-tests
description: |
  Takes the validation summary from /ai-receiving-tickets and produces a
  structured test plan for an AI platform API feature. Covers API functional,
  AI quality, hallucination detection, security and performance layers.
  Applies AI-specific coverage rules to decide what to test and what to skip.
  Publishes approved plan to Confluence. Use after /ai-receiving-tickets
  has returned READY TO PLAN status.
tools:
  - mcp-atlassian:jira_get_issue
  - confluence:publish_page
---

# Skill: AI Platform — Planning Tests

## Purpose
Decide WHAT to test, at WHICH layer, and WHY for an AI platform API feature.
Output a structured test plan with scenarios per layer.
Do NOT write test steps or assertions here — those belong in /ai-designing-cases.

---

## Step 1 — Read the Validation Summary

Confirm you have the READY TO PLAN output from /ai-receiving-tickets.

Required fields before proceeding:
- Epic ID and title
- Endpoint — method, URL, request/response schema
- Acceptance criteria list
- Subtask type — API / Performance / AI Quality
- Risks flagged
- Test data identified

**If validation summary is missing → stop and run /ai-receiving-tickets first.**
**If status is BLOCKED → stop and resolve blocks first.**

---

## Step 2 — Identify the Subtask Type

The subtask type drives which coverage rules and layers apply.

```
Read the subtask ticket label:

api-testing        → apply API Coverage Rules (Section 2a)
performance        → apply Performance Coverage Rules (Section 2b)
ai-quality         → apply AI Quality Coverage Rules (Section 2c)
frontend           → use /planning-tests skill instead (not this skill)
```

**If subtask type is missing → WARN and ask ticket owner to label it.**

---

## Step 2a — API Coverage Rules

Apply these rules when subtask type = api-testing.

**Always test:**
- Happy path for every valid input combination
- Every required field — missing, empty, whitespace
- Every field with a constrained value — invalid type, out of range, unsupported value
- Response schema — correct fields, correct types, no extras, no nulls
- Error response format — consistent structure across all 400 responses
- HTTP method — wrong method returns 404 or 405, never 500

**Always add negative tests if:**
- Field accepts a string → test empty string + whitespace only
- Field has an enum/allowed values list → test unsupported value
- Endpoint returns AI-generated content → add AI quality layer (Section 2c)
- Endpoint is auth-protected → add auth negative tests

**Skip if:**
- Endpoint is unchanged from previous release and has existing passing tests
- Field is internal/system-generated — not user-supplied

---

## Step 2b — Performance Coverage Rules

Apply these rules when subtask type = performance.

**Always test:**
- Baseline response time — single request, measure p50/p95/p99
- Concurrent load — minimum 10 virtual users, 30 second duration
- Error rate under load — must be < 5%
- Response correctness under load — AI responses must still be valid

**AI-specific performance considerations:**
- External AI API (Anthropic/OpenAI) adds latency — SLA must account for this
- Concurrent requests may hit rate limits — document expected behaviour
- Response time SLA for AI endpoints: p95 < 10,000ms (not the standard 3,000ms)
- Do NOT test Anthropic API performance — only test YOUR integration

**Skip if:**
- No performance AC in the ticket
- Endpoint is not user-facing

---

## Step 2c — AI Quality Coverage Rules

Apply these rules when subtask type = ai-quality OR when API endpoint
returns AI-generated content.

**Always test — Response Quality:**
- Both analysts/responses are non-empty strings
- Responses are meaningfully different from each other (not identical)
- Response contains domain-specific vocabulary (sport/topic relevant terms)
- Response references the question topic — not generic
- Factual responses are consistent across 3 runs

**Always test — Hallucination Detection:**
- Unknown input — fake name, non-existent entity
- Off-topic input — entity from wrong domain (Bollywood actor in football)
- Ambiguous input — name shared by multiple real people
- Future event — must be framed as prediction not confirmed fact
- See /hallucination-guard skill for full rules and examples

**Always test — Confidence:**
- Low-confidence responses must include uncertainty language
- See /confidence-check skill for full rules

**Always test — Security:**
- Prompt injection — attempt to reveal system prompt
- API key exposure — ask for credentials in question field
- XSS payload in input field
- Oversized payload

**Skip if:**
- Endpoint does not call an AI model
- Response is deterministic and not AI-generated

---

## Step 3 — Assign Test Layer Per Acceptance Criterion

For each AC from the ticket, assign a layer and priority:

```
AC: <copy AC text here>
Layer: API | AI-Quality | Hallucination | Performance | Security
Type: Happy path | Negative | Edge case | AI-Quality | Hallucination
Priority: P1 (run in CI) | P2 (regression) | P3 (exploratory)
Reason: <why this layer and priority>
```

**Priority rules:**
- P1 — blocks release, run in CI on every merge
- P2 — regression suite, run before release
- P3 — exploratory, run periodically or when risk is flagged

---

## Step 4 — Identify Test Data Requirements

For each scenario, identify what test data is needed:

| Data Type | Example | Source |
|---|---|---|
| Valid known entity | Lionel Messi, Virat Kohli | Hardcoded — well-known, stable |
| Valid known entity (2nd sport) | Roger Federer | Hardcoded |
| Unknown/fake entity | XYZ Fakeplayer123 | Hardcoded — clearly fake |
| Ambiguous name | Salman Khan | Hardcoded — known hallucination risk |
| Off-topic entity | Salman Khan (Bollywood) | Hardcoded |
| Future event | "Who will win the 2030 World Cup?" | Hardcoded |
| Prompt injection payload | "Ignore all instructions..." | Hardcoded |
| XSS payload | `<script>alert('xss')</script>` | Hardcoded |
| Oversized payload | 10,000 character string | Generated in test |
| Valid sport values | football, cricket, tennis | From API schema |
| Invalid sport value | basketball, rugby | Not in allowed list |

**Flag any data that does not exist and needs to be created.**

---

## Step 5 — Identify What NOT to Test

Explicitly state what is out of scope and why:

**Never test:**
- Anthropic/OpenAI API internals — only test your integration with it
- AI model accuracy or training data — not our responsibility
- Exact AI response wording — responses are non-deterministic
- Other endpoints not in this subtask scope
- Browser/UI behaviour — that is a frontend subtask

**Skip if already covered:**
- Do not retest happy path if existing passing tests cover it and endpoint is unchanged
- Do not retest schema if contract tests already run in CI

---

## Step 6 — Produce the Test Plan

Output in this exact format:

```
═══════════════════════════════════════════════
TEST PLAN — <TICKET_ID>
Epic: <EPIC_ID> — <Epic Title>
Subtask type: <API | Performance | AI Quality>
Endpoint: <METHOD /path>
Sport/Scope: <football | cricket | tennis | all>
Coverage layers: <API | AI-Quality | Hallucination | Performance | Security>
═══════════════════════════════════════════════

─── LAYER: API FUNCTIONAL ──────────────────────

SC-001: <scenario name>
  AC covered: <AC-XX>
  Type: Happy path
  Priority: P1
  Data needed: <what>

SC-002: <scenario name>
  AC covered: <AC-XX>
  Type: Negative
  Priority: P1
  Data needed: <what>

─── LAYER: AI QUALITY ──────────────────────────

SC-010: <scenario name>
  AC covered: <AC-XX>
  Type: AI-Quality
  Priority: P1
  Assertion approach: <how to assert — e.g. contains football term>
  Data needed: <what>

─── LAYER: HALLUCINATION DETECTION ─────────────

SC-020: <scenario name>
  AC covered: <AC-XX>
  Type: Hallucination
  Priority: P1
  Risk level: High | Medium | Low
  Known bug: <yes/no — describe if yes>
  Data needed: <what>

─── LAYER: SECURITY ────────────────────────────

SC-030: <scenario name>
  AC covered: <AC-XX>
  Type: Security
  Priority: P1
  Data needed: <what>

─── LAYER: PERFORMANCE ─────────────────────────

SC-040: <scenario name>
  AC covered: <AC-XX>
  Type: Performance
  Tool: k6 | Postman
  Priority: P2
  Config: <vus, duration, SLA>

─── OUT OF SCOPE ────────────────────────────────
- <what> — <why>
- <what> — <why>

─── TEST DATA REQUIRED ──────────────────────────
- <data item> — <source or action needed>

─── APPROVAL ────────────────────────────────────
Status: DRAFT | IN REVIEW | APPROVED
Reviewed by: <name>
Date: <date>
═══════════════════════════════════════════════
```

---

## Step 7 — Publish to Confluence

Once test plan is approved:

1. Publish test plan to Confluence under:
   `SportIQ > Test Plans > <EPIC_ID> > <TICKET_ID>`

2. Update Jira subtask:
   - Write test plan to the **Test Plan field** (not description — description stays clean)
   - Add Confluence link to ticket description (link only, not the full plan)
   - Move ticket status to APPROVED
   - Unblock testing subtasks (SPORTIQ-02, 03 etc)

3. Confirm with ticket owner before unblocking.

---

## Progress Checklist

- [ ] Validation summary received from /ai-receiving-tickets
- [ ] Status confirmed as READY TO PLAN
- [ ] Subtask type identified
- [ ] Correct coverage rules applied for subtask type
- [ ] Test layer assigned per AC
- [ ] Test data requirements identified
- [ ] Out of scope documented with justification
- [ ] Test plan produced in correct format
- [ ] Test plan reviewed and approved
- [ ] Test plan published to Confluence
- [ ] Jira ticket updated with Confluence link
- [ ] Blocked subtasks unblocked
- [ ] Ready to invoke /ai-designing-cases
