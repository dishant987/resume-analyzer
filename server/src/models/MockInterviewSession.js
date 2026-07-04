import mongoose from 'mongoose'

const chatEntrySchema = new mongoose.Schema({
  role: { type: String, enum: ['assistant', 'user'], required: true },
  message: { type: String, required: true },
  feedback: { type: String, default: '' },
}, { _id: false })

const scoreEntrySchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  score: { type: Number, required: true },
  feedback: { type: String, default: '' },
  strengths: { type: String, default: '' },
  improvementTip: { type: String, default: '' },
}, { _id: false })

const mockInterviewSessionSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionType: { type: String, enum: ['technical', 'behavioral', 'mixed'], default: 'mixed' },
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['technical', 'behavioral'] },
    suggestedAnswer: { type: String },
    tips: { type: String },
  }],
  chatHistory: [chatEntrySchema],
  scores: [scoreEntrySchema],
  currentQuestionIndex: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  isComplete: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true })

export default mongoose.model('MockInterviewSession', mockInterviewSessionSchema)
