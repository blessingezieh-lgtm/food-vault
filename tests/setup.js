import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development.local" });

beforeAll(async () => {
    // Connect to a test database or use existing one carefully
    // For safety, let's use a distinct test URI if available, or mock
    if (!process.env.MONGODB_URI) {
        console.warn("MONGODB_URI not found, testing might fail if DB connection is needed");
    } else {
        await mongoose.connect(process.env.MONGODB_URI);
        // console.log("Connected to Test DB");
    }
});

afterAll(async () => {
    await mongoose.disconnect();
});
