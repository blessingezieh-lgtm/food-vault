import express from "express";
import {
    initializePayment,
    verifyPayment,
    getTransactions,
    paystackWebhook
} from "../controllers/payment.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/initialize", auth, initializePayment);
router.get("/verify", auth, verifyPayment); // User verifies their payment
router.get("/", auth, getTransactions);// Get user's transaction history
router.get("/transactions", auth, getTransactions); // Get user's transaction history

// Webhook typically doesn't use auth middleware as it comes from external service
// However, signature verification is handled in the controller
router.post("/webhook/paystack", paystackWebhook);

export default router;
