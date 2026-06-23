import mongoose from 'mongoose'

const coverLetterSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jd: { type: String, required: true },
  coverLetter: { type: String, required: true },
}, { timestamps: true })

export default mongoose.model('CoverLetter', coverLetterSchema)
