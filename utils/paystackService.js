import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = "https://api.paystack.co";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});

const initializeTransaction = async (email, amount, metadata = {}) => {
    try {
        const response = await api.post("/transaction/initialize", {
            email,
            amount: amount * 100, // Convert to kobo/lowest currency unit
            metadata,
        });

        if (response.data.status) {
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message,
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
        };
    }
};

const verifyTransaction = async (reference) => {
    try {
        const response = await api.get(`/transaction/verify/${reference}`);

        if (response.data.status) {
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message,
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
        };
    }
};

export default {
    initializeTransaction,
    verifyTransaction,
};
