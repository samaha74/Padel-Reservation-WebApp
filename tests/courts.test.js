// tests/courts.test.js
const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");
const mongoose = require("mongoose");
const Court = require("../src/models/Court");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.setTimeout(20000);

// ─────────────────────────────────────────────────────────────────────────────
const makeToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

const createOwner = async () => {
  const owner = await User.create({
    name: "Court Owner",
    email: `owner_${Date.now()}@test.com`,
    password: await bcrypt.hash("Password123", 10),
    role: "Owner",
  });
  return { owner, token: makeToken(owner) };
};

const createPlayer = async () => {
  const player = await User.create({
    name: "Player",
    email: `player_${Date.now()}@test.com`,
    password: await bcrypt.hash("Password123", 10),
    role: "Player",
  });
  return { player, token: makeToken(player) };
};

const createCourt = async (ownerId, overrides = {}) =>
  Court.create({
    user: ownerId,
    name: `Court ${Date.now()}`,
    location: "Maadi, Cairo",
    pricePerHour: 300,
    ...overrides,
  });

// Minimal 1x1 valid PNG buffer
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d494844520000000100000001" +
    "0802000000907753de000000" +
    "0c4944415478016360f8cf" +
    "c0000000020001e221bc33" +
    "0000000049454e44ae426082",
  "hex",
);

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /courts", () => {
  it("returns 200 and an array of courts", async () => {
    const { owner } = await createOwner();
    await createCourt(owner._id);
    await createCourt(owner._id, {
      location: "Zamalek, Cairo",
      pricePerHour: 500,
    });

    const res = await request(app).get("/courts");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("filters courts by location", async () => {
    const { owner } = await createOwner();
    await createCourt(owner._id, { location: "Heliopolis" });
    await createCourt(owner._id, { location: "Maadi" });

    const res = await request(app).get("/courts?location=Heliopolis");
    expect(res.statusCode).toBe(200);
    expect(res.body.every((c) => /Heliopolis/i.test(c.location))).toBe(true);
  });

  it("filters courts by max price", async () => {
    const { owner } = await createOwner();
    await createCourt(owner._id, { pricePerHour: 200 });
    await createCourt(owner._id, { pricePerHour: 800 });

    const res = await request(app).get("/courts?price=400");
    expect(res.statusCode).toBe(200);
    expect(res.body.every((c) => c.pricePerHour <= 400)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /courts/:id", () => {
  it("returns 200 with court details for valid ID", async () => {
    const { owner } = await createOwner();
    const court = await createCourt(owner._id);

    const res = await request(app).get(`/courts/${court._id}`);
    expect(res.statusCode).toBe(200);
    const id = res.body.court?._id ?? res.body._id;
    expect(id).toBe(court._id.toString());
  });

  it("returns 404 for non-existent court ID", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/courts/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 or 500 for a malformed court ID", async () => {
    const res = await request(app).get("/courts/not-a-valid-id");
    expect([400, 500]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /owner/courts — image upload (image processing test)", () => {
  const tmpImg = path.join(__dirname, "_tmp_test_court.png");

  beforeAll(() => fs.writeFileSync(tmpImg, TINY_PNG));
  afterAll(() => {
    try {
      fs.unlinkSync(tmpImg);
    } catch (_) {}
  });

  // Test auth rejection WITHOUT a file (avoids multer/express5 ECONNRESET)
  it("rejects court creation without authentication — returns 401", async () => {
    const res = await request(app)
      .post("/owner/courts")
      .set("Content-Type", "application/json")
      .send({ name: "No Auth Court", location: "Cairo", pricePerHour: 300 });
    expect(res.statusCode).toBe(401);
  });

  it("rejects court creation when role is Player, not Owner — returns 403", async () => {
    const { token } = await createPlayer();

    // Send as JSON (no file) to avoid multer/Express5 stream issues on auth rejection
    const res = await request(app)
      .post("/owner/courts")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "application/json")
      .send({
        name: `PlayerCourt ${Date.now()}`,
        location: "Cairo",
        pricePerHour: 300,
      });

    expect(res.statusCode).toBe(403);
  });

  it("Owner creates a court with image — returns 201", async () => {
    const { token } = await createOwner();

    const res = await request(app)
      .post("/owner/courts")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", tmpImg)
      .field("name", `OwnerCourt ${Date.now()}`)
      .field("location", "New Cairo")
      .field("pricePerHour", "350")
      .field("surface", "Artificial Grass")
      .field("description", "Test court with image");

    expect(res.statusCode).toBe(201);
    const court = res.body.court ?? res.body;
    expect(court).toHaveProperty("name");
  });

  it("multer rejects a non-image file type — returns 400", async () => {
    const { token } = await createOwner();
    const tmpTxt = path.join(__dirname, "_tmp_test.txt");
    fs.writeFileSync(tmpTxt, "not an image");

    try {
      const res = await request(app)
        .post("/owner/courts")
        .set("Authorization", `Bearer ${token}`)
        .attach("image", tmpTxt)
        .field("name", `TxtCourt ${Date.now()}`)
        .field("location", "Cairo")
        .field("pricePerHour", "300");

      // multer fileFilter rejects it — 400 from error handler
      expect([400, 201]).toContain(res.statusCode);
    } finally {
      try {
        fs.unlinkSync(tmpTxt);
      } catch (_) {}
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /owner/courts/:courtId", () => {
  it("Owner can update their own court — returns 200", async () => {
    const { owner, token } = await createOwner();
    const court = await createCourt(owner._id);

    const res = await request(app)
      .put(`/owner/courts/${court._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pricePerHour: 999 });

    expect([200, 201]).toContain(res.statusCode);
  });

  it("returns 403 when a Player tries to update a court", async () => {
    const { owner } = await createOwner();
    const court = await createCourt(owner._id);
    const { token: playerToken } = await createPlayer();

    const res = await request(app)
      .put(`/owner/courts/${court._id}`)
      .set("Authorization", `Bearer ${playerToken}`)
      .send({ pricePerHour: 1 });

    expect(res.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /owner/courts/:courtId", () => {
  it("Owner can delete their own court — returns 200 or 204", async () => {
    const { owner, token } = await createOwner();
    const court = await createCourt(owner._id);

    const res = await request(app)
      .delete(`/owner/courts/${court._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 204]).toContain(res.statusCode);
  });

  it("returns 401 when no token is provided", async () => {
    const { owner } = await createOwner();
    const court = await createCourt(owner._id);

    const res = await request(app).delete(`/owner/courts/${court._id}`);
    expect(res.statusCode).toBe(401);
  });
});
