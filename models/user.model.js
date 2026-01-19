
import mongoose from "mongoose";
// import dedicated_nuban from "paystack-node/src/endpoints/dedicated_nuban";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    refreshToken: String,
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

// Hash password before saving - FIXED VERSION
// In User.js - Replace the pre-save middleware with this:
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        this.password = await bcrypt.hash(this.password, 12);
    } catch (error) {
        throw error; // Let Mongoose handle the error
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};



export default mongoose.model("User", userSchema);



