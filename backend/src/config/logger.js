const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const logDir = path.join(__dirname, "..", "..", "logs");
fs.mkdirSync(logDir, { recursive: true });

const level = process.env.LOG_LEVEL || "info";
const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level,
  format: logFormat,
  transports: [
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
    new transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});

if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level: lvl, message, timestamp, ...meta }) => {
          const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `[${timestamp}] ${lvl}: ${message}${rest}`;
        })
      ),
    })
  );
}

module.exports = logger;
