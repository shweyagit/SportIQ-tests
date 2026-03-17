require('dotenv').config();
const axios = require('axios');

const client = axios.create({
  baseURL: `${process.env.JIRA_BASE_URL}/rest/api/3`,
  auth: {
    username: process.env.JIRA_EMAIL,
    password: process.env.JIRA_API_TOKEN,
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

async function createBug(summary, description, labels = []) {
  const response = await client.post('/issue', {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description }],
          },
        ],
      },
      issuetype: { name: 'Bug' },
      labels,
    },
  });
  return response.data;
}

async function getIssue(issueKey) {
  const response = await client.get(`/issue/${issueKey}`);
  return response.data;
}

async function transitionIssue(issueKey, transitionId) {
  await client.post(`/issue/${issueKey}/transitions`, {
    transition: { id: transitionId },
  });
}

async function addComment(issueKey, comment) {
  const response = await client.post(`/issue/${issueKey}/comment`, {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: comment }],
        },
      ],
    },
  });
  return response.data;
}

async function searchIssues(jql, maxResults = 50) {
  const response = await client.get('/search', {
    params: { jql, maxResults },
  });
  return response.data;
}

module.exports = { createBug, getIssue, transitionIssue, addComment, searchIssues };
