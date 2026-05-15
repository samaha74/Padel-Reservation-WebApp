const request = require("supertest");
const app = require("../src/app");

describe("Booking API Tests", () => {

  // =========================
  // GET all bookings
  // =========================
  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app)
      .get("/bookings");

    expect(res.statusCode).toBe(401);
  });

  // =========================
  // CREATE booking
  // =========================
  it("should not create booking without auth", async () => {
    const res = await request(app)
      .post("/bookings")
      .send({
        courtId: "123",
        startTime: "2026-05-15T10:00:00Z",
        endTime: "2026-05-15T11:00:00Z",
        totalPrice: 200
      });

    expect(res.statusCode).toBe(401);
  });

});