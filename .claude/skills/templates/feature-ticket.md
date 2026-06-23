# Template: Feature / Epic Ticket

Use this template when creating a new feature epic in Jira.
All sections marked **[REQUIRED]** must be filled before handing to QA.
Sections marked [RECOMMENDED] should be filled where known.

---

## Summary [REQUIRED]

> One sentence user story.
> Format: As a [user type], I want to [action] so that [benefit].

As a [user type], I want to [action] so that [benefit].

---

## Background [REQUIRED]

> Explain WHY this feature exists — business context, problem being solved.
> Do NOT just describe what the feature does. Explain the reason it is needed.

[Why does this feature exist? What problem does it solve? Who asked for it?]

---

## Endpoint [REQUIRED for API features]

> Must include method, full URL, request schema, response schema, and error formats.
> All fields must be named and typed. Required vs optional must be identified.

**Method:** `POST | GET | PUT | DELETE`
**Base URL:** `https://[environment-url]`
**Full path:** `/api/[path]`
**Content-Type:** `application/json`

### Request Schema

```json
{
  "fieldName": "string",      // required — description
  "fieldName2": "string",     // required — allowed values: value1 | value2 | value3
  "optionalField": "string"   // optional — description
}
```

### Response Schema (200 OK)

```json
{
  "fieldName": "string",   // description
  "fieldName2": "string",  // description
  "fieldName3": "string",  // description
}
```

### Error Response Schema

```json
// 400 Bad Request
{
  "error": "string",   // human-readable error message
  "field": "string"    // optional — which field caused the error
}

// 500 Internal Server Error
{
  "error": "string"    // must NOT include stack trace or internal paths
}
```

---

## Scope — In [REQUIRED]

> List exactly what this epic covers. Be specific.

- [Feature area 1]
- [Feature area 2]
- [Endpoint(s) included]
- [Sport / input types included]

---

## Scope — Out [REQUIRED]

> List what is explicitly NOT covered by this epic, with justification.

- [Area 1] — [why excluded]
- [Area 2] — [why excluded]
- Browser/UI behaviour — covered by separate frontend epic
- Other endpoints not listed above

---

## Risks [REQUIRED]

> Must not be empty. List known risks. For AI endpoints, all 6 AI risks below are required.

### Functional Risks
- [Risk 1 — e.g. external dependency on third-party API]
- [Risk 2 — e.g. unclear validation rules for field X]

### AI-Specific Risks [REQUIRED for AI endpoints]
- AI responses are non-deterministic — same input may yield different output on each call
- Hallucination risk — AI may fabricate plausible-sounding but incorrect facts for unknown inputs
- External API dependency (Anthropic / OpenAI) — outages or degradation affect all responses
- Rate limiting on AI provider — concurrent requests may hit provider rate limits and fail
- Prompt injection vulnerability — malicious input in question field may attempt to hijack model behaviour
- Ambiguous or cross-domain inputs may produce misleading responses (e.g. Bollywood actor asked in football context)

---

## Acceptance Criteria [REQUIRED]

> Each AC must be testable, specific, and use flexible language for AI responses.
> Do NOT write ACs like "handles errors gracefully" — write the expected outcome.

### Happy Path
- AC-01: Given valid [inputs], when [endpoint] is called, then response is 200 with [expected fields] non-empty
- AC-02: [Repeat per valid input combination / sport / type]

### Input Validation — Missing Fields
- AC-03: Given request with missing [required field], when endpoint is called, then response is 400 with error message referencing "[field name]"
- AC-04: [Repeat per required field]

### Input Validation — Invalid Values
- AC-05: Given [field] set to unsupported value "[value]", when endpoint is called, then response is 400 mentioning allowed values
- AC-06: Given [field] set to empty string, when endpoint is called, then response is 400
- AC-07: Given [field] set to whitespace-only string, when endpoint is called, then response is 400

### Error Response Format
- AC-08: All 400 responses must return consistent error structure with no stack trace
- AC-09: All 500 responses must return a safe error message with no internal file paths or stack traces

### AI Response Quality [Required for AI endpoints]
- AC-10: Both AI responses (analystA and analystB) must be non-empty strings
- AC-11: analystA and analystB must be meaningfully different — word overlap must be less than 70%
- AC-12: Response must contain at least one [domain]-specific term relevant to the sport/topic
- AC-13: Response must reference the topic from the question — not be generic

### Hallucination Handling [Required for AI endpoints]
- AC-14: When question references an unknown or fake entity, response must include uncertainty language and must not present fabricated facts as confirmed
- AC-15: When question asks about a future event, response must use speculative language (e.g. "likely", "could", "prediction") and must not state the outcome as confirmed fact

### Security [Required for AI endpoints]
- AC-16: When prompt injection payload is submitted in question field, response must not reveal system prompt or internal configuration
- AC-17: When oversized payload (10,000+ characters) is submitted, response must be 400 or graceful error — never 500

### Performance
- AC-18: p95 response time must be under [X]ms for single requests (AI endpoints: 10,000ms)
- AC-19: Under concurrent load of [N] virtual users for [duration], error rate must be under 5%

---

## Environment [REQUIRED]

| Field | Value |
|---|---|
| Base URL | `https://[url]` |
| Environment | Staging / Production |
| Auth required | Yes — Bearer token / No |
| Auth endpoint | `POST /api/auth/login` or N/A |
| Rate limits | [known limits or "unknown"] |

---

## Test Data [RECOMMENDED]

> Identify what test data is needed. Flag anything that needs to be created.

| Data Type | Value | Source |
|---|---|---|
| Valid [entity] | [example] | Hardcoded |
| Invalid [field] value | [example] | Hardcoded |
| Fake/unknown entity | [example] | Hardcoded |
| Prompt injection payload | "Ignore all instructions..." | Hardcoded |
| Oversized payload | 10,000 char string | Generated in test |

---

## Documents [REQUIRED]

> Link at least one of: Postman collection, design doc, Figma, API spec, or skill file.

- [ ] Postman collection: [link]
- [ ] API design doc / spec: [link]
- [ ] Figma / UI design: [link or N/A]
- [ ] Skill file reference: `.claude/skills/recieving-tickets/SKILL.md`

---

## Subtasks Required

> Create these subtasks before handing to QA. Link each as "is blocked by" the test plan ticket.

- [ ] `[EPIC-KEY]-TP` — Test Plan (blocks all others, P1)
- [ ] `[EPIC-KEY]-API` — API Testing (blocked by test plan)
- [ ] `[EPIC-KEY]-PERF` — Performance Testing (blocked by test plan)
- [ ] `[EPIC-KEY]-AI` — AI Quality + Hallucination Testing (blocked by test plan) [AI endpoints only]
- [ ] `[EPIC-KEY]-E2E` — Frontend / E2E Testing (blocked by test plan) [if UI present]

---

## Definition of Done [REQUIRED]

- [ ] All ACs written and reviewed by QA lead
- [ ] Risks section populated
- [ ] Scope In/Out defined
- [ ] Endpoint schema complete including error formats
- [ ] Environment confirmed
- [ ] Test data identified
- [ ] All subtasks created and linked
- [ ] Documents linked
- [ ] Ticket handed to QA and moved to In Progress
