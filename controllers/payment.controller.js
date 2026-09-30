// Import Paystack SDK
import Paystack from "paystack";
// Initialize Paystack with the secret key from environment variables
const client = new Paystack(process.env.PAYSTACK_SECRET_KEY);

// Import Mongoose Models
import Transaction from "../models/Transaction.model.js";
import SavingsPlan from "../models/SavingsPlan.js";
import Wallet from "../models/wallet.js";
import User from "../models/user.model.js";
// Import Paystack Helper Service
import paystackService from "../utils/paystackService.js";
// Import our custom Transaction Service for handling success logic
import { processSuccessfulTransaction } from "../services/transaction.service.js";

// --- CONTROLLER: Initialize Payment ---
// logic: User requests to deposit/pay -> We tell Paystack -> Paystack gives us a checkout URL
export const initializePayment = async (req, res, next) => {
    try {
        // Get the Savings Plan ID and Amount from the request body
        const { savingsPlanId, amount } = req.body;

        // 1. Verify the savings plan exists and belongs to the user
        const savingsPlan = await SavingsPlan.findOne({
            _id: savingsPlanId,
            user: req.userId,
            status: "active" // Only allow payments for active plans
        });

        if (!savingsPlan) {
            return res.status(404).json({
                success: false,
                message: "Savings plan not found"
            });
        }

        // 2. Validate the payment amount
        // Use the requested amount OR fallback to the plan's default monthly amount
        const paymentAmount = amount || savingsPlan.monthlyAmount;
        if (paymentAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment amount"
            });
        }

        // 3. Get the user's details (we need their email for Paystack)
        const user = await User.findById(req.userId);

        // 4. Create a 'Pending' Transaction record in our database
        // This acts as a placeholder while we wait for the user to pay
        const transaction = await Transaction.create({
            user: req.userId,
            savingsPlan: savingsPlanId,
            amount: paymentAmount,
            status: "pending",
            paymentMethod: "paystack"
        });

        // 5. Call Paystack API to initialize the transaction
        const paystackResponse = await paystackService.initializeTransaction(
            user.email,
            paymentAmount,
            {
                // We attach these IDs as metadata so when Paystack calls our Webhook later,
                // we know exactly which transaction/user this payment is for.
                transactionId: transaction._id.toString(),
                userId: req.userId.toString(),
                savingsPlanId: savingsPlanId.toString(),
                purpose: "savings_deposit"
            }
        );

        // If Paystack fails (e.g., API down, invalid key), update our record to failed
        if (!paystackResponse.success) {
            transaction.status = "failed";
            await transaction.save();

            return res.status(400).json({
                success: false,
                message: paystackResponse.error
            });
        }

        // 6. Update our transaction record with the Paystack Reference
        // This reference is the unique key linking our DB to Paystack's system
        transaction.paystackReference = paystackResponse.data.reference;
        transaction.paystackAccessCode = paystackResponse.data.access_code;
        await transaction.save();

        // 7. Send the Checkout URL back to the frontend
        // The frontend will redirect the user to this URL to enter card details
        res.json({
            success: true,
            message: "Payment initialized successfully",
            data: {
                authorization_url: paystackResponse.data.authorization_url,
                access_code: paystackResponse.data.access_code,
                reference: paystackResponse.data.reference,
                transactionId: transaction._id
            }
        });
    } catch (error) {
        // Pass any unexpected errors to the global error handler
        next(error);
    }
};

// --- CONTROLLER: Verify Payment ---
// logic: Frontend calls this after user returns from Paystack to confirm status
export const verifyPayment = async (req, res, next) => {
    try {
        // Get the payment reference from the URL query (e.g. ?reference=...)
        const { reference } = req.query;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required"
            });
        }

        // 1. Find the transaction by the Paystack reference
        const transaction = await Transaction.findOne({ paystackReference: reference });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        // 2. Check if we already processed this payment
        if (transaction.status === "successful") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                data: transaction
            });
        }

        // 3. Verify the status directly with Paystack API
        // This ensures the user didn't just fake the redirect
        const verification = await paystackService.verifyTransaction(reference);

        if (!verification.success) {
            // If actual verification fails, mark as failed
            transaction.status = "failed";
            await transaction.save();

            return res.status(400).json({
                success: false,
                message: verification.error
            });
        }

        const paystackData = verification.data;

        // 4. Update transaction status based on Paystack response
        if (paystackData.status === "success") {
            // Use our shared service to handle success logic (update wallet, savings plan)
            const updatedTx = await processSuccessfulTransaction(transaction._id, paystackData);

            // Update the local variable to return the fresh data
            Object.assign(transaction, updatedTx.toObject());
        } else {
            // If Paystack says it failed/abandoned
            transaction.status = "failed";
            await transaction.save();
        }

        // 5. Respond with final status
        res.json({
            success: true,
            message: transaction.status === "successful" || paystackData.status === "success"
                ? "Payment verified successfully"
                : "Payment failed",
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// --- CONTROLLER: Get Transaction History ---
// logic: Fetch a paginated list of transactions
export const getTransactions = async (req, res, next) => {
    try {
        // Get pagination queries (page number, limit per page, and status filter)
        const { page = 1, limit = 10, status } = req.query;
        // Calculate how many items to skip
        const skip = (page - 1) * limit;

        // Build the query object
        let query = { user: req.userId };
        if (status) {
            query.status = status; // Add status filter if provided (e.g., "successful")
        }

        // Execute query
        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)              // Skip previous pages
            .limit(parseInt(limit))  // Limit number of results
            .populate("savingsPlan", "title"); // Expand the 'savingsPlan' ID to show its title

        // Get total count for pagination calculations
        const total = await Transaction.countDocuments(query);

        // Respond with data and pagination metadata
        res.json({
            success: true,
            count: transactions.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};


// --- CONTROLLER: Paystack Webhook ---
export const paystackWebhook = async (req, res, next) => {
    try {
        const event = req.body;

        // We only process successful charge events
        if (event.event !== "charge.success") {
            return res.status(200).json({
                success: true,
                message: "Event received"
            });
        }

        const paystackData = event.data;

        // Find our transaction using the Paystack reference
        const transaction = await Transaction.findOne({
            paystackReference: paystackData.reference
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        // Prevent processing the same payment twice
        if (transaction.status === "successful") {
            return res.status(200).json({
                success: true,
                message: "Transaction already processed"
            });
        }

        // Process the successful transaction
        await processSuccessfulTransaction(
            transaction._id,
            paystackData
        );

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully"
        });

    } catch (error) {
        next(error);
    }
};

export default {
    initializePayment,
    verifyPayment,
    getTransactions,
    paystackWebhook
};  



