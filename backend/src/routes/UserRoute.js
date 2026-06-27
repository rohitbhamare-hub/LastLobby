import {Router} from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/RegisterUser.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router()

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);

export default router;