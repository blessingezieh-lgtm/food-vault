# FoodVault API

FoodVault is a savings and food investment platform. This API allows users to save money, buy food items, and track their transactions.

## Prerequisites

- Node.js (v18+)
- MongoDB

## Environment Variables

Create a `.env.development.local` file in the root directory with the following variables:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/foodvault
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
PAYSTACK_SECRET=your_paystack_secret_key
PAYSTACK_SECRET_HASH=your_paystack_webhook_hash
FRONTEND_URL=http://localhost:5173
```

## Setup & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run in Development Mode:**
   ```bash
   npm run dev
   ```

3. **Run Tests:**
   ```bash
   npm test
   ```

## API Endpoints

### Auth
- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/signin` - Login

### Marketplace (Foods)
- `GET /api/v1/foods` - Get all available food items
- `GET /api/v1/foods?search=rice&minPrice=1000` - Search and filter foods
- `POST /api/v1/foods` - (Admin) Add new food item

### Savings
- `GET /api/v1/savings` - Get user's savings plans
- `POST /api/v1/savings` - Create a new savings plan

### Payments
- `POST /api/v1/payments/initialize` - Initialize a payment (deposit)
- `GET /api/v1/payments/verify?reference=...` - Verify a payment manually
- `POST /api/v1/payments/webhook/paystack` - Paystack Webhook handler

### Admin
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/stats` - Get dashboard stats