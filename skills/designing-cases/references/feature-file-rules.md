# Feature File Rules — AI Platform

## Purpose
Rules for writing Cucumber feature files for AI platform
API testing. Covers declarative style, shared vs feature-specific
step definitions, hooks, and cleanup.

---

## 1. Declarative vs Imperative Style

Feature files must be written in **declarative style**.
Steps describe INTENT — not implementation.
Implementation detail belongs in step definitions only.

```gherkin
❌ IMPERATIVE — WRONG
When I send a POST request to /api/analyse with body:
  """
  { "question": "Is Mbappe worth his fee?", "sport": "football" }
  """
Then response.status should equal 200
And response.body.analystA should not equal null

✅ DECLARATIVE — CORRECT
When I send a valid football question
Then the response should contain two analyst perspectives
And the response status should be 200
```

**Why:**
- Feature files are read by non-technical stakeholders
- Declarative steps are reusable across scenarios
- Implementation changes don't require feature file changes

---

## 2. Feature File Structure

```gherkin
@tag1 @tag2
Feature: [Feature name — matches Jira ticket]

  Background:
    Given the SportIQ API is running
    And the analyst temperature is configured

  @functional @p1 @football
  Scenario: Valid football question returns analyst perspectives
    When I send a valid football question
    And I send the request
    And I attach the request and response
    Then the response status should be 200
    And both analysts should respond with content
    And the response should echo back the sport and question

  @negative @p1
  Scenario Outline: Invalid request returns 400
    When I send a request with <invalid_input>
    And I send the request
    And I attach the request and response
    Then the response status should be 400
    And the error message should describe the problem

    Examples:
      | invalid_input           |
      | missing question field  |
      | empty question string   |
      | whitespace only question|
      | invalid sport value     |
      | missing sport field     |
```

---

## 3. Tagging Rules

Every scenario must have:
- Test type tag: `@functional` `@negative` `@schema` `@security`
  `@ai-quality` `@hallucination` `@persona` `@performance`
- Priority tag: `@p1` `@p2` `@p3`
- Sport tag if sport-specific: `@football` `@cricket` `@tennis`

```gherkin
@functional @p1 @football
Scenario: Valid football question returns 200

@hallucination @p1 @football
Scenario: Fake player does not produce fabricated statistics

@security @p1
Scenario: Prompt injection does not reveal system prompt
```

---

## 4. Directory Structure

Each feature gets its own directory. The directory name comes from the Jira ticket slug — lowercase, hyphenated.
Test levels are separate feature files within that directory.

```
features/
└── <feature-name>/              ← e.g. dual-analyst, player-profile, match-history
    ├── functional.feature       ← always present
    ├── negative.feature         ← always present
    ├── schema.feature           ← always present
    ├── security.feature         ← always present
    ├── ai-quality.feature       ← only if endpoint calls an AI model
    ├── hallucination.feature    ← only if endpoint calls an AI model
    └── performance.feature      ← only if performance AC is in the ticket
```

Step definitions mirror the same split:

```
step-definitions/
├── shared/                      ← reusable across ALL features — check here first
│   ├── api-steps.js             ← send request, check status, check schema
│   ├── schema-steps.js          ← validate response structure
│   ├── security-steps.js        ← injection, XSS checks
│   ├── data-loader.js           ← loads fixtures by name and key
│   └── request-logger.js        ← attach request/response to ReportPortal
└── <feature-name>/              ← only steps unique to this feature
    └── [feature]-steps.js
```

**Rule: check shared/ before writing any new step. If a step can apply to any feature, it belongs in shared/. Only create a feature-specific step definition if it is genuinely unique to this feature and cannot be reused.**

## 5. Shared Step Definitions — Examples

These steps are available to ALL feature files.
Never rewrite them — always reuse.

### Always Place These Two Steps BEFORE Assertions

```gherkin
When I send a valid football question
And I send the request
And I attach the request and response
Then the response status should be 200
And both analysts should respond with content
```

❌ NOT at the end — after assertions
✅ BEFORE the Then block — before any assertion runs

**Why:**
If a Then assertion fails — Cucumber stops immediately.
Any step after the failure never runs.
If attach is at the end, a failing test leaves NO evidence in ReportPortal.
Attach before assertions means evidence is always captured regardless of outcome.

```
❌ WRONG — attach at the end
When I send a valid football question
Then both analysts should respond     ← fails here
When I send the request               ← never runs
And I attach the request and response ← never runs
← ReportPortal has nothing
← You are debugging blind

✅ RIGHT — attach before assertions
When I send a valid football question
And I send the request
And I attach the request and response ← always runs
Then both analysts should respond     ← fails here
← ReportPortal has the full request and response
← You can see exactly what the server returned
```

**Never remove these steps from any scenario.**
**Never move them after a Then.**

### Shared Step Examples

```javascript
// api-steps.js
When(/^I send a valid (.*) question$/, async function (sport) {
    const fixture = loadFixture('valid-requests', `${sport}-question`);
    this.requestSpec = pactum.spec()
        .post('/api/analyse')
        .withJson(fixture);
});

Then(/^the response status should be (\d+)$/, function (status) {
    expect(this.response.statusCode).to.equal(parseInt(status));
});

// request-logger.js — battle-tested from Catapult, adapted for AI
When(/^I send the request$/, async function () {
    this.response = await this.requestSpec.toss();
});

When(/^I attach the request and response$/, async function () {
    const type = 'application/json';

    // Request
    await this.attach(JSON.stringify({
        message: 'Request Object',
        level: 'INFO',
        data: Buffer.from(
            JSON.stringify(this.requestSpec._request)
        ).toString('base64'),
    }), type);

    // Response headers
    await this.attach(JSON.stringify({
        message: 'Response Headers',
        level: 'INFO',
        data: Buffer.from(
            JSON.stringify(this.response.headers)
        ).toString('base64'),
    }), type);

    // Response body
    await this.attach(JSON.stringify({
        message: 'Response Body',
        level: 'INFO',
        data: Buffer.from(
            JSON.stringify(this.response.body)
        ).toString('base64'),
    }), type);

    // AI eval score — only if present
    if (this.evalScore) {
        await this.attach(JSON.stringify({
            message: 'AI Quality Score',
            level: this.evalScore.passed ? 'INFO' : 'WARN',
            data: Buffer.from(JSON.stringify({
                score:             this.evalScore.overall,
                hallucination_risk: this.evalScore.hallucinationRisk,
                temperature:       process.env.ANALYST_TEMPERATURE,
                passed:            this.evalScore.passed,
            })).toString('base64'),
        }), type);
    }
});
```

---

## 6. Feature-Specific Step Definitions

Steps that only apply to the Dual Analyst feature.

```
/step-definitions/dual-analyst/
├── analyst-steps.js     ← analystA/B assertions
└── eval-steps.js        ← AI quality scoring steps
```

```javascript
// analyst-steps.js
Then(/^both analysts should respond with content$/, function () {
    expect(this.response.body.analystA).to.be.a('string').with.length.above(50);
    expect(this.response.body.analystB).to.be.a('string').with.length.above(50);
});

Then(/^the analysts should have different perspectives$/, function () {
    const a = this.response.body.analystA;
    const b = this.response.body.analystB;
    const overlap = calculateWordOverlap(a, b);
    expect(overlap).to.be.below(0.7); // less than 70% word overlap
});

Then(/^the response should contain football vocabulary$/, function () {
    const terms = ['goal','transfer','Champions League','formation',
                   'pressing','xG','Ballon d\'Or','striker','tactical'];
    const body = JSON.stringify(this.response.body).toLowerCase();
    const found = terms.some(term => body.includes(term.toLowerCase()));
    expect(found).to.be.true;
});
```

---

## 7. Scenario Outline for Multiple Sports

Use Scenario Outline when the same test applies
across multiple sports — avoids duplication.

```gherkin
@functional @p1
Scenario Outline: Valid question returns 200 for all sports
  When I send a valid <sport> question
  And I send the request
  And I attach the request and response
  Then the response status should be 200
  And both analysts should respond with content

  Examples:
    | sport    |
    | football |
    | cricket  |
    | tennis   |
```

Data comes from fixtures — not from the Examples table directly.

---

## 8. Background

Use Background for setup steps that apply to ALL
scenarios in the feature file.

```gherkin
Background:
  Given the SportIQ API is running
  And the analyst temperature is configured
```

Do NOT put test data or sport-specific setup in Background.

---

## 9. Cleanup — After Hooks

For read-only endpoints like `/api/analyse` — no teardown needed.

For endpoints that create data:
```javascript
After(async function () {
    if (this.createdResourceId) {
        await deleteResource(this.createdResourceId);
    }
});
```

---

## 10. What NOT to Do in Feature Files

---

### ❌ Don't put request bodies in feature files

```gherkin
# WRONG
When I POST to /api/analyse with body:
  """
  { "question": "Is Mbappe worth his fee?", "sport": "football" }
  """

# RIGHT
When I send a valid football question
```
Request body lives in fixtures/valid-requests.json — not here.

---

### ❌ Don't put URLs in feature files

```gherkin
# WRONG
When I send a POST request to https://sportiq-voxv.onrender.com/api/analyse

# RIGHT
When I send a valid football question
```
BASE_URL is an environment variable — never hardcoded in a feature file.

---

### ❌ Don't put assertion logic in feature files

```gherkin
# WRONG
Then response.body.analystA.length should be greater than 50
And response.body.analystB should not equal response.body.analystA
And response.statusCode should equal 200

# RIGHT
Then both analysts should respond with content
And the response status should be 200
```
Logic lives in step definitions — feature files describe intent only.

---

### ❌ Don't use imperative steps

```gherkin
# WRONG
When I click the submit button
And I wait for the spinner to disappear
And I check the response tab

# RIGHT
When I send a valid football question
```
Imperative steps break when implementation changes.
Declarative steps survive refactoring.

---

### ❌ Don't hardcode test data values

```gherkin
# WRONG
When I send the question "Is Mbappe worth his transfer fee?" for sport "football"

# RIGHT
When I send a valid football question
```
Hardcoded values mean updating the feature file every time data changes.
Load from fixtures — change data in one place only.

---

### ❌ Don't skip the attach request/response steps

```gherkin
# WRONG — attach missing entirely
Scenario: Valid football question returns 200
  When I send a valid football question
  Then the response status should be 200
  ← test fails → ReportPortal has nothing → debugging blind

# WRONG — attach at the end after assertions
Scenario: Valid football question returns 200
  When I send a valid football question
  Then the response status should be 200  ← fails here
  And I send the request                  ← never runs
  And I attach the request and response   ← never runs

# RIGHT — attach before assertions
Scenario: Valid football question returns 200
  When I send a valid football question
  And I send the request
  And I attach the request and response   ← always runs
  Then the response status should be 200  ← fails here
  ← ReportPortal already has full request and response
  ← you can see exactly what the server returned
```

---

### ❌ Don't create scenario-specific step definitions for shared steps

```gherkin
# WRONG — writing a new step when shared one exists
When I make a POST call to the analyse endpoint  ← duplicate of shared step

# RIGHT — use what already exists
When I send a valid football question            ← already in shared/api-steps.js
```
Check shared/api-steps.js before writing any new step.
Duplicate steps = two things to maintain when the API changes.

---

### ❌ Don't use And as the first step in a scenario

```gherkin
# WRONG
Scenario: Valid football question
  And the API is running
  When I send a valid football question

# RIGHT
Scenario: Valid football question
  Given the SportIQ API is running
  When I send a valid football question
```
And has no meaning without a preceding Given, When or Then.
Always start with Given, When or Then.

---

### ❌ Don't write scenarios longer than 10 steps — split them

```gherkin
# WRONG — one scenario doing too much
Scenario: Full flagging workflow
  Given the API is running
  When I send a football question
  Then the response is 200
  And both analysts respond
  And analystA contains football terms
  And analystB contains football terms
  And the analysts are different
  And the response echoes back the sport
  And the response echoes back the question
  And the response time is under 10 seconds
  And no stack trace is present          ← 11 steps — too long

# RIGHT — split into focused scenarios
Scenario: Valid football question returns 200 with analyst content
  ...3-4 steps...

Scenario: Football response contains sport vocabulary
  ...3-4 steps...

Scenario: Response time is within SLA
  ...3-4 steps...
```
Long scenarios fail for multiple reasons at once.
Short scenarios fail for exactly one reason — easier to diagnose.
