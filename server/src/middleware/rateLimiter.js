import rateLimit from 'express-rate-limit'
import logger from '../utils/logger.js'

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: IP ${req.ip} -> ${req.method} ${req.originalUrl}`)
    res.status(options.statusCode).send(options.message)
  }
})

// Authentication Rate Limiter (Brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth Rate limit exceeded: IP ${req.ip} -> ${req.method} ${req.originalUrl}`)
    res.status(options.statusCode).send(options.message)
  }
})

// AI and Gemini Generation Rate Limiter (Cost protection)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 heavy AI generations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'AI generation limit reached for this hour. Please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`AI API Rate limit exceeded: IP ${req.ip} -> ${req.method} ${req.originalUrl}`)
    res.status(options.statusCode).send(options.message)
  }
})
