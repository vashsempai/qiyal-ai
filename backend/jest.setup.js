// Set up environment variables for the test environment
process.env.STRIPE_SECRET_KEY = 'test_stripe_secret_key';
process.env.STRIPE_WEBHOOK_SECRET = 'test_stripe_webhook_secret';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.FRONTEND_URL = 'http://localhost:3000';

// You can also mock modules here if needed globally for all tests
// jest.mock('some-module');