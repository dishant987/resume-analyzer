import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  profileImage: { type: String, default: '' },
}, { timestamps: true })

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12)
}

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash
    delete ret.__v
    return ret
  },
})

export default mongoose.model('User', userSchema)
