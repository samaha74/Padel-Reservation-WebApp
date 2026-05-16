// tests/setup.js
// Runs inside EACH test suite after the Jest environment is ready.
// Reads the MongoMemoryServer URI from the temp file written by globalSetup.

require("dotenv").config();

const mongoose = require("mongoose");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Safe JWT secret for all tests
process.env.JWT_SECRET = "test_jwt_secret_safe";

beforeAll(async () => {
  // Read URI written by globalSetup.js
  const tmpFile = path.join(os.tmpdir(), "padel_test_mongo_uri.txt");
  const uri = fs.readFileSync(tmpFile, "utf8").trim();
  process.env.DATABASE_URL = uri;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}, 30000);

// Wipe all collections between individual tests to prevent bleed-over
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
}, 30000);