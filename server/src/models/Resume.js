import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalFilename: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  cloudinaryPublicId: { type: String, default: '' },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  rawText: { type: String, default: '' },
  status: { type: String, enum: ['uploaded', 'analyzed', 'improved', 'failed'], default: 'uploaded' },
  deletedAt: { type: Date, default: null },
}, { timestamps: true })

resumeSchema.statics.notDeleted = function () {
  return this.find({ deletedAt: null })
}

export default mongoose.model('Resume', resumeSchema)
