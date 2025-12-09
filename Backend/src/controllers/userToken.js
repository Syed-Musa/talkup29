import jwt from "jsonwebtoken";
export const generateUserToken = async (res, _id) => {
  const userToken = jwt.sign({ _id:_id }, "mySecretKey", {
    expiresIn: "7d",
  });
  res.cookie("userToken", userToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
  });
};
