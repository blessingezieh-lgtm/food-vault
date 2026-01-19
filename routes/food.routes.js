import express from "express";
import { addFood, getAllFoods } from "../controllers/food.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllFoods);

// Admin routes
router.post("/", auth, verifyAdmin, addFood);

export default router;
