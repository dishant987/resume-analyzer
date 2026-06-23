import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoSanitize from 'mongo-sanitize'
import 'dotenv/config'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'
import apiRoutes from './routes/api.js'
import logger from './utils/logger.js'
import { apiLimiter } from './middleware/rateLimiter.js'

const app = express()
const PORT = process.env.PORT || 5000

// Set security headers
app.use(helmet())

// Prevent NoSQL Injection attacks by sanitizing body, query, and params in-place
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize(req.body)
  }
  if (req.query) {
    const sanitizedQuery = mongoSanitize(req.query)
    for (const key in req.query) {
      if (!(key in sanitizedQuery)) {
        delete req.query[key]
      } else {
        req.query[key] = sanitizedQuery[key]
      }
    }
  }
  if (req.params) {
    const sanitizedParams = mongoSanitize(req.params)
    for (const key in req.params) {
      if (!(key in sanitizedParams)) {
        delete req.params[key]
      } else {
        req.params[key] = sanitizedParams[key]
      }
    }
  }
  next()
})

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Apply rate limiting to all API endpoints
app.use('/api', apiLimiter)

// Custom API logger middleware using Winston
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const userId = req.user ? req.user._id : 'Anonymous'
    const logMsg = `${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms | User: ${userId} | IP: ${req.ip}`
    
    if (res.statusCode >= 500) {
      logger.error(logMsg)
    } else if (res.statusCode >= 400) {
      logger.warn(logMsg)
    } else {
      logger.http(logMsg)
    }
  })
  next()
})

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello API' })
})

app.use('/api', apiRoutes)

app.use(notFound)
app.use(errorHandler)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected')
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err.message}`)
    process.exit(1)
  })
