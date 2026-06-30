import { Router } from "express";
import {
    createTeam,
    getTeamDetails,
    getAllTeams,
    updateTeam,
    deleteTeam,
    leaveTeam,
    removeMember,
    updateMemberRole,
    transferLeadership
} from "../controllers/TeamController.js";
import {
    sendJoinRequest,
    sendTeamInvitation,
    acceptTeamRequest,
    rejectTeamRequest,
    getTeamRequests
} from "../controllers/TeamRequestController.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

// Protect all routes under this router
router.use(verifyJWT);

// Team CRUD & Discovery
router.route("/")
    .post(createTeam)
    .get(getAllTeams);

router.route("/:teamId")
    .get(getTeamDetails)
    .put(updateTeam)
    .delete(deleteTeam);

// Team Member Management
router.route("/:teamId/leave").post(leaveTeam);
router.route("/:teamId/remove-member").post(removeMember);
router.route("/:teamId/update-role").post(updateMemberRole);
router.route("/:teamId/transfer-leadership").post(transferLeadership);

// Team Requests & Invitations
router.route("/:teamId/join-request").post(sendJoinRequest);
router.route("/:teamId/invite").post(sendTeamInvitation);
router.route("/:teamId/requests").get(getTeamRequests);

router.route("/requests/:requestId/accept").put(acceptTeamRequest);
router.route("/requests/:requestId/reject").put(rejectTeamRequest);

export default router;
