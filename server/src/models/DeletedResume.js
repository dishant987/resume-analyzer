import mongoose from 'mongoose'

const deletedResumeSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalFilename: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  rawText: { type: String, default: '' },
  status: { type: String, enum: ['uploaded', 'analyzed', 'improved'], default: 'uploaded' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  deletedAt: { type: Date, default: Date.now },
}, { timestamps: false })

export default mongoose.model('DeletedResume', deletedResumeSchema)
