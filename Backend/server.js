
import express from "express"
import {connectDb}  from "./src/lib/db.js"
import dotenv from "dotenv";
import userRouter from "./src/routes/auth.route.js"
import messageRoute from "./src/routes/message.route.js"
import cookieParser from "cookie-parser"
import cors from "cors";
import {app,server} from "./src/lib/socket.js"
dotenv.config();

const port = 3000;

app.use(cors({
  origin: "http://localhost:5173",   
  credentials: true,                
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());

app.use("/api/user",userRouter)
app.use("/api/messages",messageRoute)


server.listen(port,()=>{
    console.log("App listing on port:3000");
    connectDb() 
})   