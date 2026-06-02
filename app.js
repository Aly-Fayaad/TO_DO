const express = require('express')
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const taskRoutes = require('./routes/taskRoute')
const app = express()

app.use(express.json())
app.use(cors())

// Routes
app.use('/api/users', userRoutes)
app.use('/api/tasks',taskRoutes)
module.exports = app