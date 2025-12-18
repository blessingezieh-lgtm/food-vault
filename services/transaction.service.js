// Import necessary models to update database records
import Transaction from "../models/Transaction.model.js";
import SavingsPlan from "../models/SavingsPlan.js";
import Wallet from "../models/wallet.js";
// Import our custom logger to record events
import logger from "../utils/logger.js";

/**
 * Service function to handle logic when a payment is successful.
 * This is used by both the Webhook (automatic) and Manual Verify endpoint.
 * 
 * @param {string} transactionId - The ID of the transaction to process
 * @param {object} metadata - Extra data from Paystack (like reference, fees, etc.)
 */
export const processSuccessfulTransaction = async (transactionId, metadata) => {
    try {
        // 1. Find the transaction in our database using the ID
        const transaction = await Transaction.findById(transactionId);

        // If the transaction doesn't exist, we stop here and throw an error
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // 2. Check if the transaction was ALREADY marked as successful.
        // This assumes we might receive the same webhook trigger multiple times (which is common).
        // We don't want to credit the user twice!
        if (transaction.status === "successful") {
            logger.info(`Transaction ${transactionId} already processed.`);
            // Return the transaction as is, doing nothing else.
            return transaction;
        }

        // 3. Update the transaction record itself
        transaction.status = "successful"; // Mark as success
        transaction.completedAt = new Date(); // Record the time
        transaction.metadata = metadata; // Store the full Paystack response for records
        await transaction.save(); // Save changes to MongoDB

        // 4. Update the associated Savings Plan (if this payment was for a savings plan)
        if (transaction.savingsPlan) {
            // Find the savings plan
            const savingsPlan = await SavingsPlan.findById(transaction.savingsPlan);

            if (savingsPlan) {
                // Add the transaction amount to the plan's current balance
                savingsPlan.currentBalance += transaction.amount;

                // Check if the user has reached their target goal
                if (savingsPlan.currentBalance >= savingsPlan.targetAmount) {
                    savingsPlan.status = "completed"; // Mark plan as complete
                    savingsPlan.completedAt = new Date(); // Set completion date
                }

                // Save the updated savings plan
                await savingsPlan.save();
                logger.info(`Updated SavingsPlan ${savingsPlan._id}`);
            }
        }

        // 5. Update the User's Wallet (General balance tracking)
        if (transaction.user) {
            // Find the wallet belonging to this user
            const wallet = await Wallet.findOne({ user: transaction.user });

            if (wallet) {
                // Add funds to the wallet balance
                wallet.balance += transaction.amount;
                // Also track total amount ever saved
                wallet.totalSaved += transaction.amount;
                // Update the 'lastUpdated' timestamp
                wallet.lastUpdated = new Date();

                // Save the wallet changes
                await wallet.save();
                logger.info(`Updated Wallet for user ${transaction.user}`);
            }
        }

        // Return the updated transaction object
        return transaction;

    } catch (error) {
        // If anything goes wrong, log the error and re-throw it so the controller handles it
        logger.error(`Error processing transaction ${transactionId}: ${error.message}`);
        throw error;
    }
};
