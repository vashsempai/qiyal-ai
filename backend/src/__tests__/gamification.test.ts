// 1. Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  project: {
    count: jest.fn(),
  },
  userAchievement: {
    upsert: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  XpEvent: {
    COMPLETE_PROJECT: 10,
    SUBMIT_REVIEW: 3,
    RECEIVE_GOOD_REVIEW: 5,
    COMPLETE_TUTORIAL: 5,
    DAILY_LOGIN: 2,
    PUBLISH_PORTFOLIO_ITEM: 1,
  }
}));

// 2. Import modules under test
import { PrismaClient, User } from '@prisma/client';
import { addXp, checkAndAwardAchievements, XpEvent } from '../services/gamificationService';

// 3. Define mock data
const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'password',
    role: 'FREELANCER',
    name: 'Test User',
    xp: 50,
    level: 'Junior',
    tokens: 0,
    subscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    skills: [],
    experience: null,
    bio: null,
    hourlyRate: null,
    location: null,
    portfolio: [],
};

// 4. Describe test suite
describe('Gamification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addXp', () => {
    it('should add XP to a user and not change their level', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockImplementation((args) => Promise.resolve({ ...mockUser, ...args.data }));
      mockPrisma.project.count.mockResolvedValue(0); // No achievements for this test

      const updatedUser = await addXp(mockPrisma as unknown as PrismaClient, mockUser.id, XpEvent.COMPLETE_PROJECT);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          xp: mockUser.xp + XpEvent.COMPLETE_PROJECT,
          level: 'Junior',
        },
      });
      expect(updatedUser.xp).toBe(60);
      expect(updatedUser.level).toBe('Junior');
    });

    it('should level up a user when XP threshold is reached', async () => {
      const userNearLevelUp: User = { ...mockUser, xp: 95 };
      mockPrisma.user.findUnique.mockResolvedValue(userNearLevelUp);
      mockPrisma.user.update.mockImplementation((args) => Promise.resolve({ ...userNearLevelUp, ...args.data }));
      mockPrisma.project.count.mockResolvedValue(0);

      const updatedUser = await addXp(mockPrisma as unknown as PrismaClient, mockUser.id, XpEvent.COMPLETE_PROJECT);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          xp: 105,
          level: 'Middle',
        },
      });
      expect(updatedUser.level).toBe('Middle');
    });

    it('should throw an error if the user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(addXp(mockPrisma as unknown as PrismaClient, 'non-existent-user', XpEvent.DAILY_LOGIN)).rejects.toThrow('User not found');
    });

    it('should call checkAndAwardAchievements after adding XP', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.user.update.mockResolvedValue({ ...mockUser, xp: mockUser.xp + XpEvent.COMPLETE_PROJECT });
        mockPrisma.project.count.mockResolvedValue(5); // User has 5 projects

        await addXp(mockPrisma as unknown as PrismaClient, mockUser.id, XpEvent.COMPLETE_PROJECT);

        expect(mockPrisma.project.count).toHaveBeenCalledWith({
            where: { ownerId: mockUser.id, status: 'COMPLETED' },
        });
        expect(mockPrisma.userAchievement.upsert).not.toHaveBeenCalled();
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award an achievement if conditions are met', async () => {
      mockPrisma.project.count.mockResolvedValue(10); // User has 10 completed projects

      await checkAndAwardAchievements(mockPrisma as unknown as PrismaClient, mockUser.id);

      expect(mockPrisma.userAchievement.upsert).toHaveBeenCalledWith({
        where: { userId_achievementId: { userId: mockUser.id, achievementId: 'activist-achievement-id' } },
        update: {},
        create: {
          userId: mockUser.id,
          achievementId: 'activist-achievement-id',
        },
      });
    });

    it('should not award an achievement if conditions are not met', async () => {
        mockPrisma.project.count.mockResolvedValue(5); // User has 5 completed projects

        await checkAndAwardAchievements(mockPrisma as unknown as PrismaClient, mockUser.id);

        expect(mockPrisma.userAchievement.upsert).not.toHaveBeenCalled();
      });
  });
});