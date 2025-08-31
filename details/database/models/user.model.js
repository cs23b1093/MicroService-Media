import mongoose from "mongoose";
import argon2 from "argon2";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password using Argon2id
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await argon2.hash(this.password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        });
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password using Argon2 verify
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;