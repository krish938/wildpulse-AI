/**
 * middleware/errorHandler.js
 * Centralized error handling middleware for Express.
 *
 * Two handlers are exported:
 * 1. notFoundHandler — catches 404 routes
 * 2. errorHandler — catches all errors passed via next(err)
 */

/**
 * 404 Not Found handler
 * Called when no route matched the incoming request.
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler
 * Express recognizes this as an error handler because it has 4 parameters (err, req, res, next).
 */
const errorHandler = (err, req, res, next) => {
  // Log the error stack in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err.stack || err.message);
  }

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      // Only include stack trace in development
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

module.exports = { notFoundHandler, errorHandler };
