import { Router } from "express";

import { getCurrentUser, completeProfile, updateProfile, deleteAccount} from "../controllers/UserProfile.js";

import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

router.route("/get-user").get(verifyJWT, getCurrentUser);

router.route("/complete-profile").put(verifyJWT, completeProfile);

router.route("/update-profile").put(verifyJWT, updateProfile);

router.route("/delete-account").delete(verifyJWT, deleteAccount);

export default router;