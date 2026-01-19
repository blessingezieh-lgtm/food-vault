import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js"; // Assuming these are exported from config/env.js

export const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN || "15m",
    });

    const refreshToken = jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
