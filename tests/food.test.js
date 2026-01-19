import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Food from "../models/food.js";
import "./setup.js";

describe("Food Admin Endpoints", () => {
    let adminToken;

    beforeAll(async () => {
        await User.deleteMany({ email: "admin@test.com" });
        await Food.deleteMany({ name: "Test Food" });

        // Create admin user
        const admin = await User.create({
            firstName: "Admin",
            lastName: "User",
            email: "admin@test.com",
            password: "password123",
            isAdmin: true,
            phone: "0000000000"
        });

        // Login to get token
        const res = await request(app).post("/api/v1/auth/login").send({
            email: "admin@test.com",
            password: "password123"
        });

        adminToken = res.body.data.tokens.accessToken; // Adjust nested path if needed
    });

    afterAll(async () => {
        await User.deleteMany({ email: "admin@test.com" });
        await Food.deleteMany({ name: "Test Food" });
        await mongoose.connection.close();
    });

    it("should allow admin to add food", async () => {
        const res = await request(app)
            .post("/api/v1/foods")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "Test Food",
                price: 1500,
                unit: "bag", // Valid unit
                Quantity: 100
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.food.name).toBe("Test Food");
    });

    it("should reject non-admin users", async () => {
        // Create normal user
        const user = await User.create({
            firstName: "Normal",
            lastName: "User",
            email: "normal@test.com",
            password: "password123",
            role: "user",
            phone: "1111111111"
        });

        const loginRes = await request(app).post("/api/v1/auth/login").send({
            email: "normal@test.com",
            password: "password123"
        });
        const userToken = loginRes.body.data.tokens.accessToken;

        const res = await request(app)
            .post("/api/v1/foods")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                name: "Test Food 2",
                price: 1500,
                unit: "unit",
                Quantity: 100
            });

        expect(res.statusCode).toEqual(403); // Assuming verifyAdmin returns 403

        // Cleanup
        await User.deleteOne({ _id: user._id });
    });
});
