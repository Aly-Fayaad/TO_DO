const express = require('express')
const router = express.Router()
const multer = require('multer')
const protect = require('./../middleware/protect')
const {
    register,
    login,
    refreshToken,
    changePassword,
    logout,
    getUserProfile,
    deleteUser
} = require('./../controllers/userController')

// Use memory storage so buffer is available for Cloudinary
const upload = multer({ storage: multer.memoryStorage() })

// Public routes
router.post('/register', upload.single('image'), register)
router.post('/login', login)
router.post('/refresh-token', refreshToken)

// Protected routes
router.get('/profile',protect,getUserProfile)
router.patch('/change_password', protect, changePassword)
router.post('/logout', protect, logout)
router.delete('/delete_user',protect,deleteUser)


module.exports = router
