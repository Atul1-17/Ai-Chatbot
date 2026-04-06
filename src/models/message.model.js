import mongoose, {Schema} from "mongoose";

const messageSchema = new Schema({
    chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat"
    },
    sender: {
        tyep: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {timestamps: true})

export const Message = mongoose.model("Message", messageSchema)
