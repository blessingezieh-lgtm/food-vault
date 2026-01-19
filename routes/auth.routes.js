import express from "express";
import { register, login, refreshToken, logout, getMe } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);

export default router;
