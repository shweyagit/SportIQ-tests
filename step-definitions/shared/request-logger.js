const { When } = require('@cucumber/cucumber');

When('I send the request', async function () {
  this.response = await this.requestSpec.toss();
});

When('I attach the request and response', async function () {
  // Request
  await this.attach(
    JSON.stringify(this.requestSpec._request, null, 2),
    'application/json'
  );

  // Response headers
  await this.attach(
    JSON.stringify(this.response.headers, null, 2),
    'application/json'
  );

  // Response body
  await this.attach(
    JSON.stringify(this.response.body, null, 2),
    'application/json'
  );

  // AI eval score — only if present
  if (this.evalScore) {
    await this.attach(
      JSON.stringify({
        score:              this.evalScore.overall,
        passed:             this.evalScore.passed,
        hallucination_risk: this.evalScore.hallucinationRisk,
        temperature:        process.env.ANALYST_TEMPERATURE,
        dimensions:         this.evalScore.dimensions,
        reasoning:          this.evalScore.reasoning,
      }, null, 2),
      'application/json'
    );
  }
});
