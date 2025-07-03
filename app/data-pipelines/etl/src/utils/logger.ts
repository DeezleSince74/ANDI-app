/**
 * Structured logger for ETL processes
 */

import winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(component: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, component: comp, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            component: comp || component,
            message,
            ...meta
          });
        })
      ),
      defaultMeta: { component },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, component: comp, message }) => {
              return `${timestamp} [${comp || component}] ${level}: ${message}`;
            })
          )
        })
      ]
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}