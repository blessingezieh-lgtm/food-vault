import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import Food from "../models/food.js";
import "./setup.js";

describe("Marketplace Endpoints", () => {

    beforeAll(async () => {
        // Seed some food data
        await Food.deleteMany({});
        await Food.create([
            { name: "Rice", price: 50000, unit: "bag", Quantity: 10 },
            { name: "Beans", price: 800, unit: "rubber", Quantity: 20 },
            { name: "Garri", price: 500, unit: "rubber", Quantity: 50 }
        ]);
    });

    afterAll(async () => {
        await Food.deleteMany({});
        await mongoose.connection.close();
    });

    it("should fetch all marketplace items", async () => {
        const res = await request(app).get("/api/v1/foods");

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it("should search for items by name", async () => {
        const res = await request(app).get("/api/v1/foods?search=rice");

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].name).toBe("Rice");
    });

    it("should filter items by price", async () => {
        const res = await request(app).get("/api/v1/foods?maxPrice=1000");

        // Should find Beans and Garri
        expect(res.statusCode).toEqual(200);
        const names = res.body.data.map(f => f.name);
        expect(names).toContain("Beans");
        expect(names).toContain("Garri");
        expect(names).not.toContain("Rice");
    });
});
