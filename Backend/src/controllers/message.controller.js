import Message from "../model/messageModel.js";
import User from "../model/userModel.js";
import cloudinary from "../lib/cloudinary.js";
import {getReceiverSocketId,io} from "../lib//socket.js"



export const getUserForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    return res.status(200).json(filteredUsers);
  } catch (error) {
    return res.status(500).json({ error: "Ineternal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ messages: error.messages });
  }
};

export const sendMessages = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessge = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status:"sent",
    });
    const saved = await newMessge.save();

    // realtime functionality to dispaly messages..
    const recieverSocketId = getReceiverSocketId(receiverId);
    if(recieverSocketId) {
      saved.status ="delivered";
      await Message.findByIdAndUpdate(saved._id,{status:"delivered"});
      io.to(recieverSocketId).emit("newMessage",saved);

      const senderSocketId = getReceiverSocketId(senderId);
      if(senderSocketId){
        io.to(senderSocketId).emit("message_delivered",{messageId:saved._id})
      }
    };
    
    return res.status(201).json(saved);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
