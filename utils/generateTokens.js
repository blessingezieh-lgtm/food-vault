import jwt from "jsonwebtoken";
import {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN
} from "../config/env.js";

export const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        JWT_ACCESS_SECRET,
        {
            expiresIn: JWT_ACCESS_EXPIRES_IN || "15m",
        }
    );

    const refreshToken = jwt.sign(
        { userId },
        JWT_REFRESH_SECRET,
        {
            expiresIn: JWT_REFRESH_EXPIRES_IN || "7d",
        }
    );

    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_ACCESS_SECRET);
};