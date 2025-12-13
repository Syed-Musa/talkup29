import mogoose from "mongoose";

export const connectDb = async () => {
    try {
        const conn = await mogoose.connect(process.env.MONGODB_URI);
        console.log(`mongoDb connected`)
    } catch (error) {
        console.log("Databse error",error.message)
    }
}