require('dotenv').config();
const axios = require('axios');

const client = axios.create({
  baseURL: `${process.env.TESTRAIL_URL}index.php?/api/v2`,
  auth: {
    username: process.env.TESTRAIL_USERNAME,
    password: process.env.TESTRAIL_API_KEY,
  },
  headers: { 'Content-Type': 'application/json' },
});

// Status IDs in TestRail: 1=Passed, 5=Failed, 2=Blocked, 4=Retest
const STATUS = {
  passed: 1,
  failed: 5,
  skipped: 4,
};

async function addResultForCase(runId, caseId, status, comment = '') {
  const statusId = STATUS[status] ?? STATUS.failed;
  const response = await client.post(`/add_result_for_case/${runId}/${caseId}`, {
    status_id: statusId,
    comment,
  });
  return response.data;
}

async function addResultsForCases(runId, results) {
  // results: [{ case_id, status_id, comment }]
  const response = await client.post(`/add_results_for_cases/${runId}`, { results });
  return response.data;
}

async function getTestRun(runId) {
  const response = await client.get(`/get_run/${runId}`);
  return response.data;
}

async function createTestRun(projectId, name, caseIds = []) {
  const payload = { name, include_all: caseIds.length === 0 };
  if (caseIds.length > 0) payload.case_ids = caseIds;
  const response = await client.post(`/add_run/${projectId}`, payload);
  return response.data;
}

module.exports = { addResultForCase, addResultsForCases, getTestRun, createTestRun, STATUS };
