import { Router } from 'express'
import authRoutes from './auth.js'
import resumeRoutes from './resumes.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRoutes)
router.use('/resumes', resumeRoutes)

export default router
