// tests/globalTeardown.js
// Runs ONCE after all test suites finish.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  // Stop the server
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }

  // Clean up the temp URI file
  const tmpFile = path.join(os.tmpdir(), "padel_test_mongo_uri.txt");
  try { fs.unlinkSync(tmpFile); } catch (_) {}
};