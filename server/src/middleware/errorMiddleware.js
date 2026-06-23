import logger from '../utils/logger.js'

export const notFound = (req, res, next) => {
  logger.warn(`Route not found: ${req.originalUrl}`)
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  logger.error(`[API Error] ${req.method} ${req.originalUrl} | Status: ${statusCode} | Error: ${err.message} | Stack: ${err.stack}`)
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}
