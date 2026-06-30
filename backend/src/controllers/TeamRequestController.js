import mongoose from "mongoose";
import { Team } from "../models/Team.models.js";
import { TeamRequest } from "../models/TeamRequest.models.js";
import { Friend } from "../models/Friend.models.js";
import { User } from "../models/User.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

// Send Join Request (Public Teams only)
const sendJoinRequest = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Team ID")
            );
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Team not found")
            );
        }

        // Only allowed for public teams
        if (team.visibility !== "Public") {
            return res.status(400).json(
                new ApiError(400, "This team is private. You must be invited to join.")
            );
        }

        // Check if user is already a member
        const isMember = team.members.some(m => m.user.toString() === userId.toString());
        if (isMember) {
            return res.status(400).json(
                new ApiError(400, "You are already a member of this team")
            );
        }

        // Check capacity limit
        if (team.members.length >= team.maxMembers) {
            return res.status(400).json(
                new ApiError(400, "This team is already full")
            );
        }

        // Check for existing pending request or invitation
        const existingRequest = await TeamRequest.findOne({
            team: teamId,
            user: userId,
            status: "Pending"
        });

        if (existingRequest) {
            return res.status(400).json(
                new ApiError(400, "A pending join request or invitation already exists for this team")
            );
        }

        // Create Join Request
        const teamRequest = await TeamRequest.create({
            team: teamId,
            user: userId,
            sender: userId,
            type: "JoinRequest",
            status: "Pending"
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                teamRequest,
                "Join Request Sent Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Send Team Invitation (Leader/Co-Leader invites a Friend)
const sendTeamInvitation = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;
        const senderId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Team ID or User ID")
            );
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Team not found")
            );
        }

        // Check authorization (Leader or Co-Leader)
        const senderMember = team.members.find(m => m.user.toString() === senderId.toString());
        if (!senderMember || !["Leader", "Co-Leader"].includes(senderMember.role)) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Only team leaders and co-leaders can invite players")
            );
        }

        // Check friendship status (Invitation limit to Friends)
        const isFriend = await Friend.findOne({
            $or: [
                { user1: senderId, user2: userId },
                { user1: userId, user2: senderId }
            ]
        });

        if (!isFriend) {
            return res.status(400).json(
                new ApiError(400, "Access Denied: You can only invite users from your friends list")
            );
        }

        // Verify target is not a member
        const isMember = team.members.some(m => m.user.toString() === userId.toString());
        if (isMember) {
            return res.status(400).json(
                new ApiError(400, "User is already a member of this team")
            );
        }

        // Verify capacity
        if (team.members.length >= team.maxMembers) {
            return res.status(400).json(
                new ApiError(400, "This team is already full")
            );
        }

        // Verify duplicate request
        const existingRequest = await TeamRequest.findOne({
            team: teamId,
            user: userId,
            status: "Pending"
        });

        if (existingRequest) {
            return res.status(400).json(
                new ApiError(400, "A pending request or invitation already exists for this player")
            );
        }

        // Create Invitation
        const invitation = await TeamRequest.create({
            team: teamId,
            user: userId,
            sender: senderId,
            type: "Invitation",
            status: "Pending"
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                invitation,
                "Team Invitation Sent Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Accept Team Request (Accept join requests / accept invitation)
const acceptTeamRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Request ID")
            );
        }

        // Fetch request and load team
        const request = await TeamRequest.findById(requestId).populate("team");
        if (!request) {
            return res.status(404).json(
                new ApiError(404, "Request not found")
            );
        }

        if (request.status !== "Pending") {
            return res.status(400).json(
                new ApiError(400, `Request cannot be accepted because it is already '${request.status}'`)
            );
        }

        const team = request.team;
        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Associated team no longer exists")
            );
        }

        // Verify Capacity
        if (team.members.length >= team.maxMembers) {
            return res.status(400).json(
                new ApiError(400, "Cannot accept request: The team is already full")
            );
        }

        // Enforce role authorization depending on type
        if (request.type === "JoinRequest") {
            // Requester accepting must be Team Leader or Co-Leader
            const acceptingMember = team.members.find(m => m.user.toString() === userId.toString());
            if (!acceptingMember || !["Leader", "Co-Leader"].includes(acceptingMember.role)) {
                return res.status(403).json(
                    new ApiError(403, "Access Denied: Only team leaders and co-leaders can accept join requests")
                );
            }
        } else if (request.type === "Invitation") {
            // Requester accepting must be the invited user
            if (request.user.toString() !== userId.toString()) {
                return res.status(403).json(
                    new ApiError(403, "Access Denied: Unauthorized to accept this invitation")
                );
            }
        }

        // Double check target user is not already a member
        const isAlreadyMember = team.members.some(m => m.user.toString() === request.user.toString());
        if (isAlreadyMember) {
            request.status = "Accepted";
            await request.save();
            return res.status(400).json(
                new ApiError(400, "User is already a member of this team")
            );
        }

        // Update request status
        request.status = "Accepted";
        await request.save();

        // Add member
        team.members.push({
            user: request.user,
            role: "Member"
        });
        await team.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                team,
                "Request Accepted. Member added to team successfully."
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Reject Team Request / Invitation
const rejectTeamRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Request ID")
            );
        }

        const request = await TeamRequest.findById(requestId).populate("team");
        if (!request) {
            return res.status(404).json(
                new ApiError(404, "Request not found")
            );
        }

        if (request.status !== "Pending") {
            return res.status(400).json(
                new ApiError(400, `Request cannot be rejected because it is already '${request.status}'`)
            );
        }

        const team = request.team;
        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Associated team no longer exists")
            );
        }

        // Enforce authorization checks
        if (request.type === "JoinRequest") {
            const acceptingMember = team.members.find(m => m.user.toString() === userId.toString());
            if (!acceptingMember || !["Leader", "Co-Leader"].includes(acceptingMember.role)) {
                return res.status(403).json(
                    new ApiError(403, "Access Denied: Only team leaders and co-leaders can reject join requests")
                );
            }
        } else if (request.type === "Invitation") {
            if (request.user.toString() !== userId.toString()) {
                return res.status(403).json(
                    new ApiError(403, "Access Denied: Unauthorized to reject this invitation")
                );
            }
        }

        request.status = "Rejected";
        await request.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                request,
                "Request Rejected Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get requests for a team (Leader/Co-leader only)
const getTeamRequests = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Team ID")
            );
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Team not found")
            );
        }

        // Verify authorization
        const member = team.members.find(m => m.user.toString() === userId.toString());
        if (!member || !["Leader", "Co-Leader"].includes(member.role)) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Only team leaders and co-leaders can view requests")
            );
        }

        const requests = await TeamRequest.find({ team: teamId })
            .sort({ createdAt: -1 })
            .populate("user", "username avatar bio country languages discordUsername profileCompleted")
            .populate("sender", "username avatar bio country languages discordUsername profileCompleted");

        return res.status(200).json(
            new ApiResponse(
                200,
                requests,
                "Team Requests Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

export {
    sendJoinRequest,
    sendTeamInvitation,
    acceptTeamRequest,
    rejectTeamRequest,
    getTeamRequests
};
