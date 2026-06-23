import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { uploadMiddleware, uploadResume, getResumes, getResume, deleteResume, getDashboardAnalytics } from '../controllers/resumeController.js'
import { analyzeResumeById, improveResumeById, getAnalysis, getVersions, saveVersion, matchResumeToJd, generateCoverLetterForResume, getInterviewPrepForResume } from '../controllers/geminiController.js'
import { downloadDocx, downloadPdf, previewHtml } from '../controllers/exportController.js'

const router = Router()

router.get('/', protect, getResumes)
router.get('/analytics/stats', protect, getDashboardAnalytics)
router.get('/:id', protect, getResume)
router.post('/upload', protect, uploadMiddleware, uploadResume)
router.post('/:id/analyze', protect, analyzeResumeById)
router.post('/:id/match-jd', protect, matchResumeToJd)
router.post('/:id/cover-letter', protect, generateCoverLetterForResume)
router.get('/:id/interview-prep', protect, getInterviewPrepForResume)
router.get('/:id/analysis', protect, getAnalysis)
router.post('/:id/fix', protect, improveResumeById)
router.get('/:id/versions', protect, getVersions)
router.post('/:id/versions', protect, saveVersion)
router.get('/:id/export/docx', protect, downloadDocx)
router.get('/:id/export/pdf', protect, downloadPdf)
router.get('/:id/export/preview', protect, previewHtml)
router.delete('/:id', protect, deleteResume)

export default router
