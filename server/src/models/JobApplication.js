import mongoose from 'mongoose'

const jobApplicationSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  jobUrl: { type: String, default: '' },
  location: { type: String, default: '' },
  salaryRange: { type: String, default: '' },
  stage: {
    type: String,
    enum: ['saved', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'],
    default: 'saved',
  },
  notes: { type: String, default: '' },
  aiInsights: {
    matchScore: { type: Number, min: 0, max: 100 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestedFollowUp: { type: String },
    callbackLikelihood: { type: String, enum: ['low', 'medium', 'high'] },
  },
  followUpDate: { type: Date },
  appliedDate: { type: Date },
  interviewDate: { type: Date },
}, { timestamps: true })

export default mongoose.model('JobApplication', jobApplicationSchema)
