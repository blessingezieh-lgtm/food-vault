import mongoose from "mongoose";
// import Transaction from "../models/transaction.model.js";
import SavingsPlan from "../models/SavingsPlan.js";
import User from "../models/user.model.js";
import FoodPackage from "../models/foodPackage.model.js";
import Wallet from "../models/wallet.js";
import Paystack from "paystack";




const client = new Paystack(process.env.PAYSTACK_SECRET_KEY);


export const createSavingsPlan = async (req, res, next) => {
  try {
    const { title, description, targetAmount, monthlyAmount, weeklyAmount, durationMonths, paymentType, recurrence, autoDebit } = req.body;

    // Validation
    if (durationMonths < 3) return res.status(400).json({

       success: false, message: "Minimum duration is 3 months" });

    if (monthlyAmount * durationMonths < targetAmount) 
      return res.status(400).json({ 

    success: false, message: "Monthly amount too low to reach target" });

    if (weeklyAmount * durationMonths < targetAmount) 
      return res.status(400).json({ 
 success: false, message: "Weekly amount too low to reach target" });

    // ✅ Use the model to create
    const newPlan = await SavingsPlan.create({
      user: req.userId,
      title,
      description,
      targetAmount,
      monthlyAmount,
      weeklyAmount,
      durationMonths,
      paymentType: paymentType || "one-time",
      recurrence: recurrence || "monthly",
      autoDebit: autoDebit || false
    });

    // ✅ Use the variable only after creation
    return res.status(201).json({
      success: true,
      message: "Savings plan created successfully",
      data: newPlan
    });
  } catch (error) {
    next(error);
  }
};

export const getSavingsPlan = async (req, res, next) => {
    try {
        const savingsPlan = await savingsPlan.findOne({
            _id: req.params.id,
            user: req.userId
        });

        if (!savingsPlan) {
            return res.status(404).json({
                success: false,
                message: "Savings plan not found"
            });
        }

        res.json({
            success: true,
            data: savingsPlan
        });
    } catch (error) {
        next(error);
    }
};

export const getMyPlans = async (req, res, next) => {
    try {
        const savingsPlans = await SavingsPlan.find({ user: req.userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: savingsPlans.length,
            data: savingsPlans
        });
    } catch (error) {
        next(error);
    }
};

export const updateSavingsPlan = async (req, res, next) => {
    try {
        const savingsPlan = await SavingsPlan.findOneAndUpdate(
            { _id: req.params.id, user: req.userId, status: "active" },
            req.body,
            { new: true, runValidators: true }
        );

        if (!savingsPlan) {
            return res.status(404).json({
                success: false,
                message: "Savings plan not found or cannot be updated"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Savings plan updated successfully",
            data: savingsPlan
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSavingsPlan = async (req, res, next) => {
    try {
        const savingsPlan = await SavingsPlan.findOneAndUpdate(
            { _id: req.params.id, user: req.userId, status: "active" },
            { status: "cancelled" },
            { new: true }
        );

        if (!savingsPlan) {
            return res.status(404).json({
                success: false,
                message: "Savings plan not found"
            });
        }

        res.json({
            success: true,
            message: "Savings plan cancelled successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getDashboard = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id;

    const plans = await savingsPlan.find({ userId });

    const totalPlans = plans.length;
    const totalTargetAmount = plans.reduce(
      (sum, p) => sum + p.targetAmount,
      0
    );

    const autoDeductionPlans = plans.filter(p => p.isAutoDeduction).length;
    const manualPlans = totalPlans - autoDeductionPlans;

    const plansWithProgress = plans.map(p => ({
      id: p._id,
      foodType: p.foodType,
      targetAmount: p.targetAmount,
      frequency: p.frequency,
      isActive: p.isActive,
      isAutoDeduction: p.isAutoDeduction || false,
      progress: p.amountSaved
        ? ((p.amountSaved / p.targetAmount) * 100).toFixed(2)
        : "0",
    }));

    res.status(200).json({
      totalPlans,
      totalTargetAmount,
      autoDeductionPlans,
      manualPlans,
      plans: plansWithProgress
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
};

export const getSavingsProgress = async (req, res, next) => {
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

        const progress = {
            currentBalance: savingsPlan.currentBalance,
            targetAmount: savingsPlan.targetAmount,
            monthlyAmount: savingsPlan.monthlyAmount,
            progressPercentage: (savingsPlan.currentBalance / savingsPlan.targetAmount) * 100,
            monthsRemaining: savingsPlan.durationMonths,
            monthsCompleted: Math.floor(savingsPlan.currentBalance / savingsPlan.monthlyAmount),
            amountRemaining: savingsPlan.targetAmount - savingsPlan.currentBalance,
            startDate: savingsPlan.startDate,
            endDate: savingsPlan.endDate,
            nextPaymentDate: savingsPlan.nextPaymentDate
        };

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createSavingsPlan,
    getSavingsPlan,
    getMyPlans,
    updateSavingsPlan,
    deleteSavingsPlan,
    getSavingsProgress
};

export const getFoodPackages = async (req, res) => {
  try {
    const packages = await FoodPackage.find().select("-__v");
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const selectFoodPackage = async (req, res) => {
  try {
    const { packageId, custom, customItems } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let selectedPackage;

    if (custom) {
      // Create a custom package for this user
      selectedPackage = await FoodPackage.create({
        name: "Custom",
        displayName: "My Custom Package",
        description: "Created by user",
        isPredefined: false,
        customItems: customItems || []
      });
    } else {
      // Validate that the predefined package exists
      if (!packageId) {
        return res.status(400).json({ message: "Package ID is required for predefined packages" });
      }

      selectedPackage = await FoodPackage.findById(packageId);
      if (!selectedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
    }

    // Update the user's selected package
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        selectedPackage: selectedPackage._id,
        customPackageItems: custom ? customItems : [],
        hasCompletedPackageSelection: true
      },
      { new: true }
    ).populate("selectedPackage");

    res.json({
      message: "Food package selected successfully!",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        selectedPackage: user.selectedPackage,
        hasCompletedPackageSelection: user.hasCompletedPackageSelection
      }
    });

  } catch (error) {
    console.error("selectFoodPackage error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 1. Initialize Payment (called from frontend)
export const initializePayment = async (req, res) => {
  try {
    const { amount, email, planId } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ message: "Amount and email required" });
    }

    console.log("Initializing payment for:", { email, amount, planId });
    console.log("Paystack key:", process.env.PAYSTACK_SECRET_KEY);

    const transaction = await client.transaction.initialize({
      email: email, // use the email from request
      amount: amount * 100, // Paystack uses kobo
      reference: `FOODVAULT_${Date.now()}`,
      metadata: {
        userId: req.user?._id.toString() || null,
        planId: planId || null
      },
      callback_url: "http://localhost:3000/api/v1/payment/verify"
    });

    res.json({
      authorization_url: transaction.data.authorization_url,
      reference: transaction.data.reference
    });
  } catch (err) {
    console.error("Initialization error:", err);
    res.status(500).json({
      message: "Payment initialization failed",
      error: err?.response?.data || err.message
    });
  }
};

// 2. Verify Paystack Payment (Webhook or after redirect)
export const verifyPayment = async (req, res) => { 
  const ref = req.query.reference;

  if (!ref) {
    return res.status(400).json({ message: "Reference is required" });
  }

  console.log(`Verifying payment for reference: ${ref}`);

  try {
    const verification = await client.transaction.verify(ref);
    console.log("Paystack raw verification response:", verification);

    // ---- SAFETY CHECK ----
    if (!verification || !verification.data) {
      console.log("Invalid response from Paystack");
      return res.redirect("https://foodvault-36sx.onrender.com/payment-failed");
    }

    // ---- PAYMENT FAILED ----
    if (verification.data.status !== "success") {
      console.log("Payment not successful");
      return res.redirect("https://foodvault-36sx.onrender.com/payment-failed");
    }

    const { metadata, amount } = verification.data;

    // ---- PREVENT DOUBLE CREDITING ----
    const existingTxn = await Transaction.findOne({ paymentRef: ref });

    if (existingTxn) {
      console.log("Duplicate transaction attempt blocked.");
      return res.redirect(`https://foodvault-36sx.onrender.com/payment-success?ref=${ref}`);
    }

    // ---- PROCESS SAVINGS PLAN PAYMENT ----
    if (metadata?.planId) {
      const plan = await savingsPlan.findById(metadata.planId);

      if (!plan) {
        console.log("Plan not found");
        return res.redirect("https://foodvault-36sx.onrender.com/payment-failed");
      }

      // Convert kobo → naira
      const paidAmount = amount / 100;

      // Update plan balance
      await savingsPlan.findByIdAndUpdate(metadata.planId, {
        $inc: { currentAmount: paidAmount },
        lastPaymentRef: ref,
      });

      // Save transaction record
      await Transaction.create({
        planId: metadata.planId,
        amount: paidAmount,
        type: "deduction",
        paymentRef: ref,
      });
    }

    // ---- REDIRECT ON SUCCESS ----
    return res.redirect(`https://foodvault-36sx.onrender.com/payment-success?ref=${ref}`);

  } catch (err) {
    console.error("Paystack verification error:", err.response?.data || err);
    return res.redirect("https://foodvault-36sx.onrender.com/payment-failed");
  }
};



