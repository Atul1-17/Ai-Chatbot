import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    hashed_password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
    }
}, 
{timestamps: true})

export const User = mongoose.model("User", userSchema)