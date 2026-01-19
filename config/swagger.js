import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FoodVault API',
            version: '1.0.0',
            description: 'API documentation for FoodVault application',
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

import { PORT } from './env.js';

export const swaggerDocs = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
};
