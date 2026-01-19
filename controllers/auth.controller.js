import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

import Wallet from "../models/wallet.js";
import { generateTokens } from "../utils/generateTokens.js";



// Register user
export const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone
        });

        // Create wallet for user
        await Wallet.create({
            user: user._id
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

        // Remove sensitive data
        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt
        };

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Login user
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Remove sensitive data
        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt
        };

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // Find user with this refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        // Update refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// Logout
export const logout = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Get current user
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select("-password -refreshToken");
        const wallet = await Wallet.findOne({ user: req.userId });

        res.json({
            success: true,
            data: {
                user,
                wallet
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    register,
    login,
    refreshToken,
    logout,
    getMe
};

