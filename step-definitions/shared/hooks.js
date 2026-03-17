const { BeforeAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const pactum = require('pactum');
require('dotenv').config();

// AI LLM calls can take 10-20s — set both Cucumber and pactum timeouts
setDefaultTimeout(60000);

BeforeAll(async function () {
  pactum.request.setBaseUrl(process.env.BASE_URL || 'http://localhost:3000');
  pactum.request.setDefaultTimeout(30000);
});

Before(function () {
  this.requestSpec = null;
  this.response = null;
  this.evalScore = null;
  this.currentFixture = null;
});
