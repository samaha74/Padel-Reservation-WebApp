const path = require("path");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const bookingCron = require("./cron/BookingCron");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/database");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const courtRoutes = require("./routes/courtRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

const paymentRoutes = require("./routes/paymentRoutes");

const userRoutes = require("./routes/userRoutes");

const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

bookingCron.startBookingCron();

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/bookings", bookingRoutes);
app.use("/reviews", reviewRoutes);
app.use("/owner", ownerRoutes);
app.use("/courts", courtRoutes);

// ✅ PAYMENT ENDPOINTS
app.use("/payment", paymentRoutes);

// error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image too large (max 5MB)" });
    }
    return res.status(400).json({ message: err.message });
  }

  if (
    err &&
    err.message === "Only JPEG, PNG, GIF, or WebP images are allowed"
  ) {
    return res.status(400).json({ message: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Padel Reservation API",
      version: "1.0.0",
      description: "Swagger documentation for the Padel Reservation WebApp API",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["Player", "Owner", "Admin"] },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
            role: { type: "string", enum: ["Player", "Owner", "Admin"] },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            token: { type: "string" },
          },
        },
        BookingRequest: {
          type: "object",
          required: ["courtId", "startTime", "endTime", "totalPrice"],
          properties: {
            courtId: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            totalPrice: { type: "number" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            court: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            totalPrice: { type: "number" },
            status: {
              type: "string",
              enum: ["Upcoming", "Completed", "Cancelled"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        BookingListResponse: {
          type: "array",
          items: { $ref: "#/components/schemas/Booking" },
        },
        Court: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            location: { type: "string" },
            pricePerHour: { type: "number" },
            surface: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string" },
              // secondaryImages removed
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CourtResponse: {
          type: "object",
          properties: {
            court: { $ref: "#/components/schemas/Court" },
          },
        },
        CourtListResponse: {
          type: "object",
          properties: {
            courts: {
              type: "array",
              items: { $ref: "#/components/schemas/Court" },
            },
          },
        },
        OwnerCourtResponse: {
          type: "object",
          properties: {
            court: { $ref: "#/components/schemas/Court" },
          },
        },
        OwnerCourtsResponse: {
          type: "object",
          properties: {
            courts: {
              type: "array",
              items: { $ref: "#/components/schemas/Court" },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
