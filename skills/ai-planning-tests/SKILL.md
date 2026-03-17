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
  - mcp-atlassian:jira_update_issue
  - confluence:publish_page
---

# Skill: AI Platform — Planning Tests

## Purpose
Decide WHAT to test, at WHICH layer, and WHY for an AI platform API feature.
Output a structured test plan with scenarios per layer.
Do NOT write test steps or assertions here — those belong in /ai-designing-cases.

---

## Jira Workflow — Status Transitions

Use these transition IDs when updating ticket status via the Jira REST API:

| Transition | ID | When to use |
|---|---|---|
| In Progress | 21 | When test planning begins (if not already set by /ai-receiving-tickets) |
| In Review | 31 | After test plan is written — DoD #1 met |
| Done | 41 | After test plan is reviewed and approved — DoD #2 met |

**Transition API call:**
```
POST /rest/api/3/issue/<TICKET_ID>/transitions
{ "transition": { "id": "<ID>" } }
```

**Assign ticket API call:**
```
PUT /rest/api/3/issue/<TICKET_ID>
{ "fields": { "assignee": { "accountId": "<QA_ACCOUNT_ID>" } } }
```

**Add comment (tag QA) API call:**
```
POST /rest/api/3/issue/<TICKET_ID>/comment
```
Use ADF format to mention QA by accountId in the comment body.

---

## Definition of Done

**DoD #1 — Test planning complete**
- Test plan is written, all 5 layers covered
- Test plan written into the Jira ticket **Test Plan field** (not description — description stays clean)
- Ticket transitions: In Progress → **In Review**
- Perform this transition immediately after writing the test plan to Jira

**DoD #2 — Test plan reviewed and approved**
- Test plan signed off by lead or stakeholder
- Ticket transitions: In Review → **Done**
- Ticket assigned to the QA who executed the planning
- Comment posted on the Jira ticket tagging the QA:
  > "Test plan for [EPIC-KEY] is approved and ready. @[QA Name] please proceed
  >  with writing test cases on [TICKET-KEY] (test cases ticket)."

---

---

## Step 1 — Read the Validation Summary and Set Status to In Progress

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

**If test plan ticket is still in To Do (not yet set to In Progress by
/ai-receiving-tickets), transition it now before proceeding:**

```
POST /rest/api/3/issue/<TEST_PLAN_TICKET_ID>/transitions
{ "transition": { "id": "21" } }
```

---

## Guardrails — Hard BLOCKs that apply to every test plan

These are non-negotiable. A plan that violates any of these must be corrected
before it can move to In Review. Do not proceed past the guardrail check.

---

**BLOCK 1 — Testing Approach section must be present and complete**
The plan must include all three of these or it is BLOCKED:
- Framework split: which layers use Cucumber+PactumJS, which use Eval Runner+LLM-as-judge, and WHY
- Tagging strategy: every tag listed with what it covers and when it runs
- Retry strategy: explicit retry count per tag — `@security: 0`, `@functional: 2`, `@ai-quality: 3`, `@hallucination: 3`, `@performance: 0`
- ❌ BLOCK if any of the three sub-sections are missing

**BLOCK 2 — Entry Criteria must list operational gates, not workflow steps**
Entry criteria = what must be TRUE in the environment before a test can run.
Required items for any AI endpoint plan:
- Health check on BASE_URL passes
- All CI secrets configured (BASE_URL, ANTHROPIC_MODEL)
- ANALYST_TEMPERATURE confirmed and documented
- Eval Runner configured with EVAL_RUNNER_TEMPERATURES and EVAL_PASS_THRESHOLD
- Fixture files present and reviewed
- Staging environment confirmed (not production)
- ❌ BLOCK if Entry Criteria is empty or contains only workflow items

**BLOCK 3 — Exit Criteria must contain measurable pass thresholds only**
Exit criteria = numbers. Not workflow. Not approvals.
Required thresholds for AI endpoint plans:
- API Functional P1: 100%
- Security P1: 100% — zero injection or credential leaks
- AI Quality structural P1: 100%
- AI Quality semantic P2: Eval Runner score >= 7/10 at all three temperatures
- Hallucination P1: zero fabricated facts
- Performance p95: < 10,000ms for AI endpoints
- Performance error rate: < 5% under load
- ❌ BLOCK if Exit Criteria has no numeric thresholds
- ❌ BLOCK if Exit Criteria contains workflow items like "plan approved" or "SCRUM-14 unblocked"

**BLOCK 4 — Temperature must be in the environment section for any AI endpoint**
For any endpoint that calls an AI model:
- `ANALYST_TEMPERATURE` must appear in the environment table — even if undocumented (flag it as BLOCK)
- `EVAL_RUNNER_TEMPERATURES` must be documented: `0.3, 0.7, 1.0`
- Explain WHY three temperatures: to surface instability across the model's behaviour range
- ❌ BLOCK if temperature is not mentioned at all in the environment section

**BLOCK 5 — Hallucination assertions must be pure absence checks**
No positive assertions on AI wording. Ever.
- ✅ `must NOT contain: goals, assists, club name, career record`
- ✅ `must NOT contain: confirmed winner, "will definitely", past tense result`
- ❌ `response notes mismatch` — positive assertion, non-deterministic
- ❌ `expresses uncertainty` — positive assertion, non-deterministic
- ❌ `uncertainty language OR no fabricated stats` — mixed; the "OR" means positive assertion can satisfy it
Every hallucination scenario must have an explicit, named `must-not-contain` list. Nothing else.

**BLOCK 6 — Performance SLA must use AI endpoint threshold**
For any endpoint that calls an AI model:
- Performance SLA must be set to p95 < 10,000ms — never the standard 3,000ms
- ❌ BLOCK if SLA is set to 3,000ms or lower without dev sign-off
- ❌ BLOCK if SLA rationale (external AI API latency) is not documented

**BLOCK 7 — AI Quality scenarios must specify tool and threshold**
- SC-016 (structural non-empty): Cucumber + PactumJS
- SC-017 onwards (semantic): Eval Runner + LLM-as-judge
- Pass threshold must be stated: >= 7/10 at temperatures 0.3, 0.7, and 1.0
- ❌ BLOCK if tool is not specified on AI Quality scenarios
- ❌ BLOCK if pass threshold is missing

**BLOCK 7 — Example data in plan is fine — fixture file names are not**
- ✅ `sport: "basketball"`, `Fake name, sport: football` — shows intent
- ❌ `fixtures/hallucination-inputs.json → fake-footballer` — implementation detail for SCRUM-14

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
- Concurrent requests may hit rate limits — document expected behaviour
- Response time SLA for AI endpoints: p95 < 10,000ms (not the standard 3,000ms)
- Do NOT test Anthropic API performance — only test YOUR integration

**Skip if:**
- No performance AC in the ticket
- Endpoint is not user-facing

---

## Step 2c — AI Quality Coverage Rules

Apply these rules when subtask label type = ai-quality OR when API endpoint
returns AI-generated content.

**Always test — Response Quality:**
- Keeping context of feature ticket
- Responses are non-empty strings
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

### 6a — Save to repo

After producing the test plan, always save it as a markdown file in the repo:

```
test-plans/<TICKET_ID>-<feature-slug>.md
```

Use the template at `.claude/skills/templates/confluence-test-plan.md` as the
base structure. Fill every section with the actual scenarios, test data, and
risks for this feature. Do NOT leave placeholder text.

Example path: `test-plans/SCRUM-13-dual-analyst-test-plan.md`

**This file is the source of truth.** The Jira ticket Test Plan field and Confluence
page are copies of this file — not the other way around.
The Jira ticket description should contain only a brief summary and the Confluence link.

### 6b — Output format

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

## Step 7 — Publish to Confluence and Close the Loop

### 7a — After writing test plan (DoD #1)

Immediately after producing the test plan, write it to the Jira Test Plan field:

1. Write test plan to the **Test Plan field** (not description):
   ```
   PUT /rest/api/3/issue/<TICKET_ID>
   { "fields": { "customfield_10109": "<test plan markdown content>" } }
   ```
   > Description stays clean — do NOT write the full test plan there.

2. Transition ticket to **In Review**:
   ```
   POST /rest/api/3/issue/<TICKET_ID>/transitions
   { "transition": { "id": "31" } }
   ```

3. Use Confluence template at `.claude/skills/templates/confluence-test-plan.md`
   to prepare the Confluence page (publish once approved).

### 7b — After review and approval (DoD #2)

Once lead or stakeholder has approved the test plan:

1. Transition ticket to **Done**:
   ```
   POST /rest/api/3/issue/<TICKET_ID>/transitions
   { "transition": { "id": "41" } }
   ```

2. Assign ticket to the QA who ran the planning:
   ```
   PUT /rest/api/3/issue/<TICKET_ID>
   { "fields": { "assignee": { "accountId": "<QA_ACCOUNT_ID>" } } }
   ```

3. Post a comment on the ticket tagging QA:
   ```
   POST /rest/api/3/issue/<TICKET_ID>/comment
   ```
   Comment text (ADF): mention QA by accountId with message:
   > "Test plan for [EPIC-KEY] has been approved ✅
   >  @[QA Name] — please proceed with writing test cases on [TEST-CASES-TICKET]."

4. Publish final test plan to Confluence under:
   `SportIQ > Test Plans > <EPIC_ID> > <TICKET_ID>`

5. Update Jira ticket **description** with the Confluence link (description = link only, not the full plan).

6. Unblock testing subtasks (API / Performance / AI Quality tickets) —
   confirm with ticket owner before unblocking.

---

## Progress Checklist

### Planning Phase
- [ ] Validation summary received from /ai-receiving-tickets
- [ ] Status confirmed as READY TO PLAN
- [ ] Ticket transitioned to In Progress (transition ID: 21)
- [ ] Subtask type identified
- [ ] Correct coverage rules applied for subtask type
- [ ] Test layer assigned per AC
- [ ] Test data requirements identified
- [ ] Out of scope documented with justification
- [ ] Test plan produced in correct format
- [ ] Test plan written to Jira ticket **Test Plan field** (not description)

### DoD #1 — Test Plan Written
- [ ] All 5 layers covered (API, AI Quality, Hallucination, Security, Performance)
- [ ] Ticket transitioned to In Review (transition ID: 31)

### DoD #2 — Test Plan Reviewed and Approved
- [ ] Test plan reviewed and approved by lead/stakeholder
- [ ] Ticket transitioned to Done (transition ID: 41)
- [ ] Ticket assigned to QA who ran the planning
- [ ] Comment posted on ticket tagging QA to begin test case writing
- [ ] Test plan published to Confluence under SportIQ > Test Plans > [EPIC-KEY]
- [ ] Confluence link added to Jira ticket description
- [ ] Blocked subtasks unblocked (confirm with ticket owner first)
- [ ] Ready to invoke /ai-designing-cases

---

## Templates Reference

- Feature ticket template: `.claude/skills/templates/feature-ticket.md`
- Bug ticket template: `.claude/skills/templates/bug-ticket.md`
- Confluence test plan template: `.claude/skills/templates/confluence-test-plan.md`
