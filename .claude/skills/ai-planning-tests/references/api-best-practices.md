# API Best Practices — AI Platform Testing

## Purpose
Standards for API testing on an AI platform.
Apply these to every API test plan and test case.

---

## 1. Schema Validation

Always validate the full response schema — not just status code.

```javascript
// Using PactumJS + AJV
Then(/^response should match analyst schema$/, function () {
    const schema = {
        type: 'object',
        required: ['analystA', 'analystB', 'sport', 'question'],
        properties: {
            analystA: { type: 'string', minLength: 1 },
            analystB: { type: 'string', minLength: 1 },
            sport:    { type: 'string', enum: ['football', 'cricket', 'tennis'] },
            question: { type: 'string', minLength: 1 }
        },
        additionalProperties: false  // no unexpected fields
    };
    // validate response against schema
});
```

**Rules:**
- Assert required fields are present
- Assert field types are correct
- Assert no unexpected extra fields — `additionalProperties: false`
- Assert no null values on required fields
- Assert string fields have minimum length > 0

---

## 2. Contract Testing

The API contract is the documented request/response schema.
Any deviation from the contract is a bug — even if the
feature "works".

**Always test:**
- Request schema — correct fields accepted
- Response schema — correct fields returned
- Error response schema — consistent error format
- HTTP methods — wrong method returns 405 not 500

**Error response contract:**
```json
{
  "error": "descriptive message mentioning the problem field"
}
```
Every 400 response must follow this format.

---

## 3. Input Validation — Always Cover

For every string field:
```
✅ Valid value          → 200
✅ Missing field        → 400
✅ Empty string ""      → 400
✅ Whitespace only "  " → 400
✅ Null value           → 400
```

For every enum field (sport):
```
✅ Valid value "football"   → 200
✅ Invalid value "basketball" → 400 with valid options listed
✅ Missing field             → 400
```

For payload size:
```
✅ Normal size              → 200
✅ Oversized (10,000 chars) → 400 — never 500
```

---

## 4. HTTP Status Code Standards

| Scenario | Expected Status |
|---|---|
| Successful response | 200 |
| Missing required field | 400 |
| Invalid field value | 400 |
| Wrong HTTP method | 405 |
| Endpoint not found | 404 |
| Server error | 500 — never expose to user |
| Timeout | 504 — handled gracefully |

**Hard rule:** 500 errors must never contain stack traces.

---

## 5. Response Time SLA

| Endpoint Type | p95 SLA |
|---|---|
| Standard API | < 3,000ms |
| AI-powered endpoint | < 10,000ms |
| Health check | < 500ms |

AI endpoints have a higher SLA because external
AI API latency is outside our control.

---

## 6. Security Constraints

**Must test on every AI endpoint:**

| Test | Why |
|---|---|
| Prompt injection — role override | Attacker may override analyst persona |
| Prompt injection — reveal system prompt | Internal instructions must not leak |
| API key in response | Credentials must never appear in response body |
| XSS in input field | Malicious script must not be echoed back |
| SQL injection in input | Must not cause database errors |
| Oversized payload | Must not cause timeout without error |

**Hard rules:**
- API keys must never appear in response body or logs
- Stack traces must never appear in response body
- System prompt must never be revealed via injection

---

## 7. Test Data — Never Hardcode

Test data must always come from fixtures files.
Never hardcode request bodies in step definitions.

```
/test-data/fixtures/
├── valid-requests.json       ← happy path inputs
├── invalid-requests.json     ← negative inputs
├── security-payloads.json    ← injection, XSS, SQL
└── hallucination-inputs.json ← fake players, ambiguous names
```

```javascript
// ❌ WRONG — hardcoded
const body = { question: "Is Mbappe worth his fee?", sport: "football" };

// ✅ RIGHT — from fixtures
const body = loadFixture('valid-requests', 'football-question');
```

---

## 8. Environment Health Check

Before any test suite runs — verify environment is healthy.

```javascript
BeforeAll(async () => {
    const response = await GET('/api/health');
    if (response.status !== 200) {
        throw new Error('Environment not ready — aborting suite');
    }
});
```

---

## 9. Cleanup — After Hooks

If a test creates or mutates data — clean up after.

```javascript
After(async function() {
    // reset test context
    // clear any created resources
    // log result to ReportPortal
});
```

For read-only endpoints like `/api/analyse` — no teardown needed.

---

## 10. Retry Strategy

| Test Type | Retry Count | Reason |
|---|---|---|
| Functional | 2 | Transient API failures |
| AI Quality | 2 | Non-deterministic — retry reduces false negatives |
| Security | 0 | Security failure is always real |
| Performance | 0 | Timing sensitive — no retry |
