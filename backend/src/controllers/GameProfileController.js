import mongoose from "mongoose";
import { GameProfile } from "../models/Gameprofile.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

// Create Game Profile
const createGameProfile = async (req, res) => {
    try {
        const {
            gameName,
            gameUID,
            level,
            rank,
            region,
            preferredRole,
            playStyle,
            languages,
            playTime,
            lookingForMode,
            visibility
        } = req.body;

        // Check required fields
        if (!gameName || !gameUID) {
            return res.status(400).json(
                new ApiError(400, "Game Name and Game UID are required")
            );
        }

        // Case-insensitive check for duplicate game profile for the same game by this user
        const existingProfile = await GameProfile.findOne({
            user: req.user._id,
            gameName: { $regex: new RegExp("^" + gameName.trim() + "$", "i") }
        });

        if (existingProfile) {
            return res.status(400).json(
                new ApiError(400, `Game profile for '${gameName}' already exists`)
            );
        }

        // Create the game profile
        const gameProfile = await GameProfile.create({
            user: req.user._id,
            gameName: gameName.trim(),
            gameUID: gameUID.trim(),
            level: level !== undefined ? Number(level) : 0,
            rank: rank ? rank.trim() : "",
            region: region ? region.trim() : "",
            preferredRole: preferredRole ? preferredRole.trim() : "",
            playStyle: playStyle ? playStyle.trim() : "",
            languages: Array.isArray(languages) ? languages : [],
            playTime: playTime ? playTime.trim() : "",
            lookingForMode: lookingForMode || "Casual",
            visibility: visibility || "Public"
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                gameProfile,
                "Game Profile Created Successfully"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get All Game Profiles of Current User
const getAllUserGameProfiles = async (req, res) => {
    try {
        const profiles = await GameProfile.find({ user: req.user._id });

        return res.status(200).json(
            new ApiResponse(
                200,
                profiles,
                "User Game Profiles Fetched Successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Get Single Game Profile by ID
const getGameProfileById = async (req, res) => {
    try {
        const { profileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Game Profile ID")
            );
        }

        const profile = await GameProfile.findById(profileId);

        if (!profile) {
            return res.status(404).json(
                new ApiError(404, "Game Profile not found")
            );
        }

        // Ensure owner owns it
        if (profile.user.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Unauthorized to access this game profile")
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                profile,
                "Game Profile Fetched Successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Update Game Profile
const updateGameProfile = async (req, res) => {
    try {
        const { profileId } = req.params;
        const {
            gameName,
            gameUID,
            level,
            rank,
            region,
            preferredRole,
            playStyle,
            languages,
            playTime,
            lookingForMode,
            visibility
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Game Profile ID")
            );
        }

        const profile = await GameProfile.findById(profileId);

        if (!profile) {
            return res.status(404).json(
                new ApiError(404, "Game Profile not found")
            );
        }

        // Ensure owner owns it
        if (profile.user.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Unauthorized to update this game profile")
            );
        }

        // If gameName is changing, verify no duplicates (case-insensitive)
        if (gameName && gameName.trim().toLowerCase() !== profile.gameName.toLowerCase()) {
            const existingProfile = await GameProfile.findOne({
                user: req.user._id,
                gameName: { $regex: new RegExp("^" + gameName.trim() + "$", "i") }
            });

            if (existingProfile) {
                return res.status(400).json(
                    new ApiError(400, `Game profile for '${gameName}' already exists`)
                );
            }
            profile.gameName = gameName.trim();
        }

        if (gameUID !== undefined) profile.gameUID = gameUID.trim();
        if (level !== undefined) profile.level = Number(level);
        if (rank !== undefined) profile.rank = rank.trim();
        if (region !== undefined) profile.region = region.trim();
        if (preferredRole !== undefined) profile.preferredRole = preferredRole.trim();
        if (playStyle !== undefined) profile.playStyle = playStyle.trim();
        if (languages !== undefined) profile.languages = Array.isArray(languages) ? languages : [];
        if (playTime !== undefined) profile.playTime = playTime.trim();
        if (lookingForMode !== undefined) profile.lookingForMode = lookingForMode;
        if (visibility !== undefined) profile.visibility = visibility;

        await profile.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                profile,
                "Game Profile Updated Successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

// Delete Game Profile
const deleteGameProfile = async (req, res) => {
    try {
        const { profileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(profileId)) {
            return res.status(400).json(
                new ApiError(400, "Invalid Game Profile ID")
            );
        }

        const profile = await GameProfile.findById(profileId);

        if (!profile) {
            return res.status(404).json(
                new ApiError(404, "Game Profile not found")
            );
        }

        // Ensure owner owns it
        if (profile.user.toString() !== req.user._id.toString()) {
            return res.status(403).json(
                new ApiError(403, "Unauthorized to delete this game profile")
            );
        }

        await GameProfile.findByIdAndDelete(profileId);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Game Profile Deleted Successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiError(500, error.message || "Internal Server Error")
        );
    }
};

export {
    createGameProfile,
    getAllUserGameProfiles,
    getGameProfileById,
    updateGameProfile,
    deleteGameProfile
};
