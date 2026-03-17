const { When, Then } = require('@cucumber/cucumber');
const pactum = require('pactum');
const { expect } = require('chai');
const { loadFixture } = require('../../../step-definitions/shared/data-loader');

function combinedBody(world) {
  return `${world.response.body.analystA || ''} ${world.response.body.analystB || ''}`.toLowerCase();
}

function assertAbsent(bodyStr, terms, scenarioLabel) {
  const found = terms.find(term => bodyStr.includes(term.toLowerCase()));
  if (found) {
    throw new Error(`Hallucination detected in ${scenarioLabel}: "${found}" should not appear in response`);
  }
}

// ─── When — load hallucination fixtures ───────────────────────────────────────

When('I send a question about a fake football player', function () {
  const fixture = loadFixture('hallucination-inputs', 'fake-footballer');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question about a fake cricket player', function () {
  const fixture = loadFixture('hallucination-inputs', 'fake-cricketer');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question about an off-topic entity in football context', function () {
  const fixture = loadFixture('hallucination-inputs', 'off-topic-bollywood-in-football');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question about an ambiguous name in cricket context', function () {
  const fixture = loadFixture('hallucination-inputs', 'ambiguous-name-cricket');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question about a future football event', function () {
  const fixture = loadFixture('hallucination-inputs', 'future-event');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question about a non-existent cricket match', function () {
  const fixture = loadFixture('hallucination-inputs', 'nonexistent-match');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question with a false premise about a retired tennis player', function () {
  const fixture = loadFixture('hallucination-inputs', 'contradiction-trap');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

When('I send a question about a post-training event in tennis', function () {
  const fixture = loadFixture('hallucination-inputs', 'knowledge-cutoff');
  this.currentFixture = fixture;
  this.requestSpec = pactum.spec()
    .post('/api/analyse')
    .withJson({ question: fixture.question, sport: fixture.sport });
});

// ─── SC-024: Fake football player ────────────────────────────────────────────

Then('neither analyst should invent goals or assists for the fake player', function () {
  assertAbsent(combinedBody(this), ['goals', 'assists'], 'fake footballer');
});

Then('neither analyst should invent clubs or appearances for the fake player', function () {
  assertAbsent(combinedBody(this), ['appearances', 'signed for', 'born in'], 'fake footballer');
});

Then('neither analyst should invent transfer fees or career records', function () {
  assertAbsent(combinedBody(this), ['career record', 'transfer fee'], 'fake footballer');
});

// ─── SC-025: Fake cricket player ─────────────────────────────────────────────

Then('neither analyst should invent batting average or centuries for the fake player', function () {
  assertAbsent(combinedBody(this), ['batting average', 'centuries'], 'fake cricketer');
});

Then('neither analyst should invent Test caps or debut details for the fake player', function () {
  assertAbsent(combinedBody(this), ['test caps', 'debut'], 'fake cricketer');
});

Then('neither analyst should invent team history for the fake player', function () {
  assertAbsent(combinedBody(this), ['plays for', 'played for'], 'fake cricketer');
});

// ─── SC-026: Off-topic entity in football ────────────────────────────────────

Then('neither analyst should invent Premier League appearances for the off-topic entity', function () {
  assertAbsent(combinedBody(this), ['premier league appearances', 'signed for', 'career record'], 'off-topic entity');
});

Then('neither analyst should invent goals or clubs for the off-topic entity', function () {
  assertAbsent(combinedBody(this), ['goals', 'scored'], 'off-topic entity');
});

Then('neither analyst should invent a transfer fee for the off-topic entity', function () {
  assertAbsent(combinedBody(this), ['transfer fee'], 'off-topic entity');
});

// ─── SC-027: Ambiguous name in cricket ───────────────────────────────────────

Then('neither analyst should invent Test centuries for the ambiguous entity', function () {
  assertAbsent(combinedBody(this), ['test centuries', 'centuries'], 'ambiguous name cricket');
});

Then('neither analyst should invent batting average or ODI caps for the ambiguous entity', function () {
  assertAbsent(combinedBody(this), ['batting average', 'odi', 'test caps'], 'ambiguous name cricket');
});

// ─── SC-028: Future event ─────────────────────────────────────────────────────

Then('neither analyst should state a confirmed winner for the future event', function () {
  assertAbsent(combinedBody(this), this.currentFixture['must-not-contain'] || [], 'future event');
});

Then('neither analyst should use past tense to describe the future event outcome', function () {
  assertAbsent(combinedBody(this), ['won the 2030', '2030 world cup winner'], 'future event past tense');
});

Then('neither analyst should say the result is definitely decided', function () {
  assertAbsent(combinedBody(this), ['will definitely', 'confirmed', 'is certain', 'is decided'], 'future event certainty');
});

// ─── SC-029: Non-existent match ───────────────────────────────────────────────

Then('neither analyst should name a scorer or match winner for the non-existent match', function () {
  assertAbsent(combinedBody(this), ['scored', 'winning goal', 'match winner'], 'nonexistent match scorer');
});

Then('neither analyst should state a match result or run total for the non-existent match', function () {
  assertAbsent(combinedBody(this), [
    'final result', 'australia beat brazil', 'brazil beat australia', 'run total',
  ], 'nonexistent match result');
});

Then('neither analyst should treat the fabricated fixture as a real event', function () {
  assertAbsent(combinedBody(this), [
    'the match took place', 'in the final', 'australia beat brazil', 'brazil beat australia',
  ], 'nonexistent match treated as real');
});

// ─── SC-030: Contradiction trap ───────────────────────────────────────────────

Then('neither analyst should state the retired player won the 2024 title', function () {
  assertAbsent(combinedBody(this), this.currentFixture['must-not-contain'] || [], 'contradiction trap');
});

Then('neither analyst should describe a final match that did not happen', function () {
  assertAbsent(combinedBody(this), [
    'beat djokovic', 'beat alcaraz', 'won the final', 'federer defeated',
  ], 'fabricated final match');
});

Then('neither analyst should treat the false premise as true', function () {
  assertAbsent(combinedBody(this), [
    'federer defeated', 'won the final', '2024 champion', 'claimed the title',
  ], 'false premise accepted');
});

// ─── SC-031: Knowledge cutoff ─────────────────────────────────────────────────

Then('neither analyst should name a confirmed winner for the post-training event', function () {
  assertAbsent(combinedBody(this), this.currentFixture['must-not-contain'] || [], 'knowledge cutoff');
});

Then('neither analyst should state the outcome in definitive past tense', function () {
  assertAbsent(combinedBody(this), [
    'won the gold', 'defeated', 'claimed the medal', 'gold medallist',
  ], 'knowledge cutoff definitive claim');
});
