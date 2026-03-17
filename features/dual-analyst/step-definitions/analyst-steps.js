const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { runEval, PASS_THRESHOLD } = require('../../../utils/eval-runner');

const VOCAB = {
  football: [
    'goal', 'transfer', 'champions league', 'formation', 'pressing',
    'xg', "ballon d'or", 'striker', 'tactical', 'premier league',
    'midfielder', 'manager', 'penalty', 'offside', 'dribble',
  ],
  cricket: [
    'wicket', 'batting', 'bowling', 'test', 'odi', 't20', 'century',
    'innings', 'pitch', 'spin', 'pace', 'over', 'run', 'boundary',
    'lbw', 'stumped', 'no-ball',
  ],
  tennis: [
    'serve', 'grand slam', 'wimbledon', 'forehand', 'backhand', 'set',
    'break', 'ace', 'net', 'baseline', 'rally', 'match point',
    'tiebreak', 'deuce', 'volley',
  ],
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'in', 'of', 'to', 'who', 'what', 'how', 'why',
  'which', 'has', 'have', 'for', 'at', 'by', 'on', 'was', 'be', 'are',
  'with', 'from', 'will', 'can', 'do', 'does', 'did', 'best', 'most',
]);

function combinedBody(world) {
  return `${world.response.body.analystA || ''} ${world.response.body.analystB || ''}`;
}

function wordOverlap(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = b.toLowerCase().split(/\W+/).filter(Boolean);
  const common = wordsB.filter(w => wordsA.has(w)).length;
  return common / Math.max(wordsA.size, wordsB.length, 1);
}

// ─── SC-001–003, SC-016 ───────────────────────────────────────────────────────

Then('both analysts should respond with content', function () {
  expect(this.response.body.analystA, 'analystA should be a string longer than 50 chars')
    .to.be.a('string').with.length.above(50);
  expect(this.response.body.analystB, 'analystB should be a string longer than 50 chars')
    .to.be.a('string').with.length.above(50);
});

Then('the response should echo back the sport and question', function () {
  expect(this.response.body.sport).to.equal(this.currentFixture.sport);
  expect(this.response.body.question).to.equal(this.currentFixture.question);
});

// ─── SC-017 ───────────────────────────────────────────────────────────────────

Then('the analysts should have different perspectives', function () {
  const a = this.response.body.analystA;
  const b = this.response.body.analystB;
  const overlap = wordOverlap(a, b);
  expect(overlap, `Word overlap is ${overlap.toFixed(2)} — expected below 0.7`).to.be.below(0.7);
});

// ─── SC-017–023: eval scorer (LLM-as-judge) ───────────────────────────────────

Then('the response should be scored by the quality evaluator', async function () {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AI Quality] ANTHROPIC_API_KEY not set — eval runner skipped');
    return;
  }

  this.evalScore = await runEval({
    question: this.currentFixture.question,
    sport:    this.currentFixture.sport,
    analystA: this.response.body.analystA,
    analystB: this.response.body.analystB,
  });

  expect(
    this.evalScore.overall,
    `LLM judge score ${this.evalScore.overall}/10 is below threshold of ${PASS_THRESHOLD}. ` +
    `Reasoning: ${this.evalScore.reasoning}`
  ).to.be.at.least(PASS_THRESHOLD);
});

// ─── SC-018–020: sport vocabulary ────────────────────────────────────────────

Then(/^both analysts should use (football|cricket|tennis) vocabulary$/, function (sport) {
  const bodyStr = combinedBody(this).toLowerCase();
  const terms = VOCAB[sport];
  const found = terms.some(term => bodyStr.includes(term));
  expect(found, `Expected ${sport} vocabulary in response. Checked: ${terms.join(', ')}`).to.be.true;
});

// ─── SC-021 ───────────────────────────────────────────────────────────────────

Then('both analysts should reference the question topic', function () {
  const question = (this.currentFixture.question || '').toLowerCase();
  const keywords = question.split(/\s+/).filter(w => !STOP_WORDS.has(w) && w.length > 3);
  const bodyStr = combinedBody(this).toLowerCase();
  const found = keywords.some(kw => bodyStr.includes(kw));
  expect(
    found,
    `Expected at least one keyword from question in response. Keywords checked: ${keywords.join(', ')}`
  ).to.be.true;
});

Then('neither analyst should give a generic non-specific response', function () {
  const genericPhrases = [
    "i don't have specific",
    "i cannot provide",
    "as an ai language model",
    "i'm sorry, i cannot",
    "i do not have access",
    "i'm unable to",
    "i am not able to",
  ];
  const bodyStr = combinedBody(this).toLowerCase();
  const found = genericPhrases.find(p => bodyStr.includes(p));
  expect(found, `Generic AI refusal detected: "${found}"`).to.be.undefined;
});

// ─── SC-022 ───────────────────────────────────────────────────────────────────

Then('analystA should reflect a tactical perspective', function () {
  const a = this.response.body.analystA.toLowerCase();
  const tacticalTerms = [
    'tactic', 'formation', 'pressing', 'system', 'strategy',
    'position', 'role', 'play', 'style', 'manager', 'coach', 'shape',
  ];
  const found = tacticalTerms.some(t => a.includes(t));
  expect(found, `analystA should contain tactical/strategic language. Checked: ${tacticalTerms.join(', ')}`).to.be.true;
});

Then('analystB should reflect a data and statistics perspective', function () {
  const b = this.response.body.analystB.toLowerCase();
  const dataTerms = [
    'stat', 'data', 'number', 'figure', '%', 'percent', 'average',
    'xg', 'metric', 'record', 'score', 'goal', 'assist', 'rating', 'analytics',
  ];
  const found = dataTerms.some(t => b.includes(t));
  expect(found, `analystB should contain data/statistics language. Checked: ${dataTerms.join(', ')}`).to.be.true;
});

// ─── SC-023 (@blocked) ────────────────────────────────────────────────────────

Then('the factual claims should be consistent across 3 runs', function () {
  return 'pending'; // Blocked pending ANALYST_TEMPERATURE confirmation
});
