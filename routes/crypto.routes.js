import express from "express";
import { verifyDeposit, getAdminWallet } from "../controllers/crypto.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const router = express.Router();

// Protected routes
router.post("/verify-deposit", auth, verifyDeposit);

// Admin wallet address (could be public or protected, making it protected for now based on context or public?)
// Controller doesn't check auth, but usually getting admin wallet is for users to deposit.
// Let's make it authenticated at least.
router.get("/admin-wallet", auth, getAdminWallet);

export default router;
