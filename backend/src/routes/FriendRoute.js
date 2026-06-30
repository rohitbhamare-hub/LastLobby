import { Router } from "express";
import {
    getFriendsList,
    getFriendProfile,
    removeFriend
} from "../controllers/FriendController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

// Protect all routes under this router
router.use(verifyJWT);

router.route("/")
    .get(getFriendsList);

router.route("/profile/:friendId")
    .get(getFriendProfile);

router.route("/:friendId")
    .delete(removeFriend);

export default router;
