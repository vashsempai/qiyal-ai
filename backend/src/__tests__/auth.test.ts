// 1. Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  freelancer: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  project: {
      findUnique: jest.fn(),
  },
  // Add other models as needed to avoid undefined errors
  conversation: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  message: { create: jest.fn() },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));


// 2. Import modules under test
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '../graphql/schema';
import { resolvers } from '../graphql/resolvers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 3. Describe test suite
describe('Auth Resolvers', () => {
  let testServer: ApolloServer;

  beforeAll(() => {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    testServer = new ApolloServer({
      schema,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation: register', () => {
    it('should register a new user and return a token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      };
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Mock database calls
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Mock hashing and token signing
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const response = await testServer.executeOperation<{
        register: { token: string; user: { email: string } };
      }>({
        query: `
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              token
              user {
                id
                email
                name
              }
            }
          }
        `,
        variables: { input: registerInput },
      });

      // Assertions
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.register.token).toBe('mocktoken');
        expect(response.body.singleResult.data?.register.user.email).toBe(registerInput.email);
      }
    });

    it('should fail if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test User', password: 'pw', createdAt: new Date(), updatedAt: new Date() });

      const response = await testServer.executeOperation({
        query: `
              mutation Register($input: RegisterInput!) {
                register(input: $input) { token }
              }
            `,
        variables: { input: { email: 'test@example.com', password: 'password123' } },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toBe('User already exists');
      }
    });
  });

  describe('Mutation: login', () => {
    it('should log in an existing user and return a token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      };
      const loginInput = { email: 'test@example.com', password: 'password123' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const response = await testServer.executeOperation<{
        login: { token: string; user: { id: string } };
      }>({
        query: `
              mutation Login($input: LoginInput!) {
                login(input: $input) {
                  token
                  user { id email }
                }
              }
            `,
        variables: { input: loginInput },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.login.token).toBe('mocktoken');
        expect(response.body.singleResult.data?.login.user.id).toBe(mockUser.id);
      }
    });

    it('should fail with invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // User not found

      const response = await testServer.executeOperation({
        query: `
              mutation Login($input: LoginInput!) {
                login(input: $input) { token }
              }
            `,
        variables: { input: { email: 'wrong@example.com', password: 'password123' } },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeDefined();
        expect(response.body.singleResult.errors?.[0].message).toBe('Invalid credentials');
      }
    });
  });
});