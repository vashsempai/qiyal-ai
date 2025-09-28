import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { Context, DecodedToken } from './types';
import jwt from 'jsonwebtoken';
import { handleStripeWebhook } from './services/stripeService';

// Load environment variables
dotenv.config();

const main = async () => {
  // Check for essential environment variables
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('FATAL ERROR: DATABASE_URL is not defined.');
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not defined. AI features will be disabled.');
  }

  const app = express();
  const httpServer = http.createServer(app);
  const prisma = new PrismaClient();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }: { req: any }): Promise<Context> => {
      const authHeader = req.headers.authorization || '';
      let user: DecodedToken | null = null;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
          user = decoded;
        } catch (err) {
          console.warn('JWT verification failed:', (err as Error).message);
        }
      }
      return {
        prisma,
        user: user ?? null,
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Qiyal AI GraphQL Backend is running' });
  });

  // Stripe webhook endpoint
  // Use express.raw for verifying the webhook signature
  app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
      await handleStripeWebhook(prisma, sig, req.body);
      res.status(200).send({ received: true });
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  const PORT = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📍 Health check available at http://localhost:${PORT}/api/health`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await server.stop();
    await prisma.$disconnect();
    httpServer.close(() => {
      console.log('Server has been gracefully shut down.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main().catch((error) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});