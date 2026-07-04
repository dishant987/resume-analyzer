import mongoose from 'mongoose'

const linkedinProfileSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  headline: { type: String, required: true },
  about: { type: String, required: true },
  experience: [{
    title: { type: String },
    company: { type: String },
    description: { type: String },
  }],
  skills: [{ type: String }],
  recommendations: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('LinkedInProfile', linkedinProfileSchema)
