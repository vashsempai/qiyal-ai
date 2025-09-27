import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import {
  upsertUserProfileInVectorDB,
  findMatchingFreelancers,
  deleteUserProfileFromVectorDB,
} from '../services/matchingService';
import { Gatekeeper } from '../services/gatekeeperService';
import { addXp, XpEvent } from '../services/gamificationService';
import { createSubscriptionCheckoutSession } from '../services/stripeService';
import { sendNewReviewNotification } from '../services/emailService';
import {
  Context,
  RegisterInput,
  LoginInput,
  CreateProjectInput,
  UpdateProjectInput,
  UpdateProfileInput,
  FavoriteType,
} from '../types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

const getUserId = (context: Context) => {
  if (!context.user) {
    throw new GraphQLError('User is not authenticated', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
  return context.user.userId;
};

export const resolvers = {
  Query: {
    health: () => 'OK',

    me: (_: unknown, __: unknown, context: Context) => {
      const userId = getUserId(context);
      return prisma.user.findUnique({ where: { id: userId } });
    },

    myProjectStats: async (_: unknown, __: unknown, context: Context) => {
      const userId = getUserId(context);
      const activeProjects = await prisma.project.count({
        where: { ownerId: userId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      });
      const completedProjects = await prisma.project.count({
        where: { ownerId: userId, status: 'COMPLETED' },
      });
      return { activeProjects, completedProjects };
    },

    lenta: () => prisma.project.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    }),

    project: (_: unknown, { id }: { id: string }) => {
      return prisma.project.findUnique({ where: { id } });
    },

    recommendFreelancers: async (_: unknown, { projectId }: { projectId: string }, context: Context) => {
      getUserId(context);
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new GraphQLError('Project not found');
      return findMatchingFreelancers(project, prisma);
    },

    myFavorites: async (_: unknown, __: unknown, context: Context) => {
        const userId = getUserId(context);
        const userWithFavorites = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                favoriteProjects: true,
                favoriteFreelancers: true,
            }
        });
        return {
            projects: userWithFavorites?.favoriteProjects || [],
            freelancers: userWithFavorites?.favoriteFreelancers || [],
        };
    }
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: RegisterInput }) => {
      const { email, password, name } = input;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new GraphQLError('User already exists', {
            extensions: { code: 'BAD_REQUEST' },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
      });
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    login: async (_: unknown, { input }: { input: LoginInput }) => {
      const { email, password } = input;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new GraphQLError('Invalid credentials');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw new GraphQLError('Invalid credentials');
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    updateUserRole: async (_: unknown, { role }: { role: 'CLIENT' | 'FREELANCER' }, context: Context) => {
      const userId = getUserId(context);
      return prisma.user.update({ where: { id: userId }, data: { role } });
    },

    updateProfile: async (_: unknown, { input }: { input: UpdateProfileInput }, context: Context) => {
        const userId = getUserId(context);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: input,
        });

        if (updatedUser.role === 'FREELANCER') {
            upsertUserProfileInVectorDB(updatedUser).catch(console.error);
        }
        return updatedUser;
    },

    addToFavorites: async (_: unknown, { itemId, type }: { itemId: string, type: FavoriteType }, context: Context) => {
        const userId = getUserId(context);
        const connectData = { connect: { id: itemId } };

        await prisma.user.update({
            where: { id: userId },
            data: type === 'PROJECT' ? { favoriteProjects: connectData } : { favoriteFreelancers: connectData }
        });
        return prisma.user.findUnique({ where: { id: userId } });
    },

    removeFromFavorites: async (_: unknown, { itemId, type }: { itemId: string, type: FavoriteType }, context: Context) => {
        const userId = getUserId(context);
        const disconnectData = { disconnect: { id: itemId } };

        await prisma.user.update({
            where: { id: userId },
            data: type === 'PROJECT' ? { favoriteProjects: disconnectData } : { favoriteFreelancers: disconnectData }
        });
        return prisma.user.findUnique({ where: { id: userId } });
    },

    createProject: async (_: unknown, { input }: { input: CreateProjectInput }, context: Context) => {
      const userId = getUserId(context);
      await Gatekeeper.canCreateProject(prisma, userId);
      return prisma.project.create({
        data: { ...input, ownerId: userId, deadline: new Date(input.deadline) },
      });
    },

    updateProject: async (_: unknown, { id, input }: { id: string; input: UpdateProjectInput }, context: Context) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
      if (!project) throw new GraphQLError('Project not found or access denied');
      return prisma.project.update({ where: { id }, data: { ...input, deadline: input.deadline ? new Date(input.deadline) : undefined } });
    },

    deleteProject: async (_: unknown, { id }: { id: string }, context: Context) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
      if (!project) throw new GraphQLError('Project not found or access denied');
      await prisma.project.delete({ where: { id } });
      return true;
    },

    submitReview: async (_: unknown, { projectId, rating, comment }: { projectId: string; rating: number; comment: string }, context: Context) => {
        const userId = getUserId(context);
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: userId, status: 'COMPLETED' },
            include: { review: true, owner: true, bids: true },
        });

        if (!project) throw new GraphQLError('You can only review completed projects that you own.');
        if (project.review) throw new GraphQLError('Review already submitted for this project.');

        const winningBid = project.bids[0];
        if (!winningBid) throw new GraphQLError('Cannot find a freelancer to review for this project.');

        const revieweeId = winningBid.userId;

        const review = await prisma.review.create({
            data: { rating, comment, projectId, reviewerId: userId, revieweeId },
        });

        if (rating >= 4) {
            addXp(prisma, revieweeId, XpEvent.RECEIVE_GOOD_REVIEW);
        }

        const reviewee = await prisma.user.findUnique({ where: { id: revieweeId } });
        if (reviewee && reviewee.email) {
            sendNewReviewNotification(reviewee.email, project.owner.name || 'A client', project.title, rating);
        }

        return review;
    },

    createSubscriptionCheckoutSession: async (_: unknown, { tier }: { tier: string }, context: Context) => {
      const userId = getUserId(context);
      if (tier !== 'PRO' && tier !== 'ENTERPRISE') {
        throw new GraphQLError('Invalid subscription tier for checkout. Must be PRO or ENTERPRISE.', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }
      const session = await createSubscriptionCheckoutSession(userId, tier);
      if (!session.url) throw new GraphQLError('Could not create a checkout session.');
      return session.url;
    },
  },

  User: {
    subscription: (parent: User) => parent.subscriptionId ? prisma.subscriptionTier.findUnique({ where: { id: parent.subscriptionId } }) : null,
    achievements: (parent: User) => prisma.userAchievement.findMany({ where: { userId: parent.id }, include: { achievement: true } }),
    projects: (parent: User) => prisma.project.findMany({ where: { ownerId: parent.id } }),
    reviewsGiven: (parent: User) => prisma.review.findMany({ where: { reviewerId: parent.id } }),
    reviewsReceived: (parent: User) => prisma.review.findMany({ where: { revieweeId: parent.id } }),
    favoriteProjects: (parent: User) => prisma.user.findUnique({ where: { id: parent.id } }).favoriteProjects(),
    favoriteFreelancers: (parent: User) => prisma.user.findUnique({ where: { id: parent.id } }).favoriteFreelancers(),
  },

  Project: {
    owner: (parent: { ownerId: string }) => prisma.user.findUnique({ where: { id: parent.ownerId } }),
    category: (parent: { categoryId: string | null }) => parent.categoryId ? prisma.category.findUnique({ where: { id: parent.categoryId } }) : null,
    bids: (parent: { id: string }) => prisma.bid.findMany({ where: { projectId: parent.id } }),
  },

  Bid: {
    user: (parent: { userId: string }) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },

  Review: {
    reviewer: (parent: { reviewerId: string }) => prisma.user.findUnique({ where: { id: parent.reviewerId } }),
    reviewee: (parent: { revieweeId: string }) => prisma.user.findUnique({ where: { id: parent.revieweeId } }),
    project: (parent: { projectId: string }) => prisma.project.findUnique({ where: { id: parent.projectId } }),
  },
};