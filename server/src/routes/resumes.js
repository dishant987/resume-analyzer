import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { uploadMiddleware, uploadResume, getResumes, getResume, deleteResume, getDashboardAnalytics } from '../controllers/resumeController.js'
import {
  analyzeResumeById, improveResumeById, getAnalysis, getVersions, saveVersion,
  matchResumeToJd, getJobMatches, deleteJobMatch,
  generateCoverLetterForResume, getCoverLetters, deleteCoverLetter,
  getInterviewPrepForResume, regenerateInterviewPrepForResume,
  getRoadmapByResumeId, generateRoadmapForResume, deleteRoadmap,
  getSalaryNegotiationsByResume, getSalaryNegotiationById, createSalaryNegotiation, sendNegotiationMessage, deleteSalaryNegotiation
} from '../controllers/geminiController.js'
import { downloadDocx, downloadPdf, previewHtml } from '../controllers/exportController.js'
import { aiLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.get('/', protect, getResumes)
router.get('/analytics/stats', protect, getDashboardAnalytics)
router.get('/:id', protect, getResume)
router.post('/upload', protect, uploadMiddleware, uploadResume)
router.post('/:id/analyze', protect, aiLimiter, analyzeResumeById)

// Match JD routes
router.post('/:id/match-jd', protect, aiLimiter, matchResumeToJd)
router.get('/:id/matches', protect, getJobMatches)
router.delete('/:id/matches/:matchId', protect, deleteJobMatch)

// Cover letter routes
router.post('/:id/cover-letter', protect, aiLimiter, generateCoverLetterForResume)
router.get('/:id/cover-letters', protect, getCoverLetters)
router.delete('/:id/cover-letters/:clId', protect, deleteCoverLetter)

// Interview Prep routes
router.get('/:id/interview-prep', protect, getInterviewPrepForResume)
router.post('/:id/interview-prep', protect, aiLimiter, regenerateInterviewPrepForResume)
router.post('/:id/interview-prep/regenerate', protect, aiLimiter, regenerateInterviewPrepForResume)

// Career Roadmap routes
router.get('/:id/roadmap', protect, getRoadmapByResumeId)
router.post('/:id/roadmap', protect, aiLimiter, generateRoadmapForResume)
router.delete('/:id/roadmap/:roadmapId', protect, deleteRoadmap)

// Salary Negotiation routes
router.get('/:id/salary-negotiations', protect, getSalaryNegotiationsByResume)
router.get('/:id/salary-negotiations/:negId', protect, getSalaryNegotiationById)
router.post('/:id/salary-negotiations', protect, aiLimiter, createSalaryNegotiation)
router.post('/:id/salary-negotiations/:negId/chat', protect, aiLimiter, sendNegotiationMessage)
router.delete('/:id/salary-negotiations/:negId', protect, deleteSalaryNegotiation)

router.get('/:id/analysis', protect, getAnalysis)
router.post('/:id/fix', protect, aiLimiter, improveResumeById)
router.get('/:id/versions', protect, getVersions)
router.post('/:id/versions', protect, saveVersion)
router.get('/:id/export/docx', protect, downloadDocx)
router.get('/:id/export/pdf', protect, downloadPdf)
router.get('/:id/export/preview', protect, previewHtml)
router.delete('/:id', protect, deleteResume)

export default router
