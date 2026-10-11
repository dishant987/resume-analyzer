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

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  description: { type: String, default: '' },
  isHidden: { type: Boolean, default: false },
}, { _id: false })

const testResultSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  actualOutput: { type: String, default: '' },
  passed: { type: Boolean, default: false },
  error: { type: String, default: '' },
}, { _id: false })

const codingSubmissionSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  language: { type: String, default: 'javascript' },
  code: { type: String, default: '' },
  compiledSuccessfully: { type: Boolean, default: true },
  passedCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  testResults: [testResultSchema],
}, { _id: false })

const finalFeedbackSchema = new mongoose.Schema({
  overallScore: { type: Number, default: 0 },
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  problemSolvingScore: { type: Number, default: 0 },
  codeQualityScore: { type: Number, default: 0 },
  summary: { type: String, default: '' },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  actionableAdvice: [{ type: String }],
}, { _id: false })

const mockInterviewSessionSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, enum: ['technical', 'hr', 'ai_suggested', 'behavioral', 'mixed'], default: 'technical' },
  questionType: { type: String, default: 'mixed' },
  durationMinutes: { type: Number, default: 15 },
  selectedLanguage: { type: String, enum: ['javascript', 'python', 'java', 'cpp'], default: 'javascript' },
  targetRole: { type: String, default: 'Software Engineer' },
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['technical', 'behavioral', 'coding'], default: 'technical' },
    suggestedAnswer: { type: String },
    tips: { type: String },
    starterCode: { type: String, default: '' },
    testCases: [testCaseSchema],
  }],
  chatHistory: [chatEntrySchema],
  scores: [scoreEntrySchema],
  codingSubmissions: [codingSubmissionSchema],
  finalFeedback: finalFeedbackSchema,
  currentQuestionIndex: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  isComplete: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true })

export default mongoose.model('MockInterviewSession', mockInterviewSessionSchema)
