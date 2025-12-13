import mongoose from "mongoose";

const groupChatSchema =  mongoose.Schema({
    chatName: { type: String, trim: true, required: true },

    isGroupChat: { type: Boolean, default: false },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    latestMessage: {    
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message", 
    },
}, {
    timestamps: true,
});

const groupChat = mongoose.model("groupChat",groupChatSchema);

export default groupChat;

