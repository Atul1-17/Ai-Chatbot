import mongoose, {Schema} from "mongoose";

const chatSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    }
}, {timestamps: true})

export const Chat = mongoose.model("Chat", chatSchema)