import Resume from '../models/Resume.js'
import ResumeVersion from '../models/ResumeVersion.js'
import { buildDocx, buildPdf, buildHtml } from '../services/exportService.js'

export const downloadDocx = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const version = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    if (!version) return res.status(400).json({ message: 'No improved version to export' })

    const buffer = await buildDocx(version.content)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="resume-${resume.originalFilename.replace(/\.[^.]+$/, '')}.docx"`)
    res.send(buffer)
  } catch (err) {
    next(err)
  }
}

export const downloadPdf = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const version = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    if (!version) return res.status(400).json({ message: 'No improved version to export' })

    const pdf = await buildPdf(version.content)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="resume-${resume.originalFilename.replace(/\.[^.]+$/, '')}.pdf"`)
    res.send(pdf)
  } catch (err) {
    next(err)
  }
}

export const previewHtml = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const version = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    if (!version) return res.status(400).json({ message: 'No improved version' })

    const html = buildHtml(version.content)
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (err) {
    next(err)
  }
}
