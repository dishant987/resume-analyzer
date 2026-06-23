import mongoose from 'mongoose'

const issueSchema = new mongoose.Schema({
  section: { type: String, required: true },
  problem: { type: String, required: true },
  suggestion: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
}, { _id: false })

const checklistSchema = new mongoose.Schema({
  label: { type: String, required: true },
  passed: { type: Boolean, required: true },
  feedback: { type: String, required: true },
}, { _id: false })

const analysisSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  atsScore: { type: Number, default: 0 },
  summaryScore: { type: Number, default: 0 },
  skillsScore: { type: Number, default: 0 },
  experienceScore: { type: Number, default: 0 },
  projectsScore: { type: Number, default: 0 },
  grammarScore: { type: Number, default: 0 },
  summaryVerdict: { type: String, default: '' },
  strengths: { type: [String], default: [] },
  checklist: { type: [checklistSchema], default: [] },
  issues: [issueSchema],
  missingSkills: [String],
}, { timestamps: true })

export default mongoose.model('Analysis', analysisSchema)
