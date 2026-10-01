import express from "express";

import {
    createSavingsPlan,
    getSavingsPlans,
    getSavingsPlan,
    cancelSavingsPlan
} from "../controllers/savings.controller.js";

import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();


// Create a savings plan
router.post("/", auth, createSavingsPlan);

// Get all savings plans belonging to logged-in user
router.get("/", auth, getSavingsPlans);

// Get one savings plan
router.get("/:id", auth, getSavingsPlan);

// Cancel a savings plan
router.patch("/:id/cancel", auth, cancelSavingsPlan);


export default router;
