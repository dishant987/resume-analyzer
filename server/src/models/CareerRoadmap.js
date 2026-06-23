import mongoose from 'mongoose'

const milestoneSchema = new mongoose.Schema({
  phase: { type: String, required: true },
  duration: { type: String, required: true },
  focus: { type: String, required: true },
  tasks: { type: [String], default: [] },
  projects: { type: [String], default: [] },
  resources: [{
    label: { type: String, required: true },
    url: { type: String, required: true }
  }],
}, { _id: false })

const careerRoadmapSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetRole: { type: String, required: true },
  matchPercentage: { type: Number, default: 0 },
  missingSkills: { type: [String], default: [] },
  gainedSkills: { type: [String], default: [] },
  roadmap: [milestoneSchema],
}, { timestamps: true })

export default mongoose.model('CareerRoadmap', careerRoadmapSchema)
