const router = require('express').Router()
const multer = require('multer')

const taskController = require('./../controllers/taskController')
const protect = require('./../middleware/protect')

// Use memory storage so buffer is available for Cloudinary
const upload = multer({ storage: multer.memoryStorage() })

router.use(protect)
router.route('/')
    .post(upload.single('image'),taskController.createTask)
    .get(taskController.getMyTasks)


router.route('/:id')
    .patch(upload.single('image'),taskController.updateTask)
    .delete(taskController.deleteTask)

module.exports = router