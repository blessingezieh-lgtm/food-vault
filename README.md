# FoodVault

FoodVault is a savings and investment application designed to help users manage their funds, save towards goals, and make payments securely.

## Features

*   **User Authentication**: Secure registration, login, and token management (JWT).
*   **Wallet System**: Digital wallet for managing user funds.
*   **Savings Plans**: Create and manage savings plans to reach financial goals.
*   **Payments**: Integration with Paystack for deposits and payments.
*   **Crypto Integration**: Verify crypto deposits (Polygon/MATIC).
*   **Admin Dashboard**: Manage users and savings plans.
*   **Food Management**: (Admin) Manage food items and prices.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or higher)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)
*   npm (Node Package Manager)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd FOODVAULT
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

1.  Create a `.env.development.local` file in the root directory (or `.env` for production).
2.  Add the following environment variables:

    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/foodvault
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRES_IN=1d
    
    # Paystack Configuration
    PAYSTACK_SECRET_KEY=your_paystack_secret_key
    PAYSTACK_SECRET_HASH=your_webhook_hash
    
    # Crypto Configuration
    ADMIN_WALLET_ADDRESS=0xYourAdminWalletAddress
    
    # Frontend URL (for CORS)
    FRONTEND_URL=http://localhost:5173
    ```

## API Documentation

The API is documented using Swagger.

1.  Start the server (see below).
2.  Open your browser and navigate to:
    ```
    http://localhost:3000/api-docs
    ```

## Running the Application

### Development Mode
Runs the server with `nodemon` for hot-reloading.

```bash
npm run dev
```

### Production Mode
Runs the server using `node`.

```bash
npm start
```

### Testing
Run the test suite.

```bash
npm test
```

## Project Structure

```
FOODVAULT/
├── config/             # Configuration files (DB, env, swagger)
├── controllers/        # Request handlers
├── database/           # Database connection logic
├── middleware/         # Express middleware (auth, error handling)
├── models/             # Mongoose schemas
├── routes/             # API route definitions
├── utils/              # Utility functions (logger, tokens, paystack)
├── logs/               # Application logs
├── app.js              # Express app setup
└── package.json        # Project metadata and dependencies
```

## License

This project is licensed under the ISC License.