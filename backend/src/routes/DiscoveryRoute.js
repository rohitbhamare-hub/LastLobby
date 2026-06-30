import { Router } from "express";
import {
    searchPlayers,
    getPlayerPublicProfile
} from "../controllers/DiscoveryController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

// Protect all routes under this router
router.use(verifyJWT);

router.route("/search").get(searchPlayers);
router.route("/player/:userId").get(getPlayerPublicProfile);

export default router;
