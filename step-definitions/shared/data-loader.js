const path = require('path');

function loadFixture(fileName, key) {
  const filePath = path.join(process.cwd(), 'fixtures', `${fileName}.json`);
  delete require.cache[require.resolve(filePath)];
  const data = require(filePath);
  if (key) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      throw new Error(`Fixture key "${key}" not found in fixtures/${fileName}.json`);
    }
    return data[key];
  }
  return data;
}

module.exports = { loadFixture };
