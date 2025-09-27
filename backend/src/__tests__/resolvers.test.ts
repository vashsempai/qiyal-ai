// 1. Mock external dependencies
jest.mock('../services/matchingService');

// 2. Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  project: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
import { Context } from '../types';
import { PrismaClient } from '@prisma/client';
import { findMatchingFreelancers } from '../services/matchingService';

// 4. Describe test suite
describe('GraphQL Resolvers', () => {
    let testServer: ApolloServer<Context>;
    const mockUserId = 'user-123';

    // Set up a mock context that will be passed to the resolvers.
    // This simulates a user being authenticated.
    const mockContext: Context = {
      prisma: mockPrisma as unknown as PrismaClient,
      user: { userId: mockUserId, email: 'test@test.com', iat: 0, exp: 0 },
    };

    // A context for unauthenticated requests
    const unauthenticatedContext: Context = {
        prisma: mockPrisma as unknown as PrismaClient,
        user: null,
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

    // Helper to execute a GraphQL query against the test server
    const runQuery = (query: string, variables?: Record<string, any>, context: Context = mockContext) => {
        return testServer.executeOperation(
            { query, variables },
            { contextValue: context }
        );
    };

    describe('Query Resolvers', () => {
        describe('me', () => {
            it('should return the currently authenticated user', async () => {
                const mockUser = { id: mockUserId, email: 'test@test.com' };
                mockPrisma.user.findUnique.mockResolvedValue(mockUser);

                const query = `query Me { me { id email } }`;
                const response = await runQuery(query);

                const result = response.body as { singleResult: { data?: { me: any } } };
                expect(result.singleResult.data?.me).toEqual(mockUser);
                expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
            });

            it('should return an authentication error if no user is in context', async () => {
                const query = `query Me { me { id } }`;
                const response = await runQuery(query, undefined, unauthenticatedContext);

                const result = response.body as { singleResult: { errors?: any[] } };
                expect(result.singleResult.errors?.[0].message).toBe('User is not authenticated');
            });
        });

        describe('lenta', () => {
            it('should return a list of open projects', async () => {
                const mockProjects = [{ id: 'proj-1', status: 'OPEN' }];
                mockPrisma.project.findMany.mockResolvedValue(mockProjects);

                const query = `query Lenta { lenta { id status } }`;
                const response = await runQuery(query);

                const result = response.body as { singleResult: { data?: { lenta: any[] } } };
                expect(result.singleResult.data?.lenta).toEqual(mockProjects);
                expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
                    where: { status: 'OPEN' },
                    orderBy: { createdAt: 'desc' },
                });
            });
        });

        describe('project', () => {
            it('should return a single project by ID', async () => {
                const mockProject = { id: 'proj-1' };
                mockPrisma.project.findUnique.mockResolvedValue(mockProject);

                const query = `query Project($id: ID!) { project(id: $id) { id } }`;
                const response = await runQuery(query, { id: 'proj-1' });

                const result = response.body as { singleResult: { data?: { project: any } } };
                expect(result.singleResult.data?.project).toEqual(mockProject);
                expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
            });
        });

        describe('recommendFreelancers', () => {
            it('should recommend freelancers for a project', async () => {
                const mockProject = { id: 'proj-1', title: 'A Project' };
                const mockFreelancers = [{ id: 'freelancer-1' }];
                mockPrisma.project.findUnique.mockResolvedValue(mockProject);
                (findMatchingFreelancers as jest.Mock).mockResolvedValue(mockFreelancers);

                const query = `query Recommend($projectId: ID!) { recommendFreelancers(projectId: $projectId) { id } }`;
                const response = await runQuery(query, { projectId: 'proj-1' });

                const result = response.body as { singleResult: { data?: { recommendFreelancers: any[] } } };
                expect(result.singleResult.data?.recommendFreelancers).toEqual(mockFreelancers);
                expect(findMatchingFreelancers).toHaveBeenCalledWith(mockProject, mockPrisma);
            });

            it('should throw an error if project is not found', async () => {
                mockPrisma.project.findUnique.mockResolvedValue(null);
                const query = `query Recommend($projectId: ID!) { recommendFreelancers(projectId: $projectId) { id } }`;
                const response = await runQuery(query, { projectId: 'non-existent' });

                const result = response.body as { singleResult: { errors?: any[] } };
                expect(result.singleResult.errors?.[0].message).toBe('Project not found');
            });
        });

        describe('myProjectStats', () => {
            it('should return project stats for the authenticated user', async () => {
                mockPrisma.project.count
                    .mockResolvedValueOnce(2) // active
                    .mockResolvedValueOnce(5); // completed

                const query = `query MyStats { myProjectStats { activeProjects completedProjects } }`;
                const response = await runQuery(query);

                const result = response.body as { singleResult: { data?: { myProjectStats: any } } };
                expect(result.singleResult.data?.myProjectStats).toEqual({ activeProjects: 2, completedProjects: 5 });
            });
        });

        describe('myFavorites', () => {
            it('should return the user\'s favorite projects and freelancers', async () => {
                const mockFavs = { favoriteProjects: [{id: 'p1'}], favoriteFreelancers: [{id: 'f1'}] };
                mockPrisma.user.findUnique.mockResolvedValue(mockFavs);

                const query = `query MyFavs { myFavorites { projects { id } freelancers { id } } }`;
                const response = await runQuery(query);

                const result = response.body as { singleResult: { data?: { myFavorites: any } } };
                expect(result.singleResult.data?.myFavorites.projects).toEqual([{id: 'p1'}]);
                expect(result.singleResult.data?.myFavorites.freelancers).toEqual([{id: 'f1'}]);
            });
        });
    });

    describe('Mutation Resolvers', () => {
        describe('updateUserRole', () => {
            it('should update the user role', async () => {
                const mockUser = { id: mockUserId, role: 'FREELANCER' };
                mockPrisma.user.update.mockResolvedValue(mockUser);

                const mutation = `mutation UpdateUserRole($role: UserRole!) { updateUserRole(role: $role) { id role } }`;
                const response = await runQuery(mutation, { role: 'FREELANCER' });

                const result = response.body as { singleResult: { data?: { updateUserRole: any } } };
                expect(result.singleResult.data?.updateUserRole).toEqual(mockUser);
                expect(mockPrisma.user.update).toHaveBeenCalledWith({
                    where: { id: mockUserId },
                    data: { role: 'FREELANCER' },
                });
            });
        });

        describe('updateProject', () => {
            it('should update a project if the user is the owner', async () => {
                const input = { title: "New Title" };
                mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', ownerId: mockUserId });
                mockPrisma.project.update.mockResolvedValue({ id: 'proj-1', ...input });

                const mutation = `mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) { updateProject(id: $id, input: $input) { id title } }`;
                const response = await runQuery(mutation, { id: 'proj-1', input });

                const result = response.body as { singleResult: { data?: { updateProject: any } } };
                expect(result.singleResult.data?.updateProject.title).toBe('New Title');
            });

            it('should throw an error if user is not the owner', async () => {
                mockPrisma.project.findFirst.mockResolvedValue(null); // User is not the owner
                const mutation = `mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) { updateProject(id: $id, input: $input) { id } }`;
                const response = await runQuery(mutation, { id: 'proj-1', input: { title: "..." } });

                const result = response.body as { singleResult: { errors?: any[] } };
                expect(result.singleResult.errors?.[0].message).toBe('Project not found or access denied');
            });
        });

        describe('deleteProject', () => {
            it('should delete a project if the user is the owner', async () => {
                mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', ownerId: mockUserId });
                mockPrisma.project.delete.mockResolvedValue({ id: 'proj-1' });

                const mutation = `mutation DeleteProject($id: ID!) { deleteProject(id: $id) }`;
                const response = await runQuery(mutation, { id: 'proj-1' });

                const result = response.body as { singleResult: { data?: { deleteProject: boolean } } };
                expect(result.singleResult.data?.deleteProject).toBe(true);
            });

            it('should throw an error if user is not the owner', async () => {
                mockPrisma.project.findFirst.mockResolvedValue(null);
                const mutation = `mutation DeleteProject($id: ID!) { deleteProject(id: $id) }`;
                const response = await runQuery(mutation, { id: 'proj-1' });

                const result = response.body as { singleResult: { errors?: any[] } };
                expect(result.singleResult.errors?.[0].message).toBe('Project not found or access denied');
            });
        });

        describe('addToFavorites', () => {
            it('should add a project to favorites', async () => {
                mockPrisma.user.update.mockResolvedValue({});
                mockPrisma.user.findUnique.mockResolvedValue({ id: mockUserId }); // To return at the end

                const mutation = `mutation AddToFav($itemId: ID!, $type: FavoriteType!) { addToFavorites(itemId: $itemId, type: $type) { id } }`;
                await runQuery(mutation, { itemId: 'proj-fav', type: 'PROJECT' });

                expect(mockPrisma.user.update).toHaveBeenCalledWith({
                    where: { id: mockUserId },
                    data: { favoriteProjects: { connect: { id: 'proj-fav' } } },
                });
            });
        });

        describe('removeFromFavorites', () => {
            it('should remove a freelancer from favorites', async () => {
                mockPrisma.user.update.mockResolvedValue({});
                mockPrisma.user.findUnique.mockResolvedValue({ id: mockUserId });

                const mutation = `mutation RemoveFromFav($itemId: ID!, $type: FavoriteType!) { removeFromFavorites(itemId: $itemId, type: $type) { id } }`;
                await runQuery(mutation, { itemId: 'freelancer-fav', type: 'FREELANCER' });

                expect(mockPrisma.user.update).toHaveBeenCalledWith({
                    where: { id: mockUserId },
                    data: { favoriteFreelancers: { disconnect: { id: 'freelancer-fav' } } },
                });
            });
        });
    });
});