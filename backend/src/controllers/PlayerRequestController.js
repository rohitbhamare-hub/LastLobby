import mongoose from "mongoose";
import { PlayerRequest } from "../models/PlayerRequest.models.js";
import { User } from "../models/User.models.js";
import { GameProfile } from "../models/Gameprofile.models.js";
import { Friend } from "../models/Friend.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

// Send play request
const sendPlayerRequest = async (req, res) => {
    try {
        const { receiverId, gameProfileId, message } = req.body;

        // Basic inputs check
        if (!receiverId || !gameProfileId) {
            return res.status(400).json(
                new ApiError(400, "Receiver ID and Game Profile ID are required")
            );
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(gameProfileId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Receiver ID or Game Profile ID")
            );
        }

        // Prevent self-request
        if (req.user._id.toString() === receiverId) {
            return res.status(400).json(
                new ApiError(400, "You cannot send a play request to yourself")
            );
        }

        // Verify receiver user exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json(
                new ApiError(404, "Receiver not found")
            );
        }

        // Verify game profile exists and belongs to the receiver
        const gameProfile = await GameProfile.findById(gameProfileId);
        if (!gameProfile) {
            return res.status(404).json(
                new ApiError(404, "Game Profile not found")
            );
        }

        if (gameProfile.user.toString() !== receiverId) {
            return res.status(400).json(
                new ApiError(400, "Game Profile does not belong to the specified receiver")
            );
        }

        // Verify if a pending request already exists for this game profile from the sender
        const existingPendingRequest = await PlayerRequest.findOne({
            sender: req.user._id,
            receiver: receiverId,
            gameProfile: gameProfileId,
            status: "Pending"
        });

        if (existingPendingRequest) {
            return res.status(400).json(
                new ApiError(400, "A pending play request already exists for this game profile")
            );
        }

        // Create player request
        const playerRequest = await PlayerRequest.create({
            sender: req.user._id,
            receiver: receiverId,
            gameProfile: gameProfileId,
            message: message ? message.trim() : "",
            status: "Pending"
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                playerRequest,
                "Play Request Sent Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Cancel play request (Sender Action)
const cancelPlayerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Request ID")
            );
        }

        const request = await PlayerRequest.findById(requestId);
        if (!request) {
            return res.status(404).json(
                new ApiError(404, "Play request not found")
            );
        }

        // Check authorization (Must be sender)
        if (request.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Unauthorized to cancel this play request")
            );
        }

        // Check if status is Pending
        if (request.status !== "Pending") {
            return res.status(400).json(
                new ApiError(400, `Cannot cancel request because it is already '${request.status}'`)
            );
        }

        // Update status to Cancelled
        request.status = "Cancelled";
        await request.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                request,
                "Play Request Cancelled Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Accept play request (Receiver Action)
const acceptPlayerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Request ID")
            );
        }

        const request = await PlayerRequest.findById(requestId);
        if (!request) {
            return res.status(404).json(
                new ApiError(404, "Play request not found")
            );
        }

        // Check authorization (Must be receiver)
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Unauthorized to accept this play request")
            );
        }

        // Check if status is Pending
        if (request.status !== "Pending") {
            return res.status(400).json(
                new ApiError(400, `Cannot accept request because it is already '${request.status}'`)
            );
        }

        // Update status to Accepted
        request.status = "Accepted";
        await request.save();

        // Create mutual friendship: user1 is lexicographically smaller ObjectId
        const u1 = request.sender.toString() < request.receiver.toString() ? request.sender : request.receiver;
        const u2 = request.sender.toString() < request.receiver.toString() ? request.receiver : request.sender;

        // Check if friendship already exists to prevent duplicate friendships
        const existingFriendship = await Friend.findOne({ user1: u1, user2: u2 });
        if (!existingFriendship) {
            await Friend.create({ user1: u1, user2: u2 });
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                request,
                "Play Request Accepted Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Reject play request (Receiver Action)
const rejectPlayerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Request ID")
            );
        }

        const request = await PlayerRequest.findById(requestId);
        if (!request) {
            return res.status(404).json(
                new ApiError(404, "Play request not found")
            );
        }

        // Check authorization (Must be receiver)
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Unauthorized to reject this play request")
            );
        }

        // Check if status is Pending
        if (request.status !== "Pending") {
            return res.status(400).json(
                new ApiError(400, `Cannot reject request because it is already '${request.status}'`)
            );
        }

        // Update status to Rejected
        request.status = "Rejected";
        await request.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                request,
                "Play Request Rejected Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get Received Play Requests
const getReceivedRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const query = { receiver: req.user._id };

        // Optional status filter
        if (status) {
            query.status = status;
        }

        const requests = await PlayerRequest.find(query)
            .sort({ createdAt: -1 })
            .populate("sender", "username avatar bio country languages discordUsername profileCompleted")
            .populate("gameProfile");

        return res.status(200).json(
            new ApiResponse(
                200,
                requests,
                "Received Play Requests Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get Sent Play Requests
const getSentRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const query = { sender: req.user._id };

        // Optional status filter
        if (status) {
            query.status = status;
        }

        const requests = await PlayerRequest.find(query)
            .sort({ createdAt: -1 })
            .populate("receiver", "username avatar bio country languages discordUsername profileCompleted")
            .populate("gameProfile");

        return res.status(200).json(
            new ApiResponse(
                200,
                requests,
                "Sent Play Requests Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

export {
    sendPlayerRequest,
    cancelPlayerRequest,
    acceptPlayerRequest,
    rejectPlayerRequest,
    getReceivedRequests,
    getSentRequests
};
