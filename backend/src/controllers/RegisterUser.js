import jwt from "jsonwebtoken";
import { User } from "../models/User.models.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/APIresponse.js";

const registerUser = async (req, res) => {
    try {

        const { username, email, password } = req.body;

        // Check Empty Fields
        if (!username || !email || !password) {
            return res
                .status(400)
                .json(new ApiError(400, "All fields are required"));
        }

        // Check Existing User
        const existedUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existedUser) {
            return res
                .status(409)
                .json(new ApiError(409, "User already exists"));
        }

        // Create User
        const user = await User.create({
            username,
            email,
            password
        });

        // Fetch User without Password
        const createdUser = await User.findById(user._id)
            .select("-password -refreshToken");

        return res.status(201).json(
            new ApiResponse(
                201,
                createdUser,
                "User Registered Successfully"
            )
        );

    } catch (error) {

        return res.status(500).json(
            new ApiError(
                500,
                error.message || "Internal Server Error"
            )
        );

    }
};


const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json(new ApiError(400, "Email and Password are required"));
        }

        const user = await User.findOne({ email })
            .select("+password +refreshToken");

        if (!user) {
            return res
                .status(404)
                .json(new ApiError(404, "User not found"));
        }

        const isPasswordCorrect =
            await user.isPasswordCorrect(password);

        if (!isPasswordCorrect) {
            return res
                .status(401)
                .json(new ApiError(401, "Invalid Password"));
        }

    const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: false
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    "Login Successful"
                )
            );

    } catch (error) {

        return res.status(500).json(
            new ApiError(
                500,
                error.message || "Internal Server Error"
            )
        );

    }
};


const logoutUser = async (req, res) => {

    try {

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            }
        );

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Logout Successful"
                )
            );

    } catch (error) {

        return res.status(500).json(
            new ApiError(
                500,
                error.message || "Internal Server Error"
            )
        );

    }

};

const generateAccessAndRefreshTokens = async (userId) => {

    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return {
        accessToken,
        refreshToken
    };

};

const refreshAccessToken = async (req, res) => {

    try {

        const incomingRefreshToken =
            req.cookies.refreshToken ||
            req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                message: "Refresh Token Required"
            });
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id)
            .select("+refreshToken");

        if (!user) {
            return res.status(401).json({
                message: "Invalid Refresh Token"
            });
        }

        if (incomingRefreshToken !== user.refreshToken) {
            return res.status(401).json({
                message: "Refresh Token Expired"
            });
        }

        const {
            accessToken,
            refreshToken
        } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                success: true,
                accessToken,
                refreshToken
            });

    } catch (error) {

        return res.status(401).json({
            message: error.message
        });

    }

};

export { registerUser, loginUser, logoutUser , refreshAccessToken };
