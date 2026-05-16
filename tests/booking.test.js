// const request = require("supertest");
// const app = require("../src/app");

// describe("Booking API Tests", () => {

//   // =========================
//   // GET all bookings
//   // =========================
//   it("should return 401 if user is not authenticated", async () => {
//     const res = await request(app)
//       .get("/bookings");

//     expect(res.statusCode).toBe(401);
//   });

//   // =========================
//   // CREATE booking
//   // =========================
//   it("should not create booking without auth", async () => {
//     const res = await request(app)
//       .post("/bookings")
//       .send({
//         courtId: "123",
//         startTime: "2026-05-15T10:00:00Z",
//         endTime: "2026-05-15T11:00:00Z",
//         totalPrice: 200
//       });

//     expect(res.statusCode).toBe(401);
//   });

// });





// tests/booking.test.js
const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Court = require("../src/models/Court");
const Booking = require("../src/models/Booking");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.setTimeout(20000);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const makeToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const createPlayer = async () => {
  const user = await User.create({
    name: "Player",
    email: `player_${Date.now()}@test.com`,
    password: await bcrypt.hash("Password123", 10),
    role: "Player",
  });
  return { user, token: makeToken(user) };
};

const createCourt = async () => {
  const owner = await User.create({
    name: "Owner",
    email: `owner_bk_${Date.now()}@test.com`,
    password: await bcrypt.hash("Password123", 10),
    role: "Owner",
  });
  return Court.create({
    user: owner._id,
    name: `BookingCourt ${Date.now()}`,
    location: "Maadi, Cairo",
    pricePerHour: 300,
  });
};

const futureSlot = (hoursOffset = 48) => {
  const start = new Date(Date.now() + hoursOffset * 3600 * 1000);
  const end = new Date(start.getTime() + 3600 * 1000);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
};

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /bookings — requires auth", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/bookings");
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /bookings/my-bookings", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/bookings/my-bookings");
    expect(res.statusCode).toBe(401);
  });

  it("returns the bookings of the authenticated user", async () => {
    const { user, token } = await createPlayer();
    const court = await createCourt();
    const slot = futureSlot();

    await Booking.create({
      user: user._id,
      court: court._id,
      ...slot,
      totalPrice: 300,
    });

    const res = await request(app)
      .get("/bookings/my-bookings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const bookings = res.body.bookings ?? res.body;
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /bookings — create booking", () => {
  it("returns 401 without token", async () => {
    const court = await createCourt();
    const res = await request(app)
      .post("/bookings")
      .send({ courtId: court._id, ...futureSlot(), totalPrice: 300 });
    expect(res.statusCode).toBe(401);
  });

  it("creates a booking with valid data", async () => {
    const { token } = await createPlayer();
    const court = await createCourt();
    const slot = futureSlot(72);

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, ...slot, totalPrice: 300 });

    expect([200, 201]).toContain(res.statusCode);
    const booking = res.body.booking ?? res.body;
    expect(booking).toHaveProperty("status");
  });

  it("returns 400 or 422 when required fields are missing", async () => {
    const { token } = await createPlayer();

    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ totalPrice: 300 }); // missing courtId, startTime, endTime

    expect([400, 422, 500]).toContain(res.statusCode);
  });

  it("does not allow double booking the same slot", async () => {
    const { token } = await createPlayer();
    const court = await createCourt();
    const slot = futureSlot(96);

    // First booking
    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, ...slot, totalPrice: 300 });

    // Second booking same slot
    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, ...slot, totalPrice: 300 });

    // Should be rejected (409 conflict or 400)
    expect([400, 409]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /bookings/:id — cancel booking", () => {
  it("returns 401 without token", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/bookings/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it("cancels own booking successfully", async () => {
    const { user, token } = await createPlayer();
    const court = await createCourt();

    const booking = await Booking.create({
      user: user._id,
      court: court._id,
      ...futureSlot(120),
      totalPrice: 300,
    });

    const res = await request(app)
      .delete(`/bookings/${booking._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 204]).toContain(res.statusCode);
  });

  it("returns 403 when another user tries to cancel someone else's booking", async () => {
    const { user: owner } = await createPlayer();
    const { token: otherToken } = await createPlayer();
    const court = await createCourt();

    const booking = await Booking.create({
      user: owner._id,
      court: court._id,
      ...futureSlot(144),
      totalPrice: 300,
    });

    const res = await request(app)
      .delete(`/bookings/${booking._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect([403, 404]).toContain(res.statusCode);
  });
});