const Task = require('./../models/TaskModel')
const User = require('./../models/userModel')
const { uploadToCloudinary, deleteFromCloudinary } = require('./../utils/uploadToCloudinary')

exports.createTask = async (req, res)=>{
    try {
    let {title, description} = req.body
    if(!title || ! description){
        return res.status(400).json({
            status:'fail',
            message:"All fields are required"
        })
    }


    if(req.file){
        let result = await uploadToCloudinary(req.file.buffer,'tasks')

        let task = await Task.create({
            title,
            description,
            image:{
                url:result.secure_url,
                publicId:result.public_id
            },
            user:req.user._id
        })

        return res.status(201).json({
            status:'success',
            message:"Task created successfully",
            task
        })
    }
    else{
        let task = await Task.create({
            title,
            description,
            user:req.user._id
        })

        return res.status(201).json({
            status:'success',
            message:"Task created successfully",
            task
        })
    }

    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message,
            stack:error.stack
            })
    }
}

exports.getMyTasks = async(req, res) =>{
    try {
        let tasks =  await Task.find({user:req.user._id}).populate({path:'user',select:'username'})

        return res.status(200).json({
            status:'success',
            tasks
        })
    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message
        })
    }
}


exports.updateTask = async(req, res) =>{
    try {
        let task = await Task.findById(req.params.id)
        if(!task){
            return res.status(404).json({
                status:'fail',
                message:'Task not found'
            })
        }


        let {title, description , status} = req.body
        if(title){
            task.title = title
        }
        if(description){
            task.description = description
        }

        if(status){
            task.status = status
        }

        if(req.file){
            if(task.image?.publicId){
                await deleteFromCloudinary(task.image.publicId)
            }
            let result = await uploadToCloudinary(req.file.buffer,'tasks')
            task.image = {
                url:result.secure_url,
                publicId:result.public_id
            }
        }

        await task.save()
        

        return res.status(200).json({
            status:'success',
            message:'Task updated successfully',
            task
        })       
    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message
        })
    }
}


exports.deleteTask = async(req, res)=>{
    try {
        let task = await Task.findByIdAndDelete(req.params.id)
        if(!task){
            return res.status(404).json({
                status:'fail',
                message:'Task not found'
            })
        }

        if(task.image?.publicId){
            await deleteFromCloudinary(task.image.publicId)
        }

        return res.status(200).json({
            status:'success',
            message:'Task deleted successfully'
        }) 
        
    } catch (error) {
        res.status(500).json({
            status:'error',
            message:error.message
        })   
    }
}