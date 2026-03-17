const { Given, When, Then } = require('@cucumber/cucumber');
const pactum = require('pactum');
const { expect } = require('chai');
const { loadFixture } = require('./data-loader');

// Map of step text (from Scenario Outline Examples) → fixture key in invalid-requests.json
const INVALID_INPUT_MAP = {
  'missing question field':           'missing-question',
  'missing sport field':              'missing-sport',
  'empty question string':            'empty-question',
  'whitespace only question':         'whitespace-question',
  'empty sport string':               'empty-sport',
  'invalid sport value basketball':   'invalid-sport-basketball',
  'invalid sport value rugby':        'invalid-sport-rugby',
  'empty request body':               'empty-body',
};

// Map of sport display name → fixture key in valid-requests.json
const SPORT_FIXTURE_MAP = {
  'football':         'football',
  'cricket':          'cricket',
  'tennis':           'tennis',
  'football factual': 'football-factual',
  'cricket factual':  'cricket-factual',
  'tennis factual':   'tennis-factual',
};

// ─── Given ───────────────────────────────────────────────────────────────────

Given('the SportIQ API is running', async function () {
  const response = await pactum.spec().get('/api/health').toss();
  expect(response.statusCode).to.equal(200);
});

Given('the analyst temperature is configured', function () {
  if (!process.env.ANALYST_TEMPERATURE) {
    console.warn('Warning: ANALYST_TEMPERATURE not set in .env — using API default');
  }
});

// ─── When — valid requests ────────────────────────────────────────────────────

// Matches: "I send a valid football question", "I send a valid <sport> question"
// Also matches: "I send a valid football factual question"
When(/^I send a valid (.+) question$/, function (sportText) {
  const key = SPORT_FIXTURE_MAP[sportText.trim()];
  if (!key) throw new Error(`No fixture mapped for sport: "${sportText}"`);
  const fixture = loadFixture('valid-requests', key);
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson(fixture);
});

// ─── When — invalid requests ──────────────────────────────────────────────────

// Generic handler for all "I send a request with <X>" steps.
// Covers both individual negative scenarios and Scenario Outline rows.
When(/^I send a request with (.+)$/, function (invalidInput) {
  const key = INVALID_INPUT_MAP[invalidInput.trim()];
  if (!key) throw new Error(`No fixture mapping for invalid input: "${invalidInput}"`);
  const fixture = loadFixture('invalid-requests', key);
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson(fixture);
});

// SC-014 — different step wording from Scenario Outline version
When('I send an empty request body', function () {
  const fixture = loadFixture('invalid-requests', 'empty-body');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson(fixture);
});

// SC-011 — GET request sent immediately (no separate "I send the request" step)
When('I send a GET request to the analyse endpoint', async function () {
  this.requestSpec = pactum.spec().get('/api/analyse');
  this.response = await this.requestSpec.toss();
});

// ─── Then — status codes ──────────────────────────────────────────────────────

Then('the response status should be {int}', function (status) {
  expect(this.response.statusCode).to.equal(status);
});

Then('the response status should not be {int}', function (status) {
  expect(this.response.statusCode).to.not.equal(status);
});

Then('the response status should be 404 or 405', function () {
  expect([404, 405]).to.include(this.response.statusCode);
});

// ─── Then — error body ────────────────────────────────────────────────────────

Then('the error message should mention the missing field', function () {
  const errorText = JSON.stringify(this.response.body).toLowerCase();
  expect(errorText).to.match(/question|sport|field|required|missing/);
});

Then('the response should not contain a stack trace', function () {
  const bodyStr = JSON.stringify(this.response.body);
  expect(bodyStr).to.not.match(/at \w[\w.]* \(.*:\d+:\d+\)/);
  expect(bodyStr).to.not.include('Error:');
});

Then('the response should not expose internal file paths', function () {
  const bodyStr = JSON.stringify(this.response.body);
  expect(bodyStr).to.not.match(/node_modules/);
  expect(bodyStr).to.not.match(/\/home\/|\/Users\/|[A-Z]:\\/);
});
