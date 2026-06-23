import mongoose from 'mongoose'

const prepQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['technical', 'behavioral'], required: true },
  suggestedAnswer: { type: String, required: true },
  tips: { type: String, required: true },
}, { _id: false })

const interviewPrepSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questions: { type: [prepQuestionSchema], required: true },
}, { timestamps: true })

export default mongoose.model('InterviewPrep', interviewPrepSchema)
