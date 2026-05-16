const request = require("supertest");
const app = require("../src/app");
const Court = require("../src/models/Court");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");

async function registerAndLogin(email, role = "Owner") {
  const hashedPassword = await bcrypt.hash("password123", 10);
  await User.create({
    name: "Owner",
    email,
    password: hashedPassword,
    role,
  });
  const loginRes = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });
  return { token: loginRes.body.token, userId: loginRes.body.user.id };
}

describe("Image Processing Tests", () => {

  it("Court imageUrl — should store and return a valid image URL", async () => {
    const { userId } = await registerAndLogin("owner@img.com");

    const imageUrl = "https://example.com/court.jpg";

    const court = await Court.create({
      user: userId,
      name: "Photo Court",
      location: "Maadi, Cairo",
      pricePerHour: 120,
      isActive: true,
      imageUrl,
    });

    const res = await request(app).get(`/courts/${court._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.imageUrl).toBe(imageUrl);
  });

  it("Court imageUrl — should work without an image URL (optional field)", async () => {
    const { userId } = await registerAndLogin("owner2@img.com");

    const court = await Court.create({
      user: userId,
      name: "No Photo Court",
      location: "Nasr City, Cairo",
      pricePerHour: 80,
      isActive: true,
      // no imageUrl
    });

    const res = await request(app).get(`/courts/${court._id}`);

    expect(res.statusCode).toBe(200);
    // imageUrl should be undefined or empty — court still works fine
    expect(res.body.name).toBe("No Photo Court");
  });

  it("Court imageUrl — should handle a base64 image string", async () => {
    const { userId } = await registerAndLogin("owner3@img.com");

    // Simulate a small base64 image (like what the frontend sends)
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const court = await Court.create({
      user: userId,
      name: "Base64 Court",
      location: "Maadi, Cairo",
      pricePerHour: 90,
      isActive: true,
      imageUrl: base64Image,
    });

    const res = await request(app).get(`/courts/${court._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.imageUrl).toBe(base64Image);
  });
});