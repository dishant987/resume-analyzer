import multer from 'multer'
import Resume from '../models/Resume.js'
import DeletedResume from '../models/DeletedResume.js'
import { uploadBuffer } from '../services/cloudinary.js'
import { parsePdf, parseDocx } from '../services/parsers/index.js'
import Analysis from '../models/Analysis.js'
import { analyzeResume, extractPdfTextWithGemini } from '../services/gemini/analyzeService.js'
import fs from 'fs'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = file.originalname.toLowerCase()
    if (ext.endsWith('.pdf')) {
      file.fileType = 'pdf'
      return cb(null, true)
    }
    if (ext.endsWith('.docx')) {
      file.fileType = 'docx'
      return cb(null, true)
    }
    cb(new Error('Only .pdf and .docx files are allowed'))
  },
})

export const uploadMiddleware = upload.single('resume')

export const getResumes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
    const search = (req.query.search || '').trim()

    const filter = { userId: req.user._id, deletedAt: null }
    if (search) {
      filter.originalFilename = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    }

    const [resumes, total] = await Promise.all([
      Resume.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Resume.countDocuments(filter),
    ])

    res.json({
      resumes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    res.json({ resume })
  } catch (err) {
    next(err)
  }
}

export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    )
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    await DeletedResume.create({
      originalId: resume._id,
      userId: resume.userId,
      originalFilename: resume.originalFilename,
      fileUrl: resume.fileUrl,
      cloudinaryPublicId: resume.cloudinaryPublicId,
      fileType: resume.fileType,
      rawText: resume.rawText,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    })

    res.json({ message: 'Resume deleted' })
  } catch (err) {
    next(err)
  }
}

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileType = req.file.originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx'
    const buffer = req.file.buffer

    let rawText = fileType === 'pdf' ? await parsePdf(buffer) : await parseDocx(buffer)

    try {
      fs.writeFileSync(
        'debug_upload.log',
        `TIMESTAMP: ${new Date().toISOString()}\nFILENAME: ${req.file.originalname}\nLOCAL TEXT LENGTH: ${rawText ? rawText.length : 0}\n`
      )
    } catch (err) {
      console.error('Failed to write debug log:', err.message)
    }

    if (fileType === 'pdf' && (!rawText || rawText.trim().length < 150)) {
      console.log('Local PDF text extraction returned insufficient text. Falling back to Gemini OCR...')
      try {
        rawText = await extractPdfTextWithGemini(buffer)
        fs.appendFileSync(
          'debug_upload.log',
          `GEMINI TEXT LENGTH: ${rawText ? rawText.length : 0}\nGEMINI TEXT PREVIEW:\n${rawText}\n`
        )
      } catch (geminiErr) {
        console.error('Gemini PDF text extraction fallback failed:', geminiErr.message)
      }
    }

    if (!rawText || rawText.trim().length < 150) {
      return res.status(400).json({
        message: 'No readable text could be found in this document. Please make sure you are uploading a text-based PDF/Word document rather than a scanned image, photo, or flattened PDF.'
      })
    }

    // Verify if content is indeed a resume
    const analysisData = await analyzeResume(rawText)

    if (analysisData.isResume === false) {
      return res.status(400).json({
        message: 'The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume file.'
      })
    }

    let fileUrl = ''
    let publicId = ''
    try {
      const result = await uploadBuffer(buffer, req.user._id, req.file.originalname)
      fileUrl = result.fileUrl
      publicId = result.publicId
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, saving without remote file:', cloudErr.message)
    }

    const resume = await Resume.create({
      userId: req.user._id,
      originalFilename: req.file.originalname,
      fileUrl,
      cloudinaryPublicId: publicId,
      fileType,
      rawText,
      status: 'analyzed',
    })

    await Analysis.create({
      resumeId: resume._id,
      ...analysisData,
    })

    res.status(201).json({ resume })
  } catch (err) {
    next(err)
  }
}

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 })
    const resumeIds = resumes.map(r => r._id)

    const analyses = await Analysis.find({ resumeId: { $in: resumeIds } })

    const totalResumes = resumes.length
    const analyzedCount = resumes.filter(r => r.status === 'analyzed').length
    const improvedCount = resumes.filter(r => r.status === 'improved').length
    const uploadedCount = resumes.filter(r => r.status === 'uploaded').length

    let avgAts = 0
    let avgGrammar = 0
    let avgSkills = 0
    let avgFormatting = 0
    let avgReadability = 0

    if (analyses.length > 0) {
      avgAts = analyses.reduce((acc, a) => acc + (a.atsScore || 0), 0) / analyses.length
      avgGrammar = analyses.reduce((acc, a) => acc + (a.grammarScore || 0), 0) / analyses.length
      avgSkills = analyses.reduce((acc, a) => acc + (a.skillsScore || 0), 0) / analyses.length
      avgFormatting = analyses.reduce((acc, a) => acc + (a.formattingScore || 0), 0) / analyses.length
      avgReadability = analyses.reduce((acc, a) => acc + (a.readabilityScore || 0), 0) / analyses.length
    }

    const recentActivity = resumes.slice(0, 5).map(r => {
      const correspondingAnalysis = analyses.find(a => a.resumeId.toString() === r._id.toString())
      return {
        _id: r._id,
        filename: r.originalFilename,
        status: r.status,
        score: correspondingAnalysis ? correspondingAnalysis.atsScore : null,
        date: r.createdAt
      }
    })

    res.json({
      totalResumes,
      statusCounts: {
        uploaded: uploadedCount,
        analyzed: analyzedCount,
        improved: improvedCount
      },
      averageScores: {
        atsScore: Math.round(avgAts),
        grammarScore: Math.round(avgGrammar),
        skillsScore: Math.round(avgSkills),
        formattingScore: Math.round(avgFormatting),
        readabilityScore: Math.round(avgReadability)
      },
      recentActivity
    })
  } catch (err) {
    next(err)
  }
}

