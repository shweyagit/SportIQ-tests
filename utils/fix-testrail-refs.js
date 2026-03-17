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

const PROJECT_ID = process.env.TESTRAIL_PROJECT_ID;

async function getAllCases() {
  const response = await client.get(`/get_cases/${PROJECT_ID}`);
  return response.data.cases ?? response.data;
}

async function updateCaseRefs(caseId, refs) {
  const response = await client.post(`/update_case/${caseId}`, { refs });
  return response.data;
}

async function run() {
  console.log(`Fetching all cases for project ${PROJECT_ID}...`);
  const cases = await getAllCases();
  console.log(`Found ${cases.length} cases.`);

  // Only update cases with no refs or refs containing SCRUM-13
  // Leave any other existing references untouched
  const toUpdate = cases.filter(c => !c.refs || c.refs.includes('SCRUM-13'));
  console.log(`Cases to update (no refs or SCRUM-13): ${toUpdate.length}`);

  for (const c of toUpdate) {
    console.log(`  Updating C${c.id} (was: "${c.refs ?? 'empty'}") → SCRUM-14`);
    await updateCaseRefs(c.id, 'SCRUM-14');
  }

  const skipped = cases.filter(c => c.refs && !c.refs.includes('SCRUM-13') && c.refs !== 'SCRUM-14');
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} cases with existing non-SCRUM-13 references:`);
    skipped.forEach(c => console.log(`  C${c.id} — refs: "${c.refs}" (left unchanged)`));
  }

  console.log('Done. All cases now reference SCRUM-14.');
}

run().catch(err => {
  console.error('Error:', err.response?.data ?? err.message);
  process.exit(1);
});
