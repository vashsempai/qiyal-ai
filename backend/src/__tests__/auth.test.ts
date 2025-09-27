// 1. Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// 2. Mock Prisma Client and its models
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));


// 3. Import modules under test
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '../graphql/schema';
import { resolvers } from '../graphql/resolvers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Context } from '../types';
import { PrismaClient } from '@prisma/client';

// 4. Describe test suite
describe('Auth Resolvers', () => {
  let testServer: ApolloServer<Context>;
  const mockContext: Context = {
    prisma: mockPrisma as unknown as PrismaClient,
    user: null, // No user authenticated for these tests
  };

  beforeAll(() => {
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    testServer = new ApolloServer<Context>({
      schema,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation: register', () => {
    it('should register a new user and return a token', async () => {
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const mockUser = {
        id: '1',
        ...registerInput,
        password: 'hashedpassword',
      };

      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const response = await testServer.executeOperation(
        {
          query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) {
                token
                user { id email name }
              }
            }
          `,
          variables: { input: registerInput },
        },
        { contextValue: mockContext }
      );

      const result = response.body as { singleResult: { data?: { register: { token: string, user: any } } } };
      expect(result.singleResult.data?.register.token).toBe('mocktoken');
      expect(result.singleResult.data?.register.user.email).toBe(registerInput.email);
    });

    it('should fail if user already exists', async () => {
      const registerInput = { email: 'test@example.com', password: 'password123' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', ...registerInput, password: 'pw' });

      const response = await testServer.executeOperation(
        {
          query: `
            mutation Register($input: RegisterInput!) {
              register(input: $input) { token }
            }
          `,
          variables: { input: registerInput },
        },
        { contextValue: mockContext }
      );

      const result = response.body as { singleResult: { errors?: any[] } };
      expect(result.singleResult.errors).toBeDefined();
      expect(result.singleResult.errors?.[0].message).toBe('User already exists');
    });
  });

  describe('Mutation: login', () => {
    it('should log in an existing user and return a token', async () => {
      const loginInput = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: '1',
        email: loginInput.email,
        password: 'hashedpassword',
        name: 'Test User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');

      const response = await testServer.executeOperation(
        {
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                token
                user { id email }
              }
            }
          `,
          variables: { input: loginInput },
        },
        { contextValue: mockContext }
      );

      const result = response.body as { singleResult: { data?: { login: { token: string } } } };
      expect(result.singleResult.data?.login.token).toBe('mocktoken');
    });

    it('should fail with invalid credentials if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await testServer.executeOperation({
        query: `
          mutation Login($input: LoginInput!) {
            login(input: $input) { token }
          }
        `,
        variables: { input: { email: 'wrong@example.com', password: 'password123' } },
      });

      const result = response.body as { singleResult: { errors?: any[] } };
      expect(result.singleResult.errors).toBeDefined();
      expect(result.singleResult.errors?.[0].message).toBe('Invalid credentials');
    });
  });
});