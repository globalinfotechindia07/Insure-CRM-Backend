/**
 * Centralized Global Error Handling Middleware for Express.
 * Catches Mongoose errors, CastErrors, ValidationErrors, Duplicate Key Errors, and generic runtime exceptions.
 */
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Global Backend Error Handler caught error:", err);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";
  let errorDetail = err.error || err.message;

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = "Validation Error";
    errorDetail = errors.join(", ");
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId or invalid number)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for field "${err.path}"`;
    errorDetail = `Cast to ${err.kind} failed for value "${err.value}" at path "${err.path}"`;
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const keys = Object.keys(err.keyValue || {});
    message = "Duplicate Record Error";
    errorDetail = `A record with duplicate ${keys.join(", ")} already exists in the database.`;
  }

  return res.status(statusCode).json({
    success: false,
    status: "false",
    message: message,
    error: errorDetail
  });
};

module.exports = errorHandler;
