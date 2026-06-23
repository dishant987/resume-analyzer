import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadBuffer = (buffer, userId, originalFilename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: `resumes/${userId}`,
        public_id: `${Date.now()}_${originalFilename.replace(/\.[^.]+$/, '')}`,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve({ fileUrl: result.secure_url, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

export const uploadAvatarBuffer = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `avatars/${userId}`,
        public_id: `avatar`,
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' }
        ]
      },
      (error, result) => {
        if (error) return reject(error)
        resolve({ secure_url: result.secure_url })
      }
    )
    stream.end(buffer)
  })
}

export default cloudinary
