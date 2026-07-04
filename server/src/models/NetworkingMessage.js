import mongoose from 'mongoose'

const networkingMessageSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messageType: { type: String, enum: ['connection_request', 'referral_ask', 'follow_up', 'cold_email'], required: true },
  recipientName: { type: String, default: '' },
  recipientTitle: { type: String, default: '' },
  company: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  context: { type: String, default: '' },
  message: { type: String, required: true },
  subject: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('NetworkingMessage', networkingMessageSchema)
