// Import the winston logging library, which is a popular logger for Node.js
import winston from "winston";

// Create a logger instance with specific configuration
const logger = winston.createLogger({
    // Set the default logging level to 'info'. 
    // This means it will log 'info', 'warn', and 'error' messages, but ignore 'debug' messages.
    level: "info",

    // Define the format of the log messages
    format: winston.format.combine(
        // Add a timestamp to every log message so we know when it happened
        winston.format.timestamp(),
        // Format the entire log message as a JSON object (useful for parsing later)
        winston.format.json()
    ),

    // Define where the logs should be saved (transports)
    transports: [
        // 1. Save only 'error' level messages to 'logs/error.log'
        // This helps us isolate crashes and serious issues easily.
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),

        // 2. Save ALL logs (info, warn, error) to 'logs/combined.log'
        // This gives us a complete history of what happened in the application.
        new winston.transports.File({ filename: "logs/combined.log" }),
    ],
});

// If we are NOT in production mode (e.g., we are in development or testing)
if (process.env.NODE_ENV !== "production") {
    // Add a console transport so we can see logs directly in the terminal
    logger.add(
        new winston.transports.Console({
            // Use a simple text format for the console (easier to read than JSON)
            format: winston.format.simple(),
        })
    );
}

// Export the logger so it can be used in other files
export default logger;
