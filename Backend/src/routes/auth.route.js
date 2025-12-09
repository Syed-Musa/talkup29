import express from "express"
import {signup,login,logout,updateProfile,chechAuth} from "../controllers/auth.route.js"
import { proctedRoute } from "../middleware/proctedRoute.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);

router.put("/update-profile", proctedRoute,updateProfile);

router.get("/check",proctedRoute,chechAuth)


export default router;