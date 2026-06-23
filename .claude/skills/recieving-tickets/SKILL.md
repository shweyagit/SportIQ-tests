---
name: ai-receiving-tickets
description: |
  Fetches and validates a Jira epic for an AI platform feature. Checks that
  all required information is present, ACs are testable, subtasks are correctly
  linked, and AI-specific risks are flagged before test planning begins.
  Use when a QA engineer receives a new AI platform epic and wants to begin
  test planning.
tools:
  - mcp-atlassian:jira_get_issue
  - mcp-atlassian:jira_get_issue_comments
  - mcp-atlassian:jira_get_linked_issues
---

# Skill: AI Platform — Receiving Tickets

## Purpose
Validate an AI platform epic from Jira. Ensure everything needed to plan
tests is present and clear. Do not begin test planning until all checks pass.

---

## Jira Workflow — Status Transitions

Use these transition IDs when updating ticket status via the Jira REST API:

| Transition | ID | When to use |
|---|---|---|
| To Do | 11 | Reset (rarely used) |
| In Progress | 21 | When QA starts working on the ticket |
| In Review | 31 | When test plan is written and ready for review |
| Done | 41 | When test plan is reviewed and approved (both DoDs met) |

**API call to transition a ticket:**
```
POST /rest/api/3/issue/<TICKET_ID>/transitions
{ "transition": { "id": "<TRANSITION_ID>" } }
```

**API call to assign a ticket:**
```
PUT /rest/api/3/issue/<TICKET_ID>
{ "fields": { "assignee": { "accountId": "<QA_ACCOUNT_ID>" } } }
```

**API call to add a comment (tagging QA):**
```
POST /rest/api/3/issue/<TICKET_ID>/comment
body: mention the QA using accountId in ADF format
```

---

## Definition of Done

There are two DoDs for a test plan ticket. Both must be met before closing.

**DoD #1 — Test planning complete**
- Test plan is written and published to the Jira ticket
- All layers covered (API, AI Quality, Hallucination, Security, Performance)
- Ticket transitions from In Progress → **In Review**

**DoD #2 — Test plan reviewed and approved**
- Test plan reviewed and signed off by lead or stakeholder
- Ticket transitions from In Review → **Done**
- Ticket assigned to the QA who ran the planning
- Comment posted on ticket tagging QA to inform them test plan is approved
  and they can begin writing test cases

---

## Step 1 — Fetch the Epic and Set Status to In Progress

```
jira_get_issue(issue_key: "<EPIC_ID>")
jira_get_issue_comments(issue_key: "<EPIC_ID>")
jira_get_linked_issues(issue_key: "<EPIC_ID>")
```

Fetch the epic, all comments, and all linked tickets including subtasks,
dependencies and related epics.

**Immediately after fetching — if the test plan subtask exists and its
status is To Do, transition it to In Progress:**

```
POST /rest/api/3/issue/<TEST_PLAN_TICKET_ID>/transitions
{ "transition": { "id": "21" } }
```

This signals that QA has picked up the ticket and work has begun.

---

## Step 2 — Ticket Completeness Check

Verify the following fields are present and populated.
Mark each as ✅ PASS or ❌ FAIL.

### 2a — Core Fields

| Field | Check | Rule |
|---|---|---|
| Summary | ✅ / ❌ | Must clearly describe the feature in one sentence |
| Background | ✅ / ❌ | Must explain WHY this feature exists, not just what it does |
| Endpoint | ✅ / ❌ | Must include method, URL, request schema, response schema |
| Scope — In | ✅ / ❌ | Must list what is covered by this epic |
| Scope — Out | ✅ / ❌ | Must list what is NOT covered with justification |
| Risks | ✅ / ❌ | Must be populated — not empty or "None" without justification |
| Documents | ✅ / ❌ | Must link to Postman collection, design docs, or skill files |

**If any ❌ → BLOCK. Request missing fields before proceeding.**

---

### 2b — Endpoint Schema Check

Verify the endpoint section contains:

- [ ] HTTP method (GET / POST / PUT / DELETE)
- [ ] Full URL including base URL
- [ ] Request body schema with field names and types
- [ ] Required vs optional fields identified
- [ ] Response schema with all fields named and typed
- [ ] Error response format documented (at minimum 400 and 500)

**If schema is missing or incomplete → BLOCK. Raise with developer.**

---

## Step 3 — Acceptance Criteria Quality Check

### 3a — AC Completeness

Verify ACs are present and cover ALL of the following:

| AC Category | Required For AI Platform | Check |
|---|---|---|
| Happy path — all supported inputs | Always | ✅ / ❌ |
| Input validation — missing fields | Always | ✅ / ❌ |
| Input validation — invalid values | Always | ✅ / ❌ |
| Input validation — empty/whitespace | Always | ✅ / ❌ |
| Error response format | Always | ✅ / ❌ |
| No stack traces in responses | Always | ✅ / ❌ |
| AI response quality | AI endpoints only | ✅ / ❌ |
| AI response consistency | AI endpoints only | ✅ / ❌ |
| Hallucination handling | AI endpoints only | ✅ / ❌ |
| Prompt injection protection | AI endpoints only | ✅ / ❌ |
| Performance SLA | Always | ✅ / ❌ |
| Concurrent request handling | Always | ✅ / ❌ |

**If any AI-specific AC missing → WARN. Flag to ticket owner.**
**If functional ACs missing → BLOCK.**

---

### 3b — AC Quality Rules

Each AC must pass ALL of these rules:

**Rule 1 — Testable**
AC must describe a verifiable outcome.
- ✅ GOOD: "Returns 400 with error mentioning 'question' when question field is missing"
- ❌ BAD: "Handles errors gracefully"
- ❌ BAD: "Works correctly for all inputs"

**Rule 2 — Specific**
AC must be specific enough to write a test case from.
- ✅ GOOD: "analystA and analystB must be meaningfully different — word overlap < 70%"
- ❌ BAD: "Both analysts should give different answers"

**Rule 3 — No Conflicts**
No two ACs should contradict each other.
- Check: Does any AC say X must happen AND another say X must not happen?

**Rule 4 — AI ACs use flexible language**
AI response ACs must account for non-determinism.
- ✅ GOOD: "Response must contain at least one football-specific term"
- ❌ BAD: "Response must say 'Messi is the greatest player'"

**If any AC fails a rule → FLAG with specific AC number and reason.**

---

## Step 4 — Subtask Validation

Fetch all linked subtasks and verify:

### 4a — Required Subtasks Present

| Subtask Type | Required | Check |
|---|---|---|
| Test Plan ticket | Always — must exist and block all others | ✅ / ❌ |
| API Testing (per supported input type) | If API endpoint present | ✅ / ❌ |
| Performance Testing | If performance AC present | ✅ / ❌ |
| AI Quality + Hallucination Testing | If AI endpoint present | ✅ / ❌ |
| Frontend / E2E Testing | If UI component present | ✅ / ❌ |

**If Test Plan subtask missing → BLOCK. Must be created before proceeding.**
**If other subtasks missing → WARN. Flag to ticket owner.**

---

### 4b — Test Plan Subtask Quality Check

Fetch the test plan subtask and verify:

- [ ] Linked to parent epic
- [ ] Has its own ACs (not just a description)
- [ ] AC covers: test plan published to Confluence
- [ ] AC covers: test plan approved before test writing begins
- [ ] AC references /ai-planning-tests skill file
- [ ] Blocks all other testing subtasks (SPORTIQ-02, 03 etc)
- [ ] Priority is P1

**If test plan subtask ACs are missing → BLOCK.**
**If subtask does not block others → WARN.**

---

### 4c — Testing Subtask Quality Check

For each testing subtask (API / Performance / AI Quality):

- [ ] Linked to parent epic
- [ ] Subtask type is labelled (api-testing / performance / ai-quality)
- [ ] Has its own ACs scoped to its type
- [ ] Has test data section
- [ ] Has risks section
- [ ] Has workflow checklist (test plan → approval → test cases → approval → automation)
- [ ] Is blocked by test plan subtask

**If subtask type label missing → WARN.**
**If workflow checklist missing → WARN.**

---

## Step 5 — AI Platform Risk Check

Verify the following AI-specific risks are flagged in the epic:

| Risk | Check | Action if Missing |
|---|---|---|
| AI responses are non-deterministic | ✅ / ❌ | Add to risks section |
| Hallucination risk for unknown inputs | ✅ / ❌ | Add to risks section |
| External API dependency (Anthropic / OpenAI etc) | ✅ / ❌ | Add to risks section |
| Rate limiting on AI provider | ✅ / ❌ | Add to risks section |
| Prompt injection vulnerability | ✅ / ❌ | Add to risks section |
| Ambiguous inputs producing mixed results | ✅ / ❌ | Add to risks section |

**Missing risks → WARN and add suggested risk text to output.**

---

## Step 6 — Scope + Environment Check

- [ ] Base URL / environment identified (staging / production)
- [ ] Test data identified or flagged as needing creation
- [ ] Auth requirements called out (token needed? which endpoints?)
- [ ] Rate limits documented if known
- [ ] Any third-party dependencies identified

**If environment unknown → BLOCK. Cannot plan tests without a target.**

---

## Step 7 — Produce the Validation Summary

Output in this exact format:

```
═══════════════════════════════════════════
AI TICKET VALIDATION — <EPIC_ID>
═══════════════════════════════════════════

EPIC: <ID> — <Title>
STATUS: READY TO PLAN | BLOCKED | WARNINGS PRESENT

─── COMPLETENESS ───────────────────────────
✅ Summary
✅ Background
✅ Endpoint schema
✅ Scope (in + out)
❌ Risks — MISSING [BLOCK]
✅ Documents linked

─── ACCEPTANCE CRITERIA ────────────────────
✅ Happy path ACs present
✅ Validation ACs present
✅ AI quality ACs present
⚠️  Hallucination ACs — vague wording on AC-15 [WARN]
✅ Security ACs present
✅ Performance ACs present

─── SUBTASKS ───────────────────────────────
✅ Test plan subtask (SPORTIQ-07) — present, blocks others
✅ API Football (SPORTIQ-02) — linked, labelled
✅ API Cricket (SPORTIQ-03) — linked, labelled
✅ API Tennis (SPORTIQ-04) — linked, labelled
⚠️  Performance subtask — missing [WARN]
✅ AI Quality subtask (SPORTIQ-06) — linked, labelled

─── AI RISKS ───────────────────────────────
✅ Non-determinism flagged
✅ Hallucination flagged
✅ External API dependency flagged
⚠️  Rate limiting — not mentioned [WARN]
✅ Prompt injection flagged

─── ENVIRONMENT ────────────────────────────
✅ Base URL present: https://sportiq-voxv.onrender.com
✅ No auth required for public endpoints
✅ Auth required for /api/history — token noted

─── BLOCKS ─────────────────────────────────
<List any blocking issues here>

─── WARNINGS ───────────────────────────────
<List any warnings here>

─── RECOMMENDED ACTIONS ────────────────────
1. Add rate limiting to risks section
2. Create Performance subtask
3. Clarify wording on AC-15

─── NEXT STEP ──────────────────────────────
READY FOR: /ai-planning-tests
OR
BLOCKED — resolve issues above before proceeding
═══════════════════════════════════════════
```

---

## Progress Checklist

- [ ] Epic fetched (issue + comments + linked tickets)
- [ ] Test plan subtask transitioned to In Progress
- [ ] Ticket completeness check passed
- [ ] Endpoint schema verified
- [ ] AC quality check passed
- [ ] Subtask validation passed
- [ ] Test plan subtask verified
- [ ] AI risk check passed
- [ ] Scope + environment confirmed
- [ ] Validation summary produced
- [ ] Status: READY TO PLAN or BLOCKED

---

## Templates Reference

When a ticket is missing required sections, point the ticket owner to:
- Feature/Epic ticket template: `.claude/skills/templates/feature-ticket.md`
- Bug ticket template: `.claude/skills/templates/bug-ticket.md`
- Confluence test plan template: `.claude/skills/templates/confluence-test-plan.md`
