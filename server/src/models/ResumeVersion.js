import mongoose from 'mongoose'

const contentSchema = new mongoose.Schema({
  summary: { type: String, default: '' },
  experience: { type: String, default: '' },
  projects: { type: String, default: '' },
  skills: { type: String, default: '' },
  education: { type: String, default: '' },
}, { _id: false })

const resumeVersionSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  versionNumber: { type: Number, required: true },
  source: { type: String, enum: ['ai_generated', 'user_edited', 'original'], required: true },
  content: { type: contentSchema, required: true },
  parentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion', default: null },
}, { timestamps: true })

resumeVersionSchema.index({ resumeId: 1, versionNumber: 1 }, { unique: true })

export default mongoose.model('ResumeVersion', resumeVersionSchema)
