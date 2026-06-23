import { Router } from 'express'
import multer from 'multer'
import { 
  signup, login, logout, getMe, 
  updateProfile, updatePassword, updateAvatar 
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images are allowed'))
    }
  }
})

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', protect, getMe)

router.put('/profile', protect, updateProfile)
router.put('/password', protect, updatePassword)
router.put('/avatar', protect, upload.single('avatar'), updateAvatar)

export default router
