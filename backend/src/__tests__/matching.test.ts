// 1. Mock external dependencies
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    Index: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue(true),
      query: jest.fn().mockResolvedValue({
        matches: [{ id: 'test-freelancer-id-2' }],
      }),
      deleteOne: jest.fn().mockResolvedValue(true),
    })),
  })),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      embedContent: jest.fn().mockResolvedValue({
        embedding: { values: [0.1, 0.2, 0.3] },
      }),
    })),
  })),
  TaskType: { RETRIEVAL_DOCUMENT: 'RETRIEVAL_DOCUMENT' },
}));

// 2. Mock Prisma Client
const mockPrisma = {
  user: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  UserRole: {
      FREELANCER: 'FREELANCER'
  }
}));

// 3. Import modules under test
import { PrismaClient, User, UserRole } from '@prisma/client';

// We will import the service dynamically in `beforeEach` to test lazy initialization.
let matchingService: {
    upsertUserProfileInVectorDB: (user: User) => Promise<void>;
    findMatchingFreelancers: (project: any, prisma: PrismaClient) => Promise<User[]>;
    deleteUserProfileFromVectorDB: (userId: string) => Promise<void>;
};

// 4. Describe test suite
describe('Matching Service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset modules to ensure lazy initialization is re-triggered for each test
        jest.resetModules();

        // Set fake API keys to ensure the service initializes its clients
        process.env = {
            ...originalEnv,
            PINECONE_API_KEY: 'fake-pinecone-key',
            GEMINI_API_KEY: 'fake-gemini-key',
        };

        // Now that env vars are set, import the service
        matchingService = require('../services/matchingService');
    });

    afterEach(() => {
        // Restore original environment variables and clear mocks
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    const testUser: User = {
        id: 'test-freelancer-id',
        email: 'freelancer-test@example.com',
        password: 'password',
        role: UserRole.FREELANCER,
        name: 'Test Freelancer',
        bio: 'Experienced developer specializing in React.',
        skills: ['React', 'TypeScript', 'Node.js'],
        experience: 5,
        hourlyRate: 75,
        location: 'Remote',
        portfolio: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        xp: 0,
        level: 'Junior',
        tokens: 0,
        subscriptionId: null,
    };

    const testProject = {
        title: 'Build a new web application',
        description: 'A web app that requires React and TypeScript skills.',
        skills: ['React', 'TypeScript'],
    };

    it('should upsert a user profile to the vector database', async () => {
        await matchingService.upsertUserProfileInVectorDB(testUser);
        // Test that it runs without error. A more robust test would check mock calls.
    });

    it('should find matching freelancers for a project', async () => {
        // This is the user that the Pinecone mock says is a match
        const matchedFreelancer: User = { ...testUser, id: 'test-freelancer-id-2' };
        mockPrisma.user.findMany.mockResolvedValue([matchedFreelancer]);

        const freelancers = await matchingService.findMatchingFreelancers(testProject, mockPrisma as unknown as PrismaClient);

        expect(freelancers).toBeInstanceOf(Array);
        expect(freelancers.length).toBe(1);
        // Ensure the correct freelancer was returned
        expect(freelancers[0].id).toBe('test-freelancer-id-2');
        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
            where: {
                id: { in: ['test-freelancer-id-2'] }, // This ID comes from the Pinecone mock
                role: 'FREELANCER',
            },
        });
    });

    it('should delete a user profile from the vector database', async () => {
        await matchingService.deleteUserProfileFromVectorDB(testUser.id);
        // Test that it runs without error.
    });
});