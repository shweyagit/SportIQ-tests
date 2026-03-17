// Step definitions are split into two locations:
//   step-definitions/shared/          ← reusable across all features
//   features/<feature-name>/step-definitions/  ← isolated to that feature only

const SHARED  = 'step-definitions/shared/*.js';
const DUAL    = 'features/dual-analyst/step-definitions/*.js';

module.exports = {
  default: {
    require: [SHARED, DUAL],
    paths: ['features/dual-analyst/**/*.feature'],
    tags: 'not @performance',
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    publishQuiet: true,
  },

  // CI — P1 only, retry 2, skip performance and blocked
  ci: {
    require: [SHARED, DUAL],
    paths: ['features/dual-analyst/**/*.feature'],
    tags: '@p1 and not @blocked and not @performance',
    retry: 2,
    format: ['progress-bar', 'json:reports/cucumber-report-ci.json'],
    publishQuiet: true,
  },

  // Security — retry 0 always (failures are real, never flaky)
  security: {
    require: [SHARED, DUAL],
    paths: ['features/dual-analyst/security.feature'],
    tags: 'not @blocked',
    retry: 0,
    format: ['progress-bar', 'json:reports/cucumber-report-security.json'],
    publishQuiet: true,
  },

  // AI quality + hallucination — retry 3 for non-determinism
  'ai-quality': {
    require: [SHARED, DUAL],
    paths: [
      'features/dual-analyst/ai-quality.feature',
      'features/dual-analyst/hallucination.feature',
    ],
    tags: 'not @blocked',
    retry: 3,
    format: ['progress-bar', 'json:reports/cucumber-report-ai.json'],
    publishQuiet: true,
  },
};
