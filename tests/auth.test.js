// const mongoose = require("mongoose");
// const request = require("supertest");
// const app = require("../src/app");

// jest.setTimeout(15000);

// beforeAll(async () => {
//     if (mongoose.connection.readyState === 0) {
//         await mongoose.connect(process.env.DATABASE_URL);
//     }
// });

// afterAll(async () => {
//     await mongoose.connection.close();
// });

// describe("Auth API Tests", () => {

//     it("should register a new user", async () => {
//         const res = await request(app)
//             .post("/auth/register")
//             .send({
//                 name: "Test User",
//                 email: `test${Date.now()}@test.com`,
//                 password: "123456"
//             });

//         console.log("STATUS:", res.statusCode);
//         console.log("BODY:", res.body);

//         expect(res.statusCode).toBe(201);
//         expect(res.body).toHaveProperty("user");
//     });

// });



// tests/auth.test.js
const request = require("supertest");
const app = require("../src/app");

jest.setTimeout(20000);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: register a user and return { token, userId }
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = async (overrides = {}) => {
  const payload = {
    name: "Test Player",
    email: `player_${Date.now()}@test.com`,
    password: "Password123",
    role: "Player",
    ...overrides,
  };
  const res = await request(app).post("/auth/register").send(payload);
  return { res, token: res.body.token, userId: res.body.user?.id };
};

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /auth/register", () => {
  it("registers a new user and returns 201 with token", async () => {
    const { res } = await registerUser();
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ role: "Player" });
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "missing@test.com" }); // no name or password
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("returns 409 when email is already registered", async () => {
    const email = `dup_${Date.now()}@test.com`;
    await registerUser({ email });
    const { res } = await registerUser({ email }); // second attempt same email
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it("registers an Owner role correctly", async () => {
    const { res } = await registerUser({ role: "Owner" });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe("Owner");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /auth/login", () => {
  it("logs in with correct credentials and returns token", async () => {
    const email = `login_${Date.now()}@test.com`;
    await registerUser({ email });

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "Password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(email);
  });

  it("returns 401 with wrong password", async () => {
    const email = `wrongpw_${Date.now()}@test.com`;
    await registerUser({ email });

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "WrongPassword!" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it("returns 401 with non-existent email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@nowhere.com", password: "anything" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when email or password is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "only@email.com" }); // no password
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /auth/me", () => {
  it("returns the current user profile with valid token", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("email");
    expect(res.body.user).not.toHaveProperty("password"); // password never exposed
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 with a fake token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer totally.fake.token");
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /auth/me", () => {
  it("updates name and email of the authenticated user", async () => {
    const { token } = await registerUser();
    const newEmail = `updated_${Date.now()}@test.com`;

    const res = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name", email: newEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe("Updated Name");
  });

  it("returns 401 if not authenticated", async () => {
    const res = await request(app)
      .put("/auth/me")
      .send({ name: "No Auth" });
    expect(res.statusCode).toBe(401);
  });
});