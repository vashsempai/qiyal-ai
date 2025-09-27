// 1. Mock external dependencies
jest.mock('../services/matchingService');

const mockPrisma = {
  freelancer: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  user: {
      findUnique: jest.fn(),
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// 2. Import modules under test
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '../graphql/schema';
import { resolvers } from '../graphql/resolvers';
import { PrismaClient } from '@prisma/client';
import {
  upsertFreelancerProfile,
  findMatchingFreelancers,
  deleteFreelancerProfile,
} from '../services/matchingService';
import { Context } from '../types';

// 3. Describe test suite
describe('Matching Resolvers', () => {
  let testServer: ApolloServer<Context>;
  const mockUserId = 'user-123';
  const mockContext = {
    prisma: mockPrisma as unknown as PrismaClient,
    user: { userId: mockUserId, email: 'user@test.com', iat: 0, exp: 0 },
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

  describe('Query: recommendFreelancers', () => {
    it('should return a list of recommended freelancers', async () => {
      const mockProject = {
        id: 'project-1',
        title: 'Build a new website',
        description: 'A great website',
        skills: ['React', 'Node.js'],
      };
      const mockFreelancers = [{ id: 'freelancer-1', name: 'Jane Doe' }];

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      (findMatchingFreelancers as jest.Mock).mockResolvedValue(mockFreelancers);

      const response = await testServer.executeOperation<{
        recommendFreelancers: { id: string; name: string }[];
      }>(
        {
          query: `
            query RecommendFreelancers($projectId: ID!) {
              recommendFreelancers(projectId: $projectId) {
                id
                name
              }
            }
          `,
          variables: { projectId: 'project-1' },
        },
        {
          contextValue: mockContext,
        }
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.recommendFreelancers).toEqual(
          mockFreelancers
        );
        expect(findMatchingFreelancers).toHaveBeenCalledWith(
          mockProject,
          mockContext.prisma
        );
      }
    });
  });

  describe('Mutation: createFreelancer', () => {
    it('should create a freelancer and upsert their profile to Pinecone', async () => {
      const freelancerInput = { name: 'John Doe', email: 'john@doe.com', skills: ['Go'], experience: 5, bio: 'A dev', hourlyRate: 100 };
      const createdFreelancer = { ...freelancerInput, id: 'freelancer-2', userId: mockUserId };

      mockPrisma.freelancer.findUnique.mockResolvedValue(null);
      mockPrisma.freelancer.create.mockResolvedValue(createdFreelancer);

      await testServer.executeOperation(
        {
          query: `
            mutation CreateFreelancer($input: CreateFreelancerInput!) {
              createFreelancer(input: $input) { id }
            }
          `,
          variables: { input: freelancerInput },
        },
        { contextValue: mockContext }
      );

      expect(mockPrisma.freelancer.create).toHaveBeenCalled();
      expect(upsertFreelancerProfile).toHaveBeenCalledWith(createdFreelancer);
    });
  });

  describe('Mutation: updateFreelancer', () => {
      it('should update a freelancer and upsert their profile', async () => {
          const freelancerId = 'freelancer-1';
          const updateInput = { name: 'Jane Doe Updated' };
          const existingFreelancer = { id: freelancerId, userId: mockUserId, name: 'Jane Doe' };
          const updatedFreelancer = { ...existingFreelancer, ...updateInput };

          mockPrisma.freelancer.findUnique.mockResolvedValue(existingFreelancer);
          mockPrisma.freelancer.update.mockResolvedValue(updatedFreelancer);

          await testServer.executeOperation({
              query: `
                mutation UpdateFreelancer($id: ID!, $input: UpdateFreelancerInput!) {
                    updateFreelancer(id: $id, input: $input) { id name }
                }
              `,
              variables: { id: freelancerId, input: updateInput }
          }, { contextValue: mockContext });

          expect(upsertFreelancerProfile).toHaveBeenCalledWith(updatedFreelancer);
      });
  });

  describe('Mutation: deleteFreelancer', () => {
      it('should delete a freelancer and their profile', async () => {
          const freelancerId = 'freelancer-1';
          mockPrisma.freelancer.delete.mockResolvedValue({ id: freelancerId });

          await testServer.executeOperation({
              query: `
                mutation DeleteFreelancer($id: ID!) {
                    deleteFreelancer(id: $id)
                }
              `,
              variables: { id: freelancerId }
          }, { contextValue: mockContext });

          expect(deleteFreelancerProfile).toHaveBeenCalledWith(freelancerId);
      });
  });
});