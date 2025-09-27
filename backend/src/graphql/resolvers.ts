import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import {
  upsertFreelancerProfile,
  findMatchingFreelancers,
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

    me: async (_parent: unknown, _args: unknown, context: Context) => {
      const userId = getUserId(context);
      return await prisma.user.findUnique({ where: { id: userId } });
    },

    conversations: async (_parent: unknown, _args: unknown, context: Context) => {
      const userId = getUserId(context);
      return await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    },

    conversation: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const userId = getUserId(context);
      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conversation) {
        throw new GraphQLError('Conversation not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return conversation;
    },

    projects: () => prisma.project.findMany({ include: { owner: true, category: true } }),

    project: (_parent: unknown, { id }: { id: string }) => {
      const project = prisma.project.findUnique({
        where: { id },
        include: { owner: true, category: true, bids: true },
      });
      if (!project) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return project;
    },

    freelancers: () => prisma.freelancer.findMany(),

    freelancer: (_parent: unknown, { id }: { id: string }) => {
      const freelancer = prisma.freelancer.findUnique({ where: { id } });
      if (!freelancer) {
        throw new GraphQLError('Freelancer not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return freelancer;
    },

    recommendFreelancers: async (_parent: unknown, { projectId }: { projectId: string }, context: Context) => {
      getUserId(context); // Ensure user is authenticated
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new GraphQLError('Project not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Use the new service to find matching freelancers
      return findMatchingFreelancers(project, prisma);
    },

    lenta: () => {
      return prisma.project.findMany({
        where: { canShowInPortfolio: true },
        orderBy: { createdAt: 'desc' },
        include: { owner: true, category: true },
      });
    },

    subscriptionTiers: () => {
      return prisma.subscriptionTier.findMany();
    },

    myProjectStats: async (_parent: unknown, _args: unknown, context: Context) => {
        const userId = getUserId(context);
        const activeProjects = await prisma.project.count({
            where: { ownerId: userId, status: 'OPEN' },
        });
        const completedProjects = await prisma.project.count({
            where: { ownerId: userId, status: 'COMPLETED' },
        });
        return { activeProjects, completedProjects };
    },
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
      return prisma.user.update({
        where: { id: userId },
        data: { role },
      });
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
        throw new GraphQLError('Conversation not found or access denied', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await prisma.message.create({
        data: { conversationId: conversation.id, content: message, role: 'user' },
      });

      const history = conversation.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const aiResponseContent = await getChatbotResponse(message, history);

      if (!aiResponseContent) {
        throw new GraphQLError('The AI assistant failed to generate a response.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      const aiMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: aiResponseContent,
          role: 'assistant',
        },
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

    createProject: async (_parent: unknown, { input }: { input: CreateProjectInput }, context: Context) => {
      const userId = getUserId(context);
      await Gatekeeper.canCreateProject(prisma, userId);

      const { title, description, budget, deadline, skills, categoryId } = input;
      return await prisma.project.create({
        data: {
          title, description, budget, skills,
          deadline: new Date(deadline),
          ownerId: userId,
          categoryId,
          status: 'OPEN',
        },
      });
    },

    updateProject: async (_parent: unknown, { id, input }: { id: string; input: UpdateProjectInput }, context: Context) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });

      if (!project) {
        throw new GraphQLError('Project not found or you do not have permission to edit it', { extensions: { code: 'NOT_FOUND' } });
      }

      const updatedProject = await prisma.project.update({ where: { id }, data: input });

      // If the project is marked as completed, award XP to the freelancer.
      // This assumes a 'freelancerId' field is added to the Project model when a bid is accepted.
      // As a placeholder, we will award it to the owner for now.
      if (input.status === 'COMPLETED' && project.status !== 'COMPLETED') {
          // In a real scenario, you'd find the assigned freelancer's ID.
          // const assignedFreelancerId = project.assignedFreelancerId;
          // addXp(prisma, assignedFreelancerId, XpEvent.COMPLETE_PROJECT);
      }

      return updatedProject;
    },

    deleteProject: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
      if (!project) {
        throw new GraphQLError('Project not found or you do not have permission to delete it', { extensions: { code: 'NOT_FOUND' } });
      }
      await prisma.project.delete({ where: { id } });
      return true;
    },

    updateProjectPortfolioPermission: async (
      _parent: unknown,
      { projectId, canShowInPortfolio }: { projectId: string; canShowInPortfolio: boolean },
      context: Context
    ) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: userId },
      });

      if (!project) {
        throw new GraphQLError(
          'Project not found or you do not have permission to edit it.',
          { extensions: { code: 'FORBIDDEN' } }
        );
      }

      return prisma.project.update({
        where: { id: projectId },
        data: { canShowInPortfolio },
      });
    },

    createFreelancer: async (_parent: unknown, { input }: { input: CreateFreelancerInput }, context: Context) => {
      const userId = getUserId(context);

      const existingProfile = await prisma.freelancer.findUnique({ where: { userId } });
      if (existingProfile) {
        throw new GraphQLError('A freelancer profile already exists for this user.', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      const freelancer = await prisma.freelancer.create({
        data: {
          ...input,
          userId: userId,
        },
      });

      // Asynchronously upsert the profile to Pinecone. No need to await.
      upsertFreelancerProfile(freelancer).catch(console.error);

      return freelancer;
    },

    updateFreelancer: async (_parent: unknown, { id, input }: { id: string; input: UpdateFreelancerInput }, context: Context) => {
      const userId = getUserId(context);

      const existingFreelancer = await prisma.freelancer.findUnique({
        where: { id },
      });

      if (!existingFreelancer || existingFreelancer.userId !== userId) {
        throw new GraphQLError('Freelancer profile not found or you do not have permission to edit it.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const updatedFreelancer = await prisma.freelancer.update({
        where: { id },
        data: input,
      });

      // Asynchronously upsert the profile to Pinecone.
      upsertFreelancerProfile(updatedFreelancer).catch(console.error);

      return updatedFreelancer;
    },

    deleteFreelancer: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      getUserId(context);

      // In a production environment, you'd wrap these two operations in a transaction
      // to ensure that either both succeed or both fail.
      await prisma.freelancer.delete({ where: { id } });
      deleteFreelancerProfile(id).catch(console.error); // Asynchronously delete from Pinecone

      return true;
    },

    submitReview: async (
      _parent: unknown,
      { freelancerId, projectId, rating, comment }: { freelancerId: string; projectId: string; rating: number; comment: string },
      context: Context
    ) => {
      const userId = getUserId(context);
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: userId, status: 'COMPLETED' },
        include: { review: true, owner: true },
      });

      if (!project) {
        throw new GraphQLError(
          'You can only review completed projects that you own.',
          { extensions: { code: 'FORBIDDEN' } }
        );
      }

      if (project.review) {
        throw new GraphQLError('A review for this project has already been submitted.', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      const freelancer = await prisma.freelancer.findUnique({ where: { id: freelancerId } });
      if (!freelancer) {
        throw new GraphQLError('Freelancer not found.');
      }

      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          freelancerId,
          projectId,
          reviewerId: userId,
        },
      });

      addXp(prisma, userId, XpEvent.SUBMIT_REVIEW);
      sendNewReviewNotification(
        freelancer.email,
        project.owner.name || 'A client',
        project.title,
        rating
      );

      return review;
    },

    changeSubscription: async (_parent: unknown, { tier }: { tier: 'FREE' | 'PRO' | 'ENTERPRISE' }, context: Context) => {
      const userId = getUserId(context);
      const subscriptionTier = await prisma.subscriptionTier.findUnique({
        where: { name: tier },
      });

      if (!subscriptionTier) {
        throw new GraphQLError('Invalid subscription tier.', { extensions: { code: 'BAD_REQUEST' } });
      }

      return prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: subscriptionTier.id },
      });
    },

    createSubscriptionCheckoutSession: async (
      _parent: unknown,
      { tier }: { tier: 'PRO' | 'ENTERPRISE' },
      context: Context
    ) => {
      const userId = getUserId(context);
      const session = await createSubscriptionCheckoutSession(userId, tier);
      if (!session.url) {
        throw new GraphQLError('Could not create a checkout session.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      return session.url;
    },
  },

  // Resolver for nested types
  User: {
    subscription: (parent: { subscriptionId: string | null }) => {
      if (!parent.subscriptionId) return null;
      return prisma.subscriptionTier.findUnique({ where: { id: parent.subscriptionId } });
    },
    achievements: (parent: { id: string }) => {
      return prisma.userAchievement.findMany({
        where: { userId: parent.id },
        include: { achievement: true },
      });
    },
  },
  Project: {
    owner: (parent: { ownerId: string }) => prisma.user.findUnique({ where: { id: parent.ownerId } }),
  },
  Conversation: {
    messages: (parent: { id: string }) => prisma.message.findMany({ where: { conversationId: parent.id } }),
  },
};