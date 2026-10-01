import { config } from "dotenv"


config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` })

export const {
    PORT,
    MONGODB_URI,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN,
    PAYSTACK_SECRET
} = process.env;