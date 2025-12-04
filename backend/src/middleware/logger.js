const logger = require("../config/logger");

// Logs each request with status and duration
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info("http_request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id,
      ip: req.ip,
    });
  });
  next();
}

// Logs uncaught errors
// eslint-disable-next-line no-unused-vars
function errorLogger(err, req, res, next) {
  logger.error("unhandled_error", {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    status: err.status || 500,
  });

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  return res.status(status).json({
    message: err.expose ? err.message : "Internal server error",
  });
}

module.exports = {
  requestLogger,
  errorLogger,
};
