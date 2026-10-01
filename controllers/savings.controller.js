import SavingsPlan from "../models/SavingsPlan.js";


// CREATE SAVINGS PLAN
export const createSavingsPlan = async (req, res, next) => {
    try {
        const {
            title,
            description,
            targetAmount,
            monthlyAmount,
            durationMonths,
            paymentType,
            recurrence,
            autoDebit
        } = req.body;

        // Validate required fields
        if (
            !title ||
            !targetAmount ||
            !monthlyAmount ||
            !durationMonths
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, target amount, monthly amount and duration are required"
            });
        }

        // Create savings plan for the logged-in user
        const savingsPlan = await SavingsPlan.create({
            user: req.userId,
            title,
            description,
            targetAmount,
            monthlyAmount,
            durationMonths,
            paymentType,
            recurrence,
            autoDebit
        });

        return res.status(201).json({
            success: true,
            message: "Savings plan created successfully",
            data: savingsPlan
        });

    } catch (error) {
        next(error);
    }
};


// GET USER'S SAVINGS PLANS
export const getSavingsPlans = async (req, res, next) => {
    try {
        const savingsPlans = await SavingsPlan.find({
            user: req.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: savingsPlans.length,
            data: savingsPlans
        });

    } catch (error) {
        next(error);
    }
};


// GET ONE SAVINGS PLAN
export const getSavingsPlan = async (req, res, next) => {
    try {
        const savingsPlan = await SavingsPlan.findOne({
            _id: req.params.id,
            user: req.userId
        });

        if (!savingsPlan) {
            return res.status(404).json({
                success: false,
                message: "Savings plan not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: savingsPlan
        });

    } catch (error) {
        next(error);
    }
};


// CANCEL SAVINGS PLAN
export const cancelSavingsPlan = async (req, res, next) => {
    try {
        const savingsPlan = await SavingsPlan.findOne({
            _id: req.params.id,
            user: req.userId
        });

        if (!savingsPlan) {
            return res.status(404).json({
                success: false,
                message: "Savings plan not found"
            });
        }

        if (savingsPlan.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "Only active savings plans can be cancelled"
            });
        }

        savingsPlan.status = "cancelled";

        await savingsPlan.save();

        return res.status(200).json({
            success: true,
            message: "Savings plan cancelled successfully",
            data: savingsPlan
        });

    } catch (error) {
        next(error);
    }
};