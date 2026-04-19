import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers["x-fngs-public-key"]',
      'req.headers["x-fngs-secret-key"]',
      'req.headers.authorization',
      'headers["x-fngs-public-key"]',
      'headers["x-fngs-secret-key"]',
      '*.publicKey',
      '*.secretKey',
    ],
    censor: '[REDACTED]',
  },
})
