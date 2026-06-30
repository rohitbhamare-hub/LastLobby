import mongoose from "mongoose";
import { Friend } from "../models/Friend.models.js";
import { User } from "../models/User.models.js";
import { GameProfile } from "../models/Gameprofile.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

// Fetch the logged-in user's friends list
const getFriendsList = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all friendships involving the current user
        const friendships = await Friend.find({
            $or: [{ user1: userId }, { user2: userId }]
        })
        .populate("user1", "username avatar bio country languages discordUsername profileCompleted")
        .populate("user2", "username avatar bio country languages discordUsername profileCompleted");

        if (friendships.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, [], "Friends list is empty")
            );
        }

        // Extract friend IDs
        const friendIds = friendships.map(f => {
            return f.user1._id.toString() === userId.toString() ? f.user2._id : f.user1._id;
        });

        // Efficiently fetch public game profiles for all friends in one query
        const games = await GameProfile.find({
            user: { $in: friendIds },
            visibility: "Public"
        });

        // Group games by user ID
        const gamesByUser = {};
        games.forEach(g => {
            const friendIdStr = g.user.toString();
            if (!gamesByUser[friendIdStr]) {
                gamesByUser[friendIdStr] = [];
            }
            gamesByUser[friendIdStr].push(g);
        });

        // Construct friends list response objects
        const friendsList = friendships.map(f => {
            const isUser1Me = f.user1._id.toString() === userId.toString();
            const friendUser = isUser1Me ? f.user2 : f.user1;
            const friendObj = friendUser.toObject ? friendUser.toObject() : friendUser;

            return {
                friendshipId: f._id,
                ...friendObj,
                games: gamesByUser[friendUser._id.toString()] || [],
                isOnline: false, // Default placeholder for online/offline status
                friendsSince: f.createdAt
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                friendsList,
                "Friends List Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// View a friend's public profile (Friend-only authorization check)
const getFriendProfile = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Friend ID")
            );
        }

        // Verify mutual friendship exists first
        const friendship = await Friend.findOne({
            $or: [
                { user1: userId, user2: friendId },
                { user1: friendId, user2: userId }
            ]
        });

        if (!friendship) {
            return res.status(403).json(
                new ApiError(403, "Access Denied: You are not friends with this user")
            );
        }

        // Fetch user information, hiding password, email, and refresh token
        const user = await User.findById(friendId)
            .select("-password -refreshToken -email");

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        // Fetch public game profiles of the friend
        const gameProfiles = await GameProfile.find({
            user: friendId,
            visibility: "Public"
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user,
                    gameProfiles,
                    friendsSince: friendship.createdAt
                },
                "Friend Public Profile Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Remove a friend (Deletes relationship mutually from both users)
const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Friend ID")
            );
        }

        // Find and delete the friendship document
        const deletedFriendship = await Friend.findOneAndDelete({
            $or: [
                { user1: userId, user2: friendId },
                { user1: friendId, user2: userId }
            ]
        });

        if (!deletedFriendship) {
            return res.status(404).json(
                new ApiError(404, "Friendship not found or already removed")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Friend Removed Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

export {
    getFriendsList,
    getFriendProfile,
    removeFriend
};
