import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  message: { type: String, required: true },
  feedback: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false })

const salaryNegotiationSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobTitle: { type: String, required: true },
  company: { type: String, default: '' },
  location: { type: String, default: '' },
  marketEstimates: {
    low: { type: Number, default: 0 },
    median: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  negotiationStrategy: {
    tips: { type: [String], default: [] },
    leveragePoints: { type: [String], default: [] },
  },
  chatHistory: [chatMessageSchema],
}, { timestamps: true })

export default mongoose.model('SalaryNegotiation', salaryNegotiationSchema)
