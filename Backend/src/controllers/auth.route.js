import User from "../model/userModel.js";
import bcrypt from "bcryptjs";
import { generateUserToken } from "./userToken.js";
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
 
  try {
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must at least 8 character" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(password, salt);

    const newUser = await User({
      fullName,
      email,
      password: hasedPassword,
    });
    if (newUser) {
      generateUserToken(res,newUser._id);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exits" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(404)
        .json({ message: "Invalid credentials! Wrong password" });
    }
    generateUserToken(res,user._id);
    return res.status(200).json({ message: "Login succesfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    await res.cookie("userToken", "", { maxAge: 0 });
    res.status(200).json({ message: "User successfully logout!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    if(!userId) return res.status(400).json({message:"Login to update"})
    if (!profilePic) {
      return res.status(400).json({message:"Profile pic is required!"})
    }
    const uploadResponse =await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true})
    return res.status(200).json(updatedUser)
  } catch (error) {
    return res.status(500).json({message:error.message})
  }
};


export const chechAuth = async (req,res) => {
  try {
    return res.status(200).json(req.user)
  } catch (error) {
    console.log("error inn chechAuth controller",error.message)
    return res.status(200).json({message:"Internal server error"})
  }
}