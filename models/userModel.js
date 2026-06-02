const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        image: {
            url: { type: String},
            publicId: { type: String}
        },
        refreshToken: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
)

// Hash password before saving
UserSchema.pre('save', async function () {
    // 1. "this" only works if you use a regular function, NOT an arrow function
    if (!this.isModified('password')) return;

    try {
        this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
        // If hashing fails, throw the error to reject the save promise
        throw error; 
    }
});
// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', UserSchema)

module.exports = User