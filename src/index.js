const express = require("express");
const fs = require("fs");
require("dotenv").config();
const cors = require("cors");
const connection = require("./config/config");
const routes = require("./routes");
const path = require("path");
const socketIO = require("socket.io");
const http = require("http");
const { initilizeSocket } = require("./utils/socket");

const app = express();

// ==============================
// Allowed Origins
// ==============================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",

  "https://insure-crm-frontend.vercel.app", // ✅ Your Vercel Frontend

  "https://mirai.isyncerp.com",
  "https://insure.isyncerp.com",
  "https://jpinsurancebroker.co.in",
  "http://miraicrm.com",
];

// ==============================
// CORS Configuration
// ==============================
const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman, mobile apps, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

// Handle Preflight Requests
app.options("*", cors(corsOptions));

// ==============================
// Body Parser
// ==============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// ==============================
// Static Files
// ==============================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "public/images"))
);

app.use(
  "/api/images",
  express.static(path.join(__dirname, "public/images"))
);

// ==============================
// Test Route
// ==============================
app.get("/", (req, res) => {
  res.send("✅ CRM Backend is running");
});

// ==============================
// API Routes
// ==============================
app.use("/api", routes);

// ==============================
// Create HTTP Server
// ==============================
const server = http.createServer(app);

// ==============================
// Socket Initialization
// ==============================
initilizeSocket(server);

// ==============================
// Start Server
// ==============================
server.listen(process.env.port, async () => {
  try {
    await connection;

    console.log("✅ Connected to Mongo Atlas");
    console.log(`🚀 Server running on Port ${process.env.port}`);
  } catch (err) {
    console.log("❌ MongoDB Connection Error:", err.message);
  }
});
