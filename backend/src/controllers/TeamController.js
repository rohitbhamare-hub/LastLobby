import mongoose from "mongoose";
import { Team } from "../models/Team.models.js";
import { TeamRequest } from "../models/TeamRequest.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

// Create Team
const createTeam = async (req, res) => {
    try {
        const {
            name,
            description,
            game,
            region,
            languages,
            teamType,
            maxMembers,
            visibility
        } = req.body;

        if (!name || !game) {
            return res.status(400).json(
                new ApiError(400, "Team name and game are required")
            );
        }

        // Check duplicate team name (case-insensitive)
        const existingTeam = await Team.findOne({
            name: { $regex: new RegExp("^" + name.trim() + "$", "i") }
        });

        if (existingTeam) {
            return res.status(400).json(
                new ApiError(400, `Team name '${name}' is already taken`)
            );
        }

        const team = await Team.create({
            name: name.trim(),
            description: description ? description.trim() : "",
            game: game.trim(),
            region: region ? region.trim() : "",
            languages: Array.isArray(languages) ? languages : [],
            teamType: teamType || "Casual",
            maxMembers: maxMembers !== undefined ? Number(maxMembers) : 5,
            visibility: visibility || "Public",
            leader: req.user._id,
            members: [
                {
                    user: req.user._id,
                    role: "Leader"
                }
            ]
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                team,
                "Team Created Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get Team Details (populated members)
const getTeamDetails = async (req, res) => {
    try {
        const { teamId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Team ID")
            );
        }

        const team = await Team.findById(teamId)
            .populate("members.user", "username avatar bio country languages discordUsername profileCompleted");

        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Team not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                team,
                "Team Details Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Discover Teams (All Public Teams with filters, search, pagination, and sorting)
const getAllTeams = async (req, res) => {
    try {
        const {
            game,
            region,
            teamType,
            search,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortType = "desc"
        } = req.query;

        // Base query: Only show public teams
        const query = { visibility: "Public" };

        if (game && game.trim() !== "") {
            query.game = { $regex: game.trim(), $options: "i" };
        }

        if (region && region.trim() !== "") {
            query.region = { $regex: region.trim(), $options: "i" };
        }

        if (teamType && teamType.trim() !== "") {
            query.teamType = teamType;
        }

        if (search && search.trim() !== "") {
            query.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } }
            ];
        }

        // Pagination setup
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const allowedSortFields = ["createdAt", "name", "maxMembers"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
        const sort = { [sortField]: sortOrder };

        const teams = await Team.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate("members.user", "username avatar bio country languages discordUsername profileCompleted");

        const totalItems = await Team.countDocuments(query);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    teams,
                    pagination: {
                        totalItems,
                        totalPages: Math.ceil(totalItems / limitNum),
                        currentPage: pageNum,
                        limit: limitNum
                    }
                },
                "Teams Discovered Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Update Team (Leader only)
const updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const {
            description,
            region,
            languages,
            teamType,
            maxMembers,
            visibility
        } = req.body;

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

        // Authorization check: Only team leader can update
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Only the team leader can edit team details")
            );
        }

        // Validate maxMembers update
        if (maxMembers !== undefined) {
            const newLimit = Number(maxMembers);
            if (newLimit < team.members.length) {
                return res.status(400).json(
                    new ApiError(400, `Cannot shrink team capacity to ${newLimit} because there are currently ${team.members.length} members`)
                );
            }
            team.maxMembers = newLimit;
        }

        if (description !== undefined) team.description = description.trim();
        if (region !== undefined) team.region = region.trim();
        if (languages !== undefined) team.languages = Array.isArray(languages) ? languages : [];
        if (teamType !== undefined) team.teamType = teamType;
        if (visibility !== undefined) team.visibility = visibility;

        await team.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                team,
                "Team Updated Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Delete Team (Leader only)
const deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

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

        // Authorization: Leader only
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Only the team leader can delete this team")
            );
        }

        // Delete team and all associated pending request/invitations
        await Team.findByIdAndDelete(teamId);
        await TeamRequest.deleteMany({ team: teamId });

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Team Deleted Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Leave Team (Any member other than Leader)
const leaveTeam = async (req, res) => {
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

        // Verify user is a member
        const memberIndex = team.members.findIndex(m => m.user.toString() === userId.toString());
        if (memberIndex === -1) {
            return res.status(400).json(
                new ApiError(400, "You are not a member of this team")
            );
        }

        // Prevent leader from leaving directly
        if (team.leader.toString() === userId.toString()) {
            return res.status(400).json(
                new ApiError(400, "As team leader, you cannot leave. Transfer leadership or delete the team instead.")
            );
        }

        // Remove from members list
        team.members.splice(memberIndex, 1);
        await team.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "You have successfully left the team"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Remove Member (Leader or Co-Leader, enforcing hierarchy)
const removeMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;

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

        // Check if requester is in the team and fetch roles
        const requesterMember = team.members.find(m => m.user.toString() === req.user._id.toString());
        const targetMember = team.members.find(m => m.user.toString() === userId.toString());

        if (!requesterMember) {
            return res.status(403).json(
                new ApiError(403, "You are not a member of this team")
            );
        }

        if (!targetMember) {
            return res.status(400).json(
                new ApiError(400, "Target user is not a member of this team")
            );
        }

        // Role authorization check (Hierarchy: Leader > Co-Leader > Member)
        const requesterRole = requesterMember.role;
        const targetRole = targetMember.role;

        if (requesterRole === "Member") {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Members cannot remove players")
            );
        }

        if (requesterRole === "Co-Leader" && (targetRole === "Leader" || targetRole === "Co-Leader")) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Co-Leaders cannot remove the Leader or other Co-Leaders")
            );
        }

        // Remove from members
        team.members = team.members.filter(m => m.user.toString() !== userId.toString());
        await team.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                team,
                "Member Removed Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Update Member Role (Leader only)
const updateMemberRole = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId, role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Team ID or User ID")
            );
        }

        if (!["Co-Leader", "Member"].includes(role)) {
            return res.status(400).json(
                new ApiError(400, "Invalid role. Allowed values: Co-Leader, Member")
            );
        }

        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json(
                new ApiError(404, "Team not found")
            );
        }

        // Leader check
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Only the team leader can manage member roles")
            );
        }

        // Target member check
        const targetMember = team.members.find(m => m.user.toString() === userId.toString());
        if (!targetMember) {
            return res.status(400).json(
                new ApiError(400, "User is not a member of this team")
            );
        }

        // Prevent leader role updates here
        if (targetMember.role === "Leader") {
            return res.status(400).json(
                new ApiError(400, "Use leadership transfer endpoint to reassign the Leader role")
            );
        }

        targetMember.role = role;
        await team.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                team,
                `Role updated to ${role} successfully`
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Transfer Leadership (Leader only)
const transferLeadership = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;

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

        // Leader check
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: Only the team leader can transfer leadership")
            );
        }

        if (team.leader.toString() === userId.toString()) {
            return res.status(400).json(
                new ApiError(400, "You are already the team leader")
            );
        }

        // Verify target user is a member
        const targetMember = team.members.find(m => m.user.toString() === userId.toString());
        if (!targetMember) {
            return res.status(400).json(
                new ApiError(400, "Target user must be a member of the team before leadership transfer")
            );
        }

        // Reassign Leader role
        const currentLeaderMember = team.members.find(m => m.user.toString() === req.user._id.toString());
        currentLeaderMember.role = "Co-Leader"; // Make former leader a Co-Leader
        targetMember.role = "Leader";
        team.leader = userId;

        await team.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                team,
                "Team Leadership Transferred Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

export {
    createTeam,
    getTeamDetails,
    getAllTeams,
    updateTeam,
    deleteTeam,
    leaveTeam,
    removeMember,
    updateMemberRole,
    transferLeadership
};
