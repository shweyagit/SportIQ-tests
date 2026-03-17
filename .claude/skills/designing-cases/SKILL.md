---
name: ai-designing-cases
description: |
  Takes an approved test plan from /ai-planning-tests and writes detailed
  test cases ready for TestRail and Cucumber feature files ready for automation.
  Applies AI platform test writing rules — non-deterministic assertions,
  hallucination detection format, security absence checks.
  Only runs after test plan is APPROVED.
disable-model-invocation: true
tools:
  - confluence:get_page
  - testrail:create_test_case
  - mcp-atlassian:jira_update_issue
---

# Skill: AI Platform — Designing Cases

## Purpose
Write detailed, executable test cases from an approved test plan.
Each case must be self-contained, reproducible and unambiguous.
Produce both TestRail cases and Cucumber feature files.

---

## Jira Workflow — Status Transitions

Use these transition IDs when updating ticket status via the Jira REST API:

| Transition | ID | When to use |
|---|---|---|
| In Progress | 21 | When test case writing begins |
| In Review | 31 | After test cases are published to TestRail and feature files saved — DoD met |
| Done | 41 | After test cases are reviewed and approved by lead |

**Transition API call:**
```
POST /rest/api/3/issue/<TICKET_ID>/transitions
{ "transition": { "id": "<ID>" } }
```

**Assign ticket to QA API call:**
```
PUT /rest/api/3/issue/<TICKET_ID>
{ "fields": { "assignee": { "accountId": "<QA_ACCOUNT_ID>" } } }
```

**Post comment tagging QA API call:**
```
POST /rest/api/3/issue/<TICKET_ID>/comment
```
Use ADF format to mention QA by accountId in the comment body.

---

## GUARDRAILS — Read Before Anything Else

### HARD STOPS — BLOCK if any of these are true:

```
❌ Test plan status is not APPROVED
   → Check Confluence before writing a single case

❌ Test case asserts exact AI response wording
   → Non-deterministic — will always be flaky
   → Use keyword presence, length, overlap instead

❌ Request body hardcoded in test case or step definition
   → Must reference fixtures/ file and key name only
   → Never inline values

❌ Security test case has retry > 0
   → Security failures are always real — never retry

❌ Feature file contains URLs, JSON or request bodies
   → Declarative only — implementation in step definitions

❌ Test case has no AC reference
   → No AC = no test case

❌ Hallucination case asserts what response SHOULD say
   → Assert what must NOT be present — never what must
```

### WARNINGS — FLAG and continue:

```
⚠️  Test case has more than 10 steps → split it
⚠️  Scenario covers more than one objective → split it
⚠️  Security payload not from fixtures/security-payloads.json
⚠️  AI quality case missing assertion approach note
⚠️  Attach request/response steps missing from scenario
⚠️  Temperature not logged for AI quality cases
```

---

## Step 1 — Verify Test Plan Approval

```
If Confluence status ≠ APPROVED → BLOCK
Output: "Test plan not approved. Resolve <CONFLUENCE_LINK> first."
```

Check:
- [ ] Confluence status = APPROVED
- [ ] Jira subtask = APPROVED / DONE
- [ ] Reviewer name and date present

---

## Step 2 — Read References

Read ALL of these before writing any case:

- `references/ai-testing-rules.md`   ← how to assert on AI responses
- `references/test-case-rules.md`    ← assertion patterns, what not to do
- `references/feature-file-rules.md` ← declarative Gherkin, shared steps
- `references/testrail-format.md`    ← TestRail field mapping and format
- `references/hallucination-inputs.md` ← input list, golden dataset structure

---

## Step 3 — Read the Approved Test Plan

Fetch from Confluence: `SportIQ > Test Plans > <EPIC_ID> > <TICKET_ID>`

For every scenario confirm:
- Scenario ID (SC-001 etc)
- Layer — API | AI Quality | Hallucination | Security | Performance
- AC covered
- Test data source — fixture file and key name
- Priority — P1 / P2 / P3

**If any scenario is missing a layer or AC → flag before writing.**

---

## Step 4 — Write Test Cases

Read: `references/test-case-rules.md` and `references/testrail-format.md`

One test case per scenario from the plan.
Format every case as:

```
TC-ID:          TC-[number]
Title:          Verify [scenario]
Ticket:         [TICKET_ID]
Layer:          [API | AI Quality | Hallucination | Security | Performance]
Type:           [Functional | Negative | Schema | Security | AI Quality |
                 Hallucination | Persona | Performance]
Priority:       [P1 | P2 | P3]
AC Covered:     [AC ref]

Preconditions:
- API is running — GET /api/health returns 200
- [any additional state]

Request:
  Fixture: fixtures/[file].json — key: [key name]
  ← NEVER hardcode request body here

Steps:
1. [one action]
2. [one action]

Expected Results:
- [specific, measurable]
- [specific, measurable]

[For AI quality cases add:]
Assertion approach: [keyword presence | similarity check | fact consistency]

[For hallucination cases add:]
PASS if: [condition]
FAIL if: [specific absent terms that would indicate fabrication]

Teardown: [None | describe if needed]
```

---

## Step 5 — Write Cucumber Feature Files

Read: `references/feature-file-rules.md`

One directory per feature. One feature file per test level within that directory.
The feature directory name is derived from the Jira ticket slug — lowercase, hyphenated.

```
features/
└── <feature-name>/              ← e.g. dual-analyst, player-profile, match-history
    ├── functional.feature       ← happy path + schema
    ├── negative.feature         ← missing fields, invalid values, wrong method
    ├── schema.feature           ← contract / response structure
    ├── security.feature         ← injection, XSS, credential exposure
    ├── ai-quality.feature       ← non-empty, differentiation, vocab (AI endpoints only)
    ├── hallucination.feature    ← absence checks (AI endpoints only)
    ├── performance.feature      ← only if performance AC explicitly in ticket
    ├── schemas/
    │   └── <endpoint>.js        ← request + response schema definition
    └── step-definitions/        ← steps unique to this feature only
        ├── [feature]-steps.js
        ├── hallucination-steps.js
        └── schema-steps.js      ← imports from schemas/<endpoint>.js

step-definitions/
└── shared/                      ← reusable across ALL features — check here first
    ├── api-steps.js             ← send request, check status
    ├── security-steps.js        ← injection, XSS absence checks
    ├── data-loader.js           ← loads fixtures by name and key
    ├── hooks.js                 ← BeforeAll, Before setup
    └── request-logger.js        ← attach request/response to reporter
```

Only create the feature files that are in scope for this ticket.
Skip `ai-quality.feature` and `hallucination.feature` if the endpoint is not AI-powered.
Skip `performance.feature` if there is no performance AC — performance load tests run via k6, not Cucumber. No step definitions needed.

**Rule: always check shared/ before writing a new step. If the step can apply to any feature, it belongs in shared/. Only create a feature-specific step if it is genuinely unique to this feature.**

Rules:
- Declarative style only — no URLs, JSON or request bodies
- Every scenario tagged with type + priority + sport
- Every scenario ends with:
  `When I send the request`
  `And I attach the request and response`
- Test data loaded from fixtures/ in step definitions — never in feature file
- Scenario Outline for same test across multiple sports

---

## Step 6 — TestRail Readiness Check

Before publishing every case must have:

- [ ] Unique TC ID
- [ ] Title starts with "Verify"
- [ ] Layer assigned
- [ ] Explicit preconditions — no assumed state
- [ ] Numbered atomic steps
- [ ] Specific expected results — no "works correctly"
- [ ] Fixture reference — no hardcoded data
- [ ] Assertion approach documented for AI quality cases
- [ ] PASS / FAIL criteria explicit for hallucination cases
- [ ] Known bug referenced where applicable
- [ ] AC covered
- [ ] Priority assigned

---

## Step 7 — Publish and Update

1. Publish cases to TestRail:
   `SportIQ > <EPIC_ID> > <TICKET_ID>`
   Sections: Functional | Negative | Schema | Security |
             AI Quality | Hallucination | Persona | Performance

2. Save feature files to:
   `features/api/[type].feature`

3. Transition Jira subtask to **In Review**:
   ```
   POST /rest/api/3/issue/<TICKET_ID>/transitions
   { "transition": { "id": "31" } }
   ```

4. Assign Jira subtask to the QA who wrote the cases:
   ```
   PUT /rest/api/3/issue/<TICKET_ID>
   { "fields": { "assignee": { "accountId": "<QA_ACCOUNT_ID>" } } }
   ```

5. Post a comment on the Jira subtask tagging the QA:
   ```
   POST /rest/api/3/issue/<TICKET_ID>/comment
   ```
   Comment text (ADF): mention QA by accountId with message:
   > "Test cases for [TICKET_ID] have been published to TestRail ✅
   >  Feature files saved to features/api/
   >  @[QA Name] — please review the test cases and approve to proceed with automation."

6. Update Jira subtask description with the TestRail link:
   - Description should contain the TestRail link only — not the full test cases
   ```
   PUT /rest/api/3/issue/<TICKET_ID>
   { "fields": { "description": { "TestRail: <TESTRAIL_LINK>" } } }
   ```

7. Raise automation ticket for all P1 cases

---

## Progress Checklist

- [ ] GUARDRAILS read
- [ ] Test plan approval verified
- [ ] All references read
- [ ] Approved test plan fetched — all scenarios accounted for
- [ ] Test cases written — one per scenario
- [ ] No hardcoded data in any case
- [ ] Cucumber feature files written — one per type
- [ ] TestRail readiness check passed
- [ ] Published to TestRail
- [ ] Feature files saved to features/api/
- [ ] Jira subtask transitioned to In Review (transition ID: 31)
- [ ] Jira subtask assigned to QA who wrote the cases
- [ ] Comment posted on Jira subtask tagging QA for review
- [ ] TestRail link added to Jira subtask description
- [ ] Automation ticket raised for P1 cases
