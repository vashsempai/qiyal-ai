// 1. Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  project: {
    count: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// 2. Import modules under test
import { PrismaClient, SubscriptionTier, User } from '@prisma/client';
import { Gatekeeper } from '../services/gatekeeperService';
import { GraphQLError } from 'graphql';

// 3. Define mock data
const mockFreeTier: SubscriptionTier = {
    id: 'free-tier-default',
    name: 'FREE',
    maxProjects: 3,
    maxResponses: 10,
    maxPortfolioItems: 5,
    chatMessagesPerDay: 20,
};

const mockProTier: SubscriptionTier = {
    id: 'pro-tier',
    name: 'PRO',
    maxProjects: 10,
    maxResponses: 100,
    maxPortfolioItems: 50,
    chatMessagesPerDay: 1000,
};

const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'password',
    role: 'CLIENT',
    name: 'Test User',
    subscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    xp: 0,
    level: 'Junior',
    tokens: 0,
    skills: [],
    experience: null,
    bio: null,
    hourlyRate: null,
    location: null,
    portfolio: [],
};

// 4. Describe test suite
describe('Gatekeeper Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canCreateProject', () => {
    it('should allow creating a project if user is under the free tier limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, subscription: null });
      mockPrisma.project.count.mockResolvedValue(mockFreeTier.maxProjects - 1);

      await expect(
        Gatekeeper.canCreateProject(mockPrisma as unknown as PrismaClient, mockUser.id)
      ).resolves.toBeUndefined();
    });

    it('should throw an error if user is at the free tier limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, subscription: null });
      mockPrisma.project.count.mockResolvedValue(mockFreeTier.maxProjects);

      await expect(
        Gatekeeper.canCreateProject(mockPrisma as unknown as PrismaClient, mockUser.id)
      ).rejects.toThrow(
        new GraphQLError(
          `You have reached the maximum of ${mockFreeTier.maxProjects} active projects for the ${mockFreeTier.name} tier.`,
          { extensions: { code: 'UPGRADE_REQUIRED' } }
        )
      );
    });

    it('should allow creating a project if user is under their subscribed tier limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, subscription: mockProTier });
      mockPrisma.project.count.mockResolvedValue(mockProTier.maxProjects - 1);

      await expect(
        Gatekeeper.canCreateProject(mockPrisma as unknown as PrismaClient, mockUser.id)
      ).resolves.toBeUndefined();
    });

    it('should throw an error if user is at their subscribed tier limit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, subscription: mockProTier });
      mockPrisma.project.count.mockResolvedValue(mockProTier.maxProjects);

      await expect(
        Gatekeeper.canCreateProject(mockPrisma as unknown as PrismaClient, mockUser.id)
      ).rejects.toThrow(
        new GraphQLError(
          `You have reached the maximum of ${mockProTier.maxProjects} active projects for the ${mockProTier.name} tier.`,
          { extensions: { code: 'UPGRADE_REQUIRED' } }
        )
      );
    });
  });

  describe('canSendResponse', () => {
    it('should resolve without error (placeholder logic)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, subscription: null });
      // Since the logic is a placeholder, we just check it doesn't throw for now.
      await expect(
        Gatekeeper.canSendResponse(mockPrisma as unknown as PrismaClient, mockUser.id)
      ).resolves.toBeUndefined();
    });
  });

  describe('canUseChat', () => {
    it('should resolve without error (placeholder logic)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, subscription: null });
      // Since the logic is a placeholder, we just check it doesn't throw for now.
      await expect(
        Gatekeeper.canUseChat(mockPrisma as unknown as PrismaClient, mockUser.id)
      ).resolves.toBeUndefined();
    });
  });

  describe('getUserWithSubscription (helper function)', () => {
    it('should throw an error if the user is not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            Gatekeeper.canCreateProject(mockPrisma as unknown as PrismaClient, 'non-existent-user')
        ).rejects.toThrow(
            new GraphQLError('User not found.', { extensions: { code: 'NOT_FOUND' } })
        );
    });
  });
});