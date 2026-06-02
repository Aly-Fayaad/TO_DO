const User = require('./../models/userModel')
const jwt = require('jsonwebtoken')
const { uploadToCloudinary, deleteFromCloudinary } = require('./../utils/uploadToCloudinary')
const Task = require('../models/TaskModel')

// ─── Token Generators ────────────────────────────────────────────────────────

const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    )
}

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )
}

// ─── Register ─────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            })
        }

        let user 
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'users')
             user = await User.create({
                username,
                password,
                image: {
                    url: result.secure_url,
                    publicId: result.public_id
                }
            })
        }
        else{
             user = await User.create({
                username,
                password
            })
        }


        // Generate tokens
        const accessToken = generateAccessToken(user._id)
        const refreshToken = generateRefreshToken(user._id)

        // Persist refresh token in DB
        user.refreshToken = refreshToken
        await user.save()

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                image: user.image
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ─── Login ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
    try {
        console.log(req.body) // for debugging
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id)
        const refreshToken = generateRefreshToken(user._id)

        // Persist new refresh token in DB (rotate on each login)
        user.refreshToken = refreshToken
        await user.save()

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                image: user.image
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            })
        }

        // Verify the refresh token signature
        let decoded
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            })
        }

        // Check token exists in DB (rotation guard)
        const user = await User.findOne({ _id: decoded.id, refreshToken })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token reuse detected or user not found'
            })
        }

        // Issue new pair (rotation)
        const newAccessToken = generateAccessToken(user._id)
        const newRefreshToken = generateRefreshToken(user._id)

        user.refreshToken = newRefreshToken
        await user.save()

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

exports.logout = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        await User.findByIdAndUpdate(req.user.id, { refreshToken: null })

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.changePassword = async(req, res)=>{
    try {
        const {current_password, new_password, new_password_confirm} = req.body
        if(new_password !== new_password_confirm){
            return res.status(404).json({
                status:'fail',
                message:'Passwords do not match'
            })
        }
        const user = await User.findById(req.user._id)
        if(!user){
            return res.status(404).json({
                status:'fail',
                message:'User not found'
            })
        }
        const isMatch = await user.comparePassword(current_password)
        if(!isMatch){
            return res.status(401).json({
                status:'fail',
                message:'wrong password'
            })
        }
        user.password = new_password
        await user.save()
        return res.status(200).json({
            status:'success',
            message:'Password changed successfully'
        })
    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message
        })  
    }
}

exports.getUserProfile = async(req, res)=>{
    try {
        const user = await User.findById(req.user.id)
        if(!user){
            return res.status(404).json({
                status:'fail',
                message:'User not found'
            })
        }
        res.status(200).json({
            status: 'success',
            user
        })
    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message
        })
    }
}


exports.deleteUser = async(req, res)=>{
    try {
        const user = await User.findById(req.user.id)
        if(!user){
            return res.status(404).json({
                status:'fail',
                message:'User not found'
            })
        }
        if(user.image?.publicId){
            await deleteFromCloudinary(user.image.publicId)
        }
        await Task.deleteMany({user:req.user.id})
        await User.findByIdAndDelete(req.user.id)
        res.status(200).json({
            status:'success',
            message:'User deleted successfully'
        })
    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message
        })  
    }
}