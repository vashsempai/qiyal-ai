// 1. Mock external dependencies
jest.mock('../services/openaiService');
jest.mock('../services/gamificationService');
jest.mock('../services/gatekeeperService');
jest.mock('../services/emailService');
jest.mock('../services/stripeService');


const mockPrisma = {
  user: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  freelancer: {
    findUnique: jest.fn(),
  },
  review: {
      create: jest.fn(),
  },
  subscriptionTier: {
      findUnique: jest.fn(),
  },
  conversation: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  message: {
    create: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// 2. Import modules under test
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '../graphql/schema';
import { resolvers } from '../graphql/resolvers';
import { Context } from '../types';
import { PrismaClient } from '@prisma/client';
import { Gatekeeper } from '../services/gatekeeperService';
import { addXp, XpEvent } from '../services/gamificationService';
import { sendNewReviewNotification } from '../services/emailService';
import { createSubscriptionCheckoutSession } from '../services/stripeService';


// 3. Describe test suite
describe('Advanced Feature Resolvers', () => {
  let testServer: ApolloServer<Context>;
  const mockUserId = 'user-123';
  const mockContext: Context = {
    prisma: mockPrisma as unknown as PrismaClient,
    user: { userId: mockUserId, email: 'user@test.com', iat: 0, exp: 0 },
  };

  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'test_secret_key';
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    testServer = new ApolloServer<Context>({
      schema,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Gatekeeper Integration', () => {
    it('should check subscription limits before creating a project', async () => {
      const createProjectInput = { title: 'New Project', description: 'A test project', budget: 100, deadline: new Date().toISOString(), skills: ['test'] };
      (Gatekeeper.canCreateProject as jest.Mock).mockResolvedValue(undefined);
      mockPrisma.project.create.mockResolvedValue({ id: 'proj-new', ...createProjectInput });

      await testServer.executeOperation(
        {
          query: `mutation CreateProject($input: CreateProjectInput!) { createProject(input: $input) { id } }`,
          variables: { input: createProjectInput },
        },
        { contextValue: mockContext }
      );

      expect(Gatekeeper.canCreateProject).toHaveBeenCalledWith(mockContext.prisma, mockUserId);
    });
  });

  describe('Gamification and Notification Integration', () => {
    it('should award XP and send an email upon submitting a review', async () => {
        const reviewInput = { freelancerId: 'freelancer-1', projectId: 'proj-1', rating: 5, comment: 'Great work!' };
        const mockProject = { id: 'proj-1', ownerId: mockUserId, status: 'COMPLETED', owner: { name: 'Test Client' }, title: 'Test Project' };
        const mockFreelancer = { id: 'freelancer-1', email: 'freelancer@test.com' };

        mockPrisma.project.findFirst.mockResolvedValue(mockProject);
        mockPrisma.freelancer.findUnique.mockResolvedValue(mockFreelancer);
        mockPrisma.review.create.mockResolvedValue({ ...reviewInput, id: 'rev-1' });

        await testServer.executeOperation(
            {
                query: `mutation SubmitReview($freelancerId: ID!, $projectId: ID!, $rating: Int!, $comment: String!) {
                    submitReview(freelancerId: $freelancerId, projectId: $projectId, rating: $rating, comment: $comment) { id }
                }`,
                variables: reviewInput
            },
            { contextValue: mockContext }
        );

        expect(addXp).toHaveBeenCalledWith(mockContext.prisma, mockUserId, XpEvent.SUBMIT_REVIEW);
        expect(sendNewReviewNotification).toHaveBeenCalledWith(
            mockFreelancer.email,
            mockProject.owner.name,
            mockProject.title,
            reviewInput.rating
        );
    });
  });

  describe('Stripe Integration', () => {
    it('should call stripeService to create a checkout session', async () => {
        const mockSession = { url: 'https://stripe.checkout.url' };
        (createSubscriptionCheckoutSession as jest.Mock).mockResolvedValue(mockSession);

        await testServer.executeOperation(
            {
                query: `mutation CreateSubscriptionCheckoutSession($tier: String!) {
                    createSubscriptionCheckoutSession(tier: $tier)
                }`,
                variables: { tier: 'PRO' }
            },
            { contextValue: mockContext }
        );

        expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(mockUserId, 'PRO');
    });
  });

});