const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const schema = require('../schemas/analyse');

const { required, fields } = schema.response;

Then('the response should match the analyst schema', function () {
  const body = this.response.body;
  required.forEach(field => {
    expect(body, `Response missing field: "${field}"`).to.have.property(field);
    expect(body[field], `Field "${field}" should be a non-empty string`)
      .to.be.a(fields[field]).with.length.above(0);
  });
});

Then('the response should contain no additional fields', function () {
  Object.keys(this.response.body).forEach(field => {
    expect(required, `Unexpected field in response: "${field}"`).to.include(field);
  });
});

Then('the response sport should match the request sport exactly', function () {
  expect(this.response.body.sport).to.equal(this.currentFixture.sport);
});

Then('the response question should match the request question exactly', function () {
  expect(this.response.body.question).to.equal(this.currentFixture.question);
});
