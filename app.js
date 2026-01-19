import dotenv from "dotenv";
dotenv.config({ path: ".env.development.local" });
import express from "express";
import { PORT } from "./config/env.js";
import { connectDB } from "./database/mongodb.js";
import cors from "cors";
import { configureSecurityHeaders, limiter } from "./middleware/security.js"; // Import security middleware

import foodRoutes from "./routes/food.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import authRoutes from "./routes/auth.routes.js";
import savingsRoutes from "./routes/savings.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import cryptoRoutes from "./routes/crypto.routes.js";
import errorHandler from "./middleware/errorHandler.js";




dotenv.config();

const app = express();

// Apply Security Middleware
app.use(configureSecurityHeaders());
app.use(limiter);

app.use(express.json());


const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://foodvault-36sx.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);



app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/savings", savingsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/foods", foodRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/crypto", cryptoRoutes);

app.post("/api/v1/payments/webhook/paystack", express.raw({ type: "application/json" }), paymentRoutes)

app.use(errorHandler);


import { swaggerDocs } from "./config/swagger.js";

if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      swaggerDocs(app);
      console.log(`Server  is running  `);
    });
  }).catch((err) => {
    console.log("Failed to connect to DB:", err);
  });
}

export default app;
