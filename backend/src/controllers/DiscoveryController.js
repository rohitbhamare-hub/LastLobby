import mongoose from "mongoose";
import { GameProfile } from "../models/Gameprofile.models.js";
import { User } from "../models/User.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

// Search other players / game profiles based on filters
const searchPlayers = async (req, res) => {
    try {
        const {
            gameName,
            rank,
            region,
            preferredRole,
            playStyle,
            language,
            playTime,
            lookingForMode,
            username,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortType = "desc"
        } = req.query;

        // Base query conditions: public profiles only, and exclude current user's profiles
        const query = {
            visibility: "Public",
            user: { $ne: req.user._id }
        };

        // If username filter is provided, find matching users first
        if (username && username.trim() !== "") {
            const users = await User.find({
                username: { $regex: username.trim(), $options: "i" }
            }).select("_id");

            if (users.length === 0) {
                // If no matching users found, return empty results early
                return res.status(200).json(
                    new ApiResponse(
                        200,
                        {
                            profiles: [],
                            pagination: {
                                totalItems: 0,
                                totalPages: 0,
                                currentPage: Number(page),
                                limit: Number(limit)
                            }
                        },
                        "No matching players found"
                    )
                );
            }

            const userIds = users.map(u => u._id);
            query.user = { $in: userIds, $ne: req.user._id };
        }

        // Apply Game Profile filters
        if (gameName && gameName.trim() !== "") {
            query.gameName = { $regex: gameName.trim(), $options: "i" };
        }

        if (rank && rank.trim() !== "") {
            query.rank = { $regex: rank.trim(), $options: "i" };
        }

        if (region && region.trim() !== "") {
            query.region = { $regex: region.trim(), $options: "i" };
        }

        if (preferredRole && preferredRole.trim() !== "") {
            query.preferredRole = { $regex: preferredRole.trim(), $options: "i" };
        }

        if (playStyle && playStyle.trim() !== "") {
            query.playStyle = { $regex: playStyle.trim(), $options: "i" };
        }

        if (playTime && playTime.trim() !== "") {
            query.playTime = { $regex: playTime.trim(), $options: "i" };
        }

        if (lookingForMode && lookingForMode.trim() !== "") {
            query.lookingForMode = { $regex: lookingForMode.trim(), $options: "i" };
        }

        if (language && language.trim() !== "") {
            query.languages = { $regex: language.trim(), $options: "i" };
        }

        // Pagination parameters
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);
        const skip = (pageNum - 1) * limitNum;

        // Sorting configuration
        const allowedSortFields = ["createdAt", "level", "gameName"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
        const sort = { [sortField]: sortOrder };

        // Execute query with skip, limit, sort, and populate user fields (excluding sensitive information)
        const profiles = await GameProfile.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate("user", "username avatar bio country languages discordUsername profileCompleted");

        const totalItems = await GameProfile.countDocuments(query);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    profiles,
                    pagination: {
                        totalItems,
                        totalPages: Math.ceil(totalItems / limitNum),
                        currentPage: pageNum,
                        limit: limitNum
                    }
                },
                "Players Discovered Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get another player's public profile and their public game profiles
const getPlayerPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid User ID")
            );
        }

        // Select profile information while hiding email, password, and refreshToken
        const user = await User.findById(userId)
            .select("-password -refreshToken -email");

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        // Fetch user's public game profiles
        const gameProfiles = await GameProfile.find({
            user: userId,
            visibility: "Public"
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user,
                    gameProfiles
                },
                "Player Public Profile Fetched Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

export {
    searchPlayers,
    getPlayerPublicProfile
};
