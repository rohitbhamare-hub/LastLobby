import { Router } from "express";
import {
    createGameProfile,
    getAllUserGameProfiles,
    getGameProfileById,
    updateGameProfile,
    deleteGameProfile
} from "../controllers/GameProfileController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

// Protect all routes under this router
router.use(verifyJWT);

router.route("/")
    .post(createGameProfile)
    .get(getAllUserGameProfiles);

router.route("/:profileId")
    .get(getGameProfileById)
    .put(updateGameProfile)
    .delete(deleteGameProfile);

export default router;
