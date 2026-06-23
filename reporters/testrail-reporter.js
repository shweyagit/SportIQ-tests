require('dotenv').config();
const { addResultsForCases, STATUS } = require('../utils/testrail');

// Maps a Playwright test title to a TestRail case ID.
// Convention: include "C<id>" anywhere in the test title, e.g. "Login - C1234"
function extractCaseId(title) {
  const match = title.match(/C(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

class TestRailReporter {
  constructor() {
    this.results = [];
  }

  onTestEnd(test, result) {
    const caseId = extractCaseId(test.title);
    if (!caseId) return;

    const statusMap = {
      passed: STATUS.passed,
      failed: STATUS.failed,
      skipped: STATUS.skipped,
      timedOut: STATUS.failed,
    };

    const status_id = statusMap[result.status] ?? STATUS.failed;
    const errors = result.errors.map((e) => e.message).join('\n');
    const comment = result.status === 'passed'
      ? `Test passed in ${result.duration}ms`
      : `Test ${result.status}:\n${errors}`;

    this.results.push({ case_id: caseId, status_id, comment });
  }

  async onEnd() {
    if (this.results.length === 0) {
      console.log('[TestRail] No results with TestRail case IDs found. Skipping upload.');
      return;
    }

    const runId = process.env.TESTRAIL_RUN_ID;
    if (!runId) {
      console.warn('[TestRail] TESTRAIL_RUN_ID not set. Skipping upload.');
      return;
    }

    try {
      await addResultsForCases(runId, this.results);
      console.log(`[TestRail] Uploaded ${this.results.length} result(s) to run #${runId}`);
    } catch (err) {
      console.error('[TestRail] Failed to upload results:', err.response?.data ?? err.message);
    }
  }
}

module.exports = TestRailReporter;
