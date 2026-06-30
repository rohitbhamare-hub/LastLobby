import {Router} from "express";
import { registerUser, loginUser, logoutUser , refreshAccessToken} from "../controllers/RegisterUser.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router()

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;