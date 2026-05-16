const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");

jest.setTimeout(15000);

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.DATABASE_URL);
    }
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Auth API Tests", () => {

    it("should register a new user", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                name: "Test User",
                email: `test${Date.now()}@test.com`,
                password: "123456"
            });

        console.log("STATUS:", res.statusCode);
        console.log("BODY:", res.body);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("user");
    });

});