import express from "express"
import { proctedRoute } from "../middleware/proctedRoute.js";
import { getUserForSidebar,getMessages,sendMessages } from "../controllers/message.controller.js";
const route = express.Router();


route.get("/users",proctedRoute,getUserForSidebar)
route.get("/:id",proctedRoute,getMessages)
route.post("/send/:id",proctedRoute,sendMessages)

export default route;