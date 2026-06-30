import { User } from "../models/User.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

const getCurrentUser = async (req, res) => {

    try {

        const user = await User.findById(req.user._id)
            .select("-password -refreshToken");

        return res.status(200).json(
            new ApiResponse(
                200,
                user,
                "Current User Fetched Successfully"
            )
        );

    } catch (error) {

        return res.status(500).json(
            new ApiError(500, error.message)
        );

    }

};


const completeProfile = async (req, res) => {

    try {

        const {
            avatar,
            bio,
            country,
            languages,
            discordUsername
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        user.avatar = avatar;
        user.bio = bio;
        user.country = country;
        user.languages = languages;
        user.discordUsername = discordUsername;

        user.profileCompleted = true;

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                user,
                "Profile Completed Successfully"
            )
        );

    } catch (error) {

        return res.status(500).json(
            new ApiError(500, error.message)
        );

    }

};



const updateProfile = async (req, res) => {

    try {

        const {
            avatar,
            bio,
            country,
            languages,
            discordUsername
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json(
                new ApiError(404, "User not found")
            );
        }

        if (avatar) user.avatar = avatar;

        if (bio) user.bio = bio;

        if (country) user.country = country;

        if (languages) user.languages = languages;

        if (discordUsername)
            user.discordUsername = discordUsername;

        await user.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                user,
                "Profile Updated Successfully"
            )
        );

    } catch (error) {

        return res.status(500).json(
            new ApiError(500, error.message)
        );

    }

};

const deleteAccount = async (req, res) => {

    try {

        await User.findByIdAndDelete(req.user._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Account Deleted Successfully"
            )
        );

    } catch (error) {

        return res.status(500).json(
            new ApiError(500, error.message)
        );

    }

};

export { getCurrentUser , completeProfile , updateProfile , deleteAccount};