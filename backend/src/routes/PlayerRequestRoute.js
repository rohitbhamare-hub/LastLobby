import { Router } from "express";
import {
    sendPlayerRequest,
    cancelPlayerRequest,
    acceptPlayerRequest,
    rejectPlayerRequest,
    getReceivedRequests,
    getSentRequests
} from "../controllers/PlayerRequestController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

// Protect all routes under this router
router.use(verifyJWT);

router.route("/send").post(sendPlayerRequest);
router.route("/:requestId/cancel").put(cancelPlayerRequest);
router.route("/:requestId/accept").put(acceptPlayerRequest);
router.route("/:requestId/reject").put(rejectPlayerRequest);
router.route("/received").get(getReceivedRequests);
router.route("/sent").get(getSentRequests);

export default router;
