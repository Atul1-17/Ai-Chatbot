import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = asyncHandler(async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
})

const registerUser = asyncHandler(async (req, res) => {
    // get data from request body
    const { fullname, phoneNo, email, password } = req.body;

    // validation
    if (
        [fullname, phoneNo, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists
    const existedUser = await User.findOne({
        $or: [{ email }, { phoneNo }]
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with email or phone number already exists"
        );
    }

    // get avatar buffer from multer memory storage
    let avatarBuffer;

    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarBuffer = req.files.avatar[0].buffer;
    }

    // avatar is required
    if (!avatarBuffer) {
        throw new ApiError(400, "Avatar file is required");
    }

    // upload avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarBuffer);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // create user
    const user = await User.create({
        fullname,
        phoneNo,
        email,
        password,

        avatar: avatar.secure_url,
        avatarPublicId: avatar.public_id
    });

    // remove sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // check user creation
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering user"
        );
    }

    // send response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
})

const loginUser = asyncHandler(async (req, res) => {
    // get data from request body
    const { email, phoneNo, password } = req.body;

    // validation
    if (!email && !phoneNo) {
        throw new ApiError(
            400,
            "Email or phone number is required"
        );
    }

    // find user
    const user = await User.findOne({
        $or: [{ email }, { phoneNo }]
    });

    // check user exists
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(
            401,
            "Invalid user credentials"
        );
    }

    // generate tokens
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user._id);

    // get logged in user without sensitive fields
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    // cookie options
    const options = {
        httpOnly: true,
        secure: true
    };

    // send response
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
                "User logged in successfully"
            )
        );
})

const logoutUser = asyncHandler(async (req, res) => {
    // removing the refresh token from the database 
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    // clearing the cookies
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token ")
        }

        if (!user.refreshToken) {
            throw new ApiError(401, "Refresh token not found for this user, please log in again.");
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token does not match")
        }
    
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        const userToSend = await User.findById(user._id).select("-password -refreshToken");
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200,{accessToken, user: userToSend },"Access token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}