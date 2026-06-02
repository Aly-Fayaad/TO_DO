const mongoose = require('mongoose')

const TaskSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['pending','completed'],
        default:'pending'
    },
    image:{
        url:String,
        publicId:String
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},{
    timestamps:true
})

const Task = mongoose.model("Task",TaskSchema)

module.exports = Task