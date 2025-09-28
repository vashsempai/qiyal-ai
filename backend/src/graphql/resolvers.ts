
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import {
  upsertUserProfileInVectorDB,
  upsertFreelancerProfile,
  findMatchingFreelancers,
  deleteUserProfileFromVectorDB,
  deleteFreelancerProfile,
} from '../services/matchingService';
import { getChatbotResponse } from '../services/openaiService';
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
  CreateFreelancerInput,
  UpdateFreelancerInput,
} from '../types';

// Initialize clients
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper to check for authentication
const getUserId = (context: Context) => {
  if (!context.user) {
    throw new GraphQLError('User is not authenticated', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },

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
    register: async (_parent: unknown, { input }: { input: RegisterInput }) => {
      const { email, password, name } = input;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new GraphQLError('User already exists', { extensions: { code: 'BAD_REQUEST' } });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
      });
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    login: async (_parent: unknown, { input }: { input: LoginInput }) => {
      const { email, password } = input;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    updateUserRole: async (_parent: unknown, { role }: { role: 'CLIENT' | 'FREELANCER' }, context: Context) => {
      const userId = getUserId(context);
      return prisma.user.update({ where: { id: userId }, data: { role } });
    },

    updateProfile: async (_parent: unknown, { input }: { input: UpdateProfileInput }, context: Context) => {
      const userId = getUserId(context);
      // Оставляем только разрешённые поля для обновления
      const allowedFields = ['name', 'skills', 'experience', 'bio', 'hourlyRate', 'location', 'portfolio', 'status'];
      const data: any = {};
      for (const key of allowedFields) {
        if (key in input) data[key] = (input as any)[key];
      }
      const updatedUser = await prisma.user.update({ where: { id: userId }, data });
      if (updatedUser.role === 'FREELANCER') {
        upsertUserProfileInVectorDB(updatedUser).catch(console.error);
      }
      return updatedUser;
    },

    addToFavorites: async (_parent: unknown, { itemId, type }: { itemId: string, type: FavoriteType }, context: Context) => {
      const userId = getUserId(context);
      const connectData = { connect: { id: itemId } };
      await prisma.user.update({
        where: { id: userId },
        data: type === 'PROJECT' ? { favoriteProjects: connectData } : { favoriteFreelancers: connectData },
      });
      return prisma.user.findUnique({ where: { id: userId } });
    },

    removeFromFavorites: async (_parent: unknown, { itemId, type }: { itemId: string, type: FavoriteType }, context: Context) => {
      const userId = getUserId(context);
      const disconnectData = { disconnect: { id: itemId } };
      await prisma.user.update({
        where: { id: userId },
        data: type === 'PROJECT' ? { favoriteProjects: disconnectData } : { favoriteFreelancers: disconnectData },
      });
      return prisma.user.findUnique({ where: { id: userId } });
    },

    createProject: async (_parent: unknown, { input }: { input: CreateProjectInput }, context: Context) => {
      const userId = getUserId(context);
      await Gatekeeper.canCreateProject(prisma, userId);
      return prisma.project.create({
        data: { ...input, ownerId: userId, deadline: new Date(input.deadline) },
      });
    },

    updateProject: async (_parent: unknown, { id, input }: { id: string; input: UpdateProjectInput }, context: Context) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
      if (!project) throw new GraphQLError('Project not found or access denied');
      return prisma.project.update({ where: { id }, data: { ...input, deadline: input.deadline ? new Date(input.deadline) : undefined } });
    },

    deleteProject: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
      if (!project) throw new GraphQLError('Project not found or access denied');
      await prisma.project.delete({ where: { id } });
      return true;
    },

    sendMessage: async (
      _parent: unknown,
      { message, conversationId }: { message: string; conversationId?: string },
      context: Context
    ) => {
      const userId = getUserId(context);
      await Gatekeeper.canUseChat(prisma, userId);
      let conversation;
      if (conversationId) {
        conversation = await prisma.conversation.findFirst({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
      } else {
        conversation = await prisma.conversation.create({
          data: { userId, title: message.substring(0, 30) },
          include: { messages: true },
        });
      }
      if (!conversation) {
        throw new GraphQLError('Conversation not found or access denied', { extensions: { code: 'NOT_FOUND' } });
      }
      await prisma.message.create({ data: { conversationId: conversation.id, content: message, role: 'user' } });
  const history = conversation.messages.map((msg: any) => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));
      const aiResponseContent = await getChatbotResponse(message, history);
      if (!aiResponseContent) {
        throw new GraphQLError('The AI assistant failed to generate a response.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
      const aiMessage = await prisma.message.create({
        data: { conversationId: conversation.id, content: aiResponseContent, role: 'assistant' },
      });
      return aiMessage;
    },

    deleteConversation: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const userId = getUserId(context);
      const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
      if (!conversation) {
        throw new GraphQLError('Conversation not found or access denied', { extensions: { code: 'NOT_FOUND' } });
      }
      await prisma.conversation.delete({ where: { id } });
      return true;
    },


    // createFreelancer, updateFreelancer, deleteFreelancer удалены, так как модели freelancer нет в Prisma

    submitReview: async (
      _parent: unknown,
      { revieweeId, projectId, rating, comment }: { revieweeId: string; projectId: string; rating: number; comment: string },
      context: Context
    ) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: userId, status: 'COMPLETED' },
        include: { review: true, owner: true },
      });
      if (!project) {
        throw new GraphQLError('You can only review completed projects that you own.', { extensions: { code: 'FORBIDDEN' } });
      }
      if (project.review) {
        throw new GraphQLError('A review for this project has already been submitted.', { extensions: { code: 'BAD_REQUEST' } });
      }
      const reviewee = await prisma.user.findUnique({ where: { id: revieweeId } });
      if (!reviewee) {
        throw new GraphQLError('User to review not found.');
      }
      const review = await prisma.review.create({
        data: { rating, comment, revieweeId, projectId, reviewerId: userId },
      });
      addXp(prisma, userId, XpEvent.SUBMIT_REVIEW);
      sendNewReviewNotification(reviewee.email, project.owner.name || 'A client', project.title, rating);
      return review;
    },

    changeSubscription: async (_parent: unknown, { tier }: { tier: 'FREE' | 'PRO' | 'ENTERPRISE' }, context: Context) => {
      const userId = getUserId(context);
      const subscriptionTier = await prisma.subscriptionTier.findUnique({ where: { name: tier } });
      if (!subscriptionTier) {
        throw new GraphQLError('Invalid subscription tier.', { extensions: { code: 'BAD_REQUEST' } });
      }
      return prisma.user.update({ where: { id: userId }, data: { subscriptionId: subscriptionTier.id } });
    },

    createSubscriptionCheckoutSession: async (
      _parent: unknown,
      { tier }: { tier: 'PRO' | 'ENTERPRISE' },
      context: Context
    ) => {
      const userId = getUserId(context);
      const session = await createSubscriptionCheckoutSession(userId, tier);
      if (!session.url) {
        throw new GraphQLError('Could not create a checkout session.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
      return session.url;
    },

    updateProjectPortfolioPermission: async (
      _parent: unknown,
      { projectId, canShowInPortfolio }: { projectId: string; canShowInPortfolio: boolean },
      context: Context
    ) => {
      const userId = getUserId(context);
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
      if (!project) {
        throw new GraphQLError('Project not found or you do not have permission to edit it.', { extensions: { code: 'FORBIDDEN' } });
      }
      return prisma.project.update({ where: { id: projectId }, data: { canShowInPortfolio } });
    },
  },

  User: {
    subscription: (parent: any) => parent.subscriptionId ? prisma.subscriptionTier.findUnique({ where: { id: parent.subscriptionId } }) : null,
    achievements: (parent: any) => prisma.userAchievement.findMany({ where: { userId: parent.id }, include: { achievement: true } }),
    projects: (parent: any) => prisma.project.findMany({ where: { ownerId: parent.id } }),
    reviewsGiven: (parent: any) => prisma.review.findMany({ where: { reviewerId: parent.id } }),
    reviewsReceived: (parent: any) => prisma.review.findMany({ where: { revieweeId: parent.id } }),
    favoriteProjects: (parent: any) => prisma.user.findUnique({ where: { id: parent.id } }).favoriteProjects(),
    favoriteFreelancers: (parent: any) => prisma.user.findUnique({ where: { id: parent.id } }).favoriteFreelancers(),
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

  Conversation: {
    messages: (parent: { id: string }) => prisma.message.findMany({ where: { conversationId: parent.id } }),
  },
};