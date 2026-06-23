import Resume from '../models/Resume.js'
import Analysis from '../models/Analysis.js'
import ResumeVersion from '../models/ResumeVersion.js'
import { analyzeResume } from '../services/gemini/analyzeService.js'
import { improveResume } from '../services/gemini/improveService.js'
import { matchResume } from '../services/gemini/matchService.js'
import { createCoverLetter } from '../services/gemini/coverLetterService.js'
import { generateInterviewQuestions } from '../services/gemini/interviewService.js'

export const analyzeResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }

    const analysisData = await analyzeResume(resume.rawText)

    if (analysisData.isResume === false) {
      resume.status = 'failed'
      await resume.save()
      return res.status(400).json({
        message: 'The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume file.'
      })
    }

    const analysis = await Analysis.create({
      resumeId: resume._id,
      ...analysisData,
    })

    resume.status = 'analyzed'
    await resume.save()

    res.json({ analysis })
  } catch (err) {
    next(err)
  }
}

export const improveResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const analysis = await Analysis.findOne({ resumeId: resume._id }).sort({ createdAt: -1 })
    if (!analysis) {
      return res.status(400).json({ message: 'Analyze the resume first before improving' })
    }

    const improvementData = await improveResume(resume.rawText, analysis.issues)

    const lastVersion = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1

    const content = {
      summary: improvementData.summary,
      experience: improvementData.experience.map((e) => e.improved).join('\n\n'),
      projects: improvementData.projects.map((p) => p.improved).join('\n\n'),
      skills: improvementData.skills.join(', '),
      education: '',
    }

    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber,
      source: 'ai_generated',
      content,
    })

    resume.status = 'improved'
    await resume.save()

    res.json({ version, improvement: improvementData })
  } catch (err) {
    next(err)
  }
}

export const getAnalysis = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const analysis = await Analysis.findOne({ resumeId: resume._id }).sort({ createdAt: -1 })
    res.json({ analysis })
  } catch (err) {
    next(err)
  }
}

export const getVersions = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const versions = await ResumeVersion.find({ resumeId: resume._id }).sort({ versionNumber: -1 })
    res.json({ versions })
  } catch (err) {
    next(err)
  }
}

export const saveVersion = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const { content, source } = req.body
    const lastVersion = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: lastVersion ? lastVersion.versionNumber + 1 : 1,
      source: source || 'user_edited',
      content,
      parentVersionId: lastVersion?._id || null,
    })
    res.status(201).json({ version })
  } catch (err) {
    next(err)
  }
}

export const matchResumeToJd = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }
    const { jd } = req.body
    if (!jd || !jd.trim()) {
      return res.status(400).json({ message: 'Job Description is required' })
    }

    const matchData = await matchResume(resume.rawText, jd)
    res.json({ match: matchData })
  } catch (err) {
    next(err)
  }
}

export const generateCoverLetterForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }
    const { jd } = req.body
    if (!jd || !jd.trim()) {
      return res.status(400).json({ message: 'Job Description is required to generate cover letter' })
    }

    const coverLetterData = await createCoverLetter(resume.rawText, jd)
    res.json({ coverLetter: coverLetterData.coverLetter })
  } catch (err) {
    next(err)
  }
}

export const getInterviewPrepForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }

    const prepData = await generateInterviewQuestions(resume.rawText)
    res.json({ questions: prepData.questions })
  } catch (err) {
    next(err)
  }
}



