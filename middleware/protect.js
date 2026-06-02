const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')

const protect = async (req, res, next) => {
    try {
        // 1. Check for Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            })
        }

        // 2. Extract token
        const token = authHeader.split(' ')[1]

        // 3. Verify access token
        let decoded
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Access token expired. Please refresh your token.'
                })
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid access token.'
            })
        }

        // 4. Find user and attach to request
        const user = await User.findById(decoded.id).select('-password -refreshToken')
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User belonging to this token no longer exists.'
            })
        }

        req.user = user
        next()
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = protect
