# Template: Bug Ticket

Use this template when raising a bug in Jira.
All sections marked **[REQUIRED]** must be filled before assigning to a developer.

---

## Summary [REQUIRED]

> One sentence describing the bug.
> Format: [Component] — [What is wrong] when [condition]

Example: `POST /api/analyse — Returns 500 instead of 400 when sport field is missing`

---

## Environment [REQUIRED]

| Field | Value |
|---|---|
| Environment | Staging / Production |
| Base URL | `https://[url]` |
| Date found | [YYYY-MM-DD] |
| Found by | [QA name] |
| Severity | P1 — Blocker / P2 — Major / P3 — Minor / P4 — Trivial |

---

## Steps to Reproduce [REQUIRED]

> Be specific enough that anyone can reproduce this without asking for clarification.

1. Send `POST /api/[endpoint]` with the following body:
   ```json
   {
     "field": "value"
   }
   ```
2. [Next step]
3. [Next step]

---

## Expected Result [REQUIRED]

> What should happen according to the spec / AC.

[Describe the expected behaviour with specific HTTP status codes and response fields where applicable]

Example: Response should be `400 Bad Request` with body `{ "error": "sport is required" }`

---

## Actual Result [REQUIRED]

> What actually happens. Include full response body, status code, and any error messages.

**HTTP Status:** `[e.g. 500]`

**Response body:**
```json
{
  "error": "[paste actual error]"
}
```

**Screenshot / log:** [attach or link]

---

## AC Violated [REQUIRED]

> Reference the specific AC from the feature ticket that this bug breaks.

- Violates AC-[XX] from [EPIC-KEY]: "[AC text]"

---

## Root Cause (if known) [RECOMMENDED]

[Developer to fill this in, or QA to add observations if root cause is obvious]

---

## Fix Verification Steps [REQUIRED]

> How QA will verify the fix once deployed.

1. [Step to verify fix]
2. [Step to verify no regression on happy path]
3. [Step to verify related scenarios still pass]

---

## Linked Tickets [RECOMMENDED]

- Related epic: [EPIC-KEY]
- Duplicate of: [TICKET-KEY or N/A]
- Blocked by: [TICKET-KEY or N/A]

---

## Definition of Done

- [ ] Bug reproduced and confirmed by QA
- [ ] Root cause identified by developer
- [ ] Fix deployed to staging
- [ ] Fix verified by QA against steps above
- [ ] Regression tests pass
- [ ] Ticket moved to Done and assigned to QA who verified
