// Portfolio Sample - Backend Entry File
// Tech: Node.js + Express + MySQL + Session Management

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const app = express();
const PORT = process.env.PORT || 3001;

/* ===============================
   Global Error & Exception Handling
================================== */

// Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

// Unhandled Promise Rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

/* ===============================
   Middleware Configuration
================================== */

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.disable("x-powered-by");

/* ===============================
   Session Configuration
================================== */

const sessionStore = new MySQLStore({
  expiration: 1000 * 60 * 30, // 30 minutes
  createDatabaseTable: false
});

app.use(session({
  key: "portfolio_session",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 30
  }
}));

/* ===============================
   Role-Based Authorization Middleware
================================== */

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.session?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    next();
  };
};

/* ===============================
   Sample Routes
================================== */

// Authentication route
app.post("/api/auth/login", (req, res) => {
  // Sample login logic (sanitized)
  req.session.role = "ADMIN";

  res.json({
    success: true,
    message: "Login successful"
  });
});

// Protected route example
app.get("/api/admin/dashboard", authorize(["ADMIN"]), (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Admin Dashboard"
  });
});

// Public health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running"
  });
});

/* ===============================
   404 Handler
================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

/* ===============================
   Global Error Handler
================================== */

app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

/* ===============================
   Server Start
================================== */

app.listen(PORT, () => {
  console.log(`Portfolio backend running on port ${PORT}`);
});
