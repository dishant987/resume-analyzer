import mongoose from 'mongoose'

const jobMatchSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jd: { type: String, required: true },
  matchPercentage: { type: Number, required: true },
  explanation: { type: String, required: true },
  matchedKeywords: { type: [String], default: [] },
  missingKeywords: { type: [String], default: [] },
  recommendations: { type: [String], default: [] },
}, { timestamps: true })

export default mongoose.model('JobMatch', jobMatchSchema)
