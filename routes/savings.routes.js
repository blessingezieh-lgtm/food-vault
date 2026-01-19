import express from "express";

const router = express.Router();

// Placeholder routes since controller is missing
router.get("/", (req, res) => {
    res.status(501).json({ message: "Savings feature currently unavailable" });
});

export default router;
