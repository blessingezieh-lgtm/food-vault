import { jest } from '@jest/globals';
import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import SavingsPlan from "../models/SavingsPlan.js";
import Transaction from "../models/Transaction.model.js";
import paystackService from "../utils/paystackService.js";
import "./setup.js";

// Mock Paystack Service using spyOn
// jest.mock("../utils/paystackService.js"); -- Removing auto-mock

describe("Payment Endpoints", () => {
    let userToken;
    let userId;
    let savingsPlanId;

    beforeAll(async () => {
        // Mock methods before usage
        jest.spyOn(paystackService, 'initializeTransaction');
        jest.spyOn(paystackService, 'verifyTransaction');
        // Cleanup
        await User.deleteMany({ email: "payment@test.com" });
        await SavingsPlan.deleteMany({});
        await Transaction.deleteMany({});

        // Create User
        const user = await User.create({
            firstName: "Payment",
            lastName: "Tester",
            email: "payment@test.com",
            password: "password123",
            phone: "08000000000"
        });
        userId = user._id;

        // Login
        const loginRes = await request(app).post("/api/v1/auth/login").send({
            email: "payment@test.com",
            password: "password123"
        });
        userToken = loginRes.body.data.tokens.accessToken;

        // Create Savings Plan
        const plan = await SavingsPlan.create({
            user: userId,
            title: "Test Savings",
            targetAmount: 100000,
            durationMonths: 12,
            monthlyAmount: 5000,
            frequency: "monthly",
            startDate: new Date(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
            status: "active"
        });
        savingsPlanId = plan._id;
    });

    afterAll(async () => {
        await User.deleteMany({ email: "payment@test.com" });
        await SavingsPlan.deleteMany({});
        await Transaction.deleteMany({});
        await mongoose.connection.close();
    });

    it("should initialize payment successfully", async () => {
        // Mock successful Paystack initialization
        paystackService.initializeTransaction.mockResolvedValue({
            success: true,
            data: {
                authorization_url: "https://paystack.com/checkout/test",
                access_code: "test_access_code",
                reference: "test_ref_123"
            }
        });

        const res = await request(app)
            .post("/api/v1/payments/initialize")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                savingsPlanId: savingsPlanId,
                amount: 5000
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.reference).toBe("test_ref_123");
    });

    it("should verify payment successfully", async () => {
        // First create a pending transaction
        const transaction = await Transaction.create({
            user: userId,
            savingsPlan: savingsPlanId,
            amount: 5000,
            status: "pending",
            paystackReference: "test_ref_verify",
            paymentMethod: "paystack"
        });

        // Mock Paystack verification success
        paystackService.verifyTransaction.mockResolvedValue({
            success: true,
            data: {
                status: "success",
                reference: "test_ref_verify",
                amount: 500000, // Kobo
                gateway_response: "Successful"
            }
        });

        const res = await request(app)
            .get(`/api/v1/payments/verify?reference=test_ref_verify`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("successful");

        // Verify Savings Plan balance updated
        const updatedPlan = await SavingsPlan.findById(savingsPlanId);
        expect(updatedPlan.currentBalance).toBe(5000);
    });
});
