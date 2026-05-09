import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  const stackString = stack ? `\n${stack}` : "";
  return `${timestamp} [${level}]: ${message}${metaString}${stackString}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    env.NODE_ENV === "production" ? winston.format.json() : logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    }),
    // In production, also log to files
    ...(env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Log stream for Morgan (HTTP logging)
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Performance monitoring middleware
export const performanceLogger = {
  start: (operation: string) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        logger.debug(`Performance: ${operation} took ${duration}ms`);
        return duration;
      },
    };
  },
};