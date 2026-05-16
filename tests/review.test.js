// tests/review.test.js
const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Court = require("../src/models/Court");
const Review = require("../src/models/Reviews");
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

const createUser = async (role = "Player") => {
  const user = await User.create({
    name: "User",
    email: `rv_${role}_${Date.now()}@test.com`,
    password: await bcrypt.hash("Password123", 10),
    role,
  });
  return { user, token: makeToken(user) };
};

const createCourt = async () => {
  const { user: owner } = await createUser("Owner");
  return Court.create({
    user: owner._id,
    name: `ReviewCourt ${Date.now()}`,
    location: "Zamalek, Cairo",
    pricePerHour: 400,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /reviews/court/:courtId", () => {
  it("returns 200 and array of reviews (public endpoint)", async () => {
    const court = await createCourt();
    const res = await request(app).get(`/reviews/court/${court._id}`);
    expect(res.statusCode).toBe(200);
    const reviews = res.body.reviews ?? res.body;
    expect(Array.isArray(reviews)).toBe(true);
  });

  it("returns empty array for court with no reviews", async () => {
    const court = await createCourt();
    const res = await request(app).get(`/reviews/court/${court._id}`);
    const reviews = res.body.reviews ?? res.body;
    expect(reviews.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /reviews — submit review", () => {
  it("returns 401 without token", async () => {
    const court = await createCourt();
    const res = await request(app)
      .post("/reviews")
      .send({ courtId: court._id, rating: 4, comment: "Great!" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when rating is missing", async () => {
    const { token } = await createUser();
    const court = await createCourt();

    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, comment: "No rating" });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when rating is out of range", async () => {
    const { token } = await createUser();
    const court = await createCourt();

    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, rating: 10 });

    expect(res.statusCode).toBe(400);
  });

  it("creates a review successfully with rating + comment", async () => {
    const { token } = await createUser();
    const court = await createCourt();

    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, rating: 5, comment: "Excellent court!" });

    expect(res.statusCode).toBe(201);
    expect(res.body.review).toHaveProperty("rating", 5);
  });

  it("creates a review with rating only (no comment)", async () => {
    const { token } = await createUser();
    const court = await createCourt();

    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, rating: 3 });

    expect(res.statusCode).toBe(201);
  });

  it("prevents duplicate review — same user same court returns 409", async () => {
    const { token } = await createUser();
    const court = await createCourt();

    await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, rating: 4, comment: "First review" });

    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ courtId: court._id, rating: 5, comment: "Second review" });

    expect(res.statusCode).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /reviews/:id — edit own review", () => {
  it("returns 401 without token", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/reviews/${fakeId}`)
      .send({ rating: 3 });
    expect(res.statusCode).toBe(401);
  });

  it("allows author to edit their review", async () => {
    const { user, token } = await createUser();
    const court = await createCourt();

    const review = await Review.create({
      user: user._id,
      court: court._id,
      rating: 3,
      comment: "Original comment",
    });

    const res = await request(app)
      .put(`/reviews/${review._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 5, comment: "Updated comment" });

    expect(res.statusCode).toBe(200);
    expect(res.body.review.rating).toBe(5);
    expect(res.body.review.comment).toBe("Updated comment");
  });

  it("returns 403 when another user tries to edit the review", async () => {
    const { user } = await createUser();
    const { token: otherToken } = await createUser();
    const court = await createCourt();

    const review = await Review.create({
      user: user._id,
      court: court._id,
      rating: 4,
      comment: "Someone else's review",
    });

    const res = await request(app)
      .put(`/reviews/${review._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ rating: 1 });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/your own/i);
  });

  it("returns 404 for non-existent review", async () => {
    const { token } = await createUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/reviews/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 2 });

    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /reviews/:id — delete own review", () => {
  it("returns 401 without token", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/reviews/${fakeId}`);
    expect(res.statusCode).toBe(401);
  });

  it("allows author to delete their review", async () => {
    const { user, token } = await createUser();
    const court = await createCourt();

    const review = await Review.create({
      user: user._id,
      court: court._id,
      rating: 4,
      comment: "To be deleted",
    });

    const res = await request(app)
      .delete(`/reviews/${review._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 204]).toContain(res.statusCode);

    // Confirm it's gone from DB
    const gone = await Review.findById(review._id);
    expect(gone).toBeNull();
  });

  it("returns 403 when another user tries to delete review", async () => {
    const { user } = await createUser();
    const { token: otherToken } = await createUser();
    const court = await createCourt();

    const review = await Review.create({
      user: user._id,
      court: court._id,
      rating: 5,
      comment: "Protected review",
    });

    const res = await request(app)
      .delete(`/reviews/${review._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);

    // Confirm it still exists
    const still = await Review.findById(review._id);
    expect(still).not.toBeNull();
  });

  it("returns 404 for non-existent review", async () => {
    const { token } = await createUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/reviews/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});
