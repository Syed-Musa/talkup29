import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

export const proctedRoute = async (req, res, next) => {
  try {
    const userToken = req.cookies?.userToken;
    if (!userToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized -NO token provided!" });
    }
    const decode = jwt.verify(userToken,"mySecretKey");
     if (!decode) {
      return res
        .status(403)
        .json({ message: "Unauthorized -Invalid token provided!" });
    } 
    const user = await User.findById(decode._id).select("-password");
    if(!user){ 
        return res.status(404).json({message:"User not found!"});
    }
    req.user=user;
    next();
  } catch (error) {
    return res.status(500).json({message:error.message})
  }
};


