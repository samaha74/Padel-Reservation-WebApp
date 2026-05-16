// tests/globalSetup.js
// Runs ONCE before all test suites (separate process).
// Starts MongoMemoryServer, writes URI to a temp file so test processes can read it.

const { MongoMemoryServer } = require("mongodb-memory-server");
const fs = require("fs");
const os = require("os");
const path = require("path");

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Persist instance reference for globalTeardown
  global.__MONGOD__ = mongod;

  // Write URI to a temp file — the only safe way to pass it to test worker processes
  const tmpFile = path.join(os.tmpdir(), "padel_test_mongo_uri.txt");
  fs.writeFileSync(tmpFile, uri);
};
