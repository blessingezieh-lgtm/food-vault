// Import Node.js crypto library for signature verification
import crypto from "crypto";
// Import our logger to record events
import logger from "../utils/logger.js";
// Import the Paystack secret key from our environment variables
import { PAYSTACK_SECRET } from "../config/env.js"; // Ensure this is exported from config/env.js or process.env

// Import the transaction service we created to handle success logic
import { processSuccessfulTransaction } from "../services/transaction.service.js"; // Import our new service

// Define the Webhook controller function
const webhook = async (req, res) => {
   try {
      // Get the secret key. If it's missing, we can't verify security.
      const secret = process.env.PAYSTACK_SECRET || PAYSTACK_SECRET;

      if (!secret) {
         // Log a critical error if the secret is missing
         logger.error("PAYSTACK_SECRET is not defined in environment");
         return res.status(500).send("Webhook configuration error");
      }

      // --- SECURITY VERIFICATION ---
      // Creates a hash of the request body using our Secret Key
      const hash = crypto
         .createHmac("sha512", secret)
         .update(JSON.stringify(req.body))
         .digest("hex");

      // Compare our hash with the signature Paystack sent in the headers
      if (hash !== req.headers["x-paystack-signature"]) {
         // If they don't match, it's a fake request! Rejection!
         logger.warn("Invalid Paystack Webhook Signature attempt");
         return res.status(400).send("Invalid Signature");
      }

      // Extract the event type and data from the body
      const { event, data } = req.body;
      logger.info(`Webhook event received: ${event}`);

      // Retrieve the HTTP method
      // Paystack webhooks are always POST, but we can check if needed

      // Handle specific event types
      switch (event) {
         case "charge.success":
            // This event means a payment was successful
            logger.info(`Charge successful for reference: ${data.reference}`);

            // We need to find the transaction in OUR database that matches this Paystack reference
            // 'transaction' variable will retrieve the document from MongoDB
            const transaction = await import("../models/Transaction.model.js").then(m => m.default.findOne({ paystackReference: data.reference }));

            if (transaction) {
               // If found, call our shared service to update the user's balances
               // This prevents duplicating logic between here and the manual verify endpoint
               await processSuccessfulTransaction(transaction._id, data);
            } else {
               // If we can't find a transaction for this reference, something is weird.
               logger.warn(`Transaction not found for reference: ${data.reference}`);
            }
            break;

         case "transfer.success":
            // Log transfer successes (e.g. withdrawals)
            logger.info(`Transfer successful: ${data.reference}`);
            break;

         default:
            // Log any other events we aren't handling specifically
            logger.info(`Unhandled webhook event: ${event}`);
      }

      // Always return 200 OK to Paystack so they know we received it.
      // If we return error, they will keep retrying.
      res.status(200).send("Webhook received");
   } catch (error) {
      // Catch any unexpected errors
      logger.error(`Webhook Error: ${error.message}`);
      res.status(500).send("Server Error");
   }
};

export default webhook;