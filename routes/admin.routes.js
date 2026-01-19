import express from "express";
import {
    getAllSavingsPlans,
    activateSavingsPlan,
    deleteSavingsPlan,
    getAdminStats
} from "../controllers/admin.controller.js";
import { auth } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.middleware.js";

const router = express.Router();

// All routes require auth and admin verification
router.use(auth, verifyAdmin);

router.get("/savings-plans", getAllSavingsPlans);
router.get("/stats", getAdminStats);
router.put("/savings-plans/:planId/activate", activateSavingsPlan);
router.delete("/savings-plans/:planId", deleteSavingsPlan);

export default router;
