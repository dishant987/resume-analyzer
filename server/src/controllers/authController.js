import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { uploadAvatarBuffer } from '../services/cloudinary.js'

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const passwordHash = await User.hashPassword(password)
    const user = await User.create({ name, email, passwordHash })

    const token = signToken(user._id)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken(user._id)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) })
  res.json({ message: 'Logged out' })
}

export const getMe = async (req, res) => {
  res.json({ user: req.user })
}

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' })
    }

    if (email.toLowerCase() !== req.user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return res.status(409).json({ message: 'Email already in use' })
      }
    }

    const user = await User.findById(req.user._id)
    user.name = name
    user.email = email.toLowerCase()
    await user.save()

    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }

    const user = await User.findById(req.user._id)
    const match = await user.comparePassword(currentPassword)
    if (!match) {
      return res.status(401).json({ message: 'Incorrect current password' })
    }

    user.passwordHash = await User.hashPassword(newPassword)
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
}

export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' })
    }

    const result = await uploadAvatarBuffer(req.file.buffer, req.user._id)
    
    const user = await User.findById(req.user._id)
    user.profileImage = result.secure_url
    await user.save()

    res.json({ user })
  } catch (err) {
    next(err)
  }
}
