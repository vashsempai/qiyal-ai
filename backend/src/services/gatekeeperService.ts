import { PrismaClient, User, SubscriptionTier } from '@prisma/client';
import { GraphQLError } from 'graphql';

const defaultFreeTier: SubscriptionTier = {
    id: 'free-tier-default',
    name: 'FREE',
    maxProjects: 3,
    maxResponses: 10,
    maxPortfolioItems: 5,
    chatMessagesPerDay: 20,
};

/**
 * A helper function to get the user with their subscription details.
 * Throws an error if the user is not found.
 */
const getUserWithSubscription = async (prisma: PrismaClient, userId: string): Promise<(User & { subscription: SubscriptionTier | null })> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
    });
    if (!user) {
        throw new GraphQLError('User not found.', { extensions: { code: 'NOT_FOUND' } });
    }
    return user;
};

/**
 * Gatekeeper service to check user permissions based on their subscription tier.
 */
export const Gatekeeper = {
    /**
     * Checks if a user can create a new project based on their subscription limit.
     * Throws a GraphQL error if the limit is reached.
     */
    canCreateProject: async (prisma: PrismaClient, userId: string): Promise<void> => {
        const user = await getUserWithSubscription(prisma, userId);
        const tier = user.subscription ?? defaultFreeTier;

        const projectCount = await prisma.project.count({
            where: { ownerId: userId, status: 'OPEN' },
        });

        if (projectCount >= tier.maxProjects) {
            throw new GraphQLError(
                `You have reached the maximum of ${tier.maxProjects} active projects for the ${tier.name} tier.`,
                { extensions: { code: 'UPGRADE_REQUIRED' } }
            );
        }
    },

    /**
     * Checks if a user can send a response/bid to a project.
     * This is a placeholder for when the Bid model is more fully implemented.
     */
    canSendResponse: async (prisma: PrismaClient, userId: string): Promise<void> => {
        const user = await getUserWithSubscription(prisma, userId);
        const tier = user.subscription ?? defaultFreeTier;

        // In a real app, you'd count bids from the last 30 days.
        const responseCount = 0; // Placeholder
        if (responseCount >= tier.maxResponses) {
            throw new GraphQLError(
                `You have reached your monthly limit of ${tier.maxResponses} responses for the ${tier.name} tier.`,
                { extensions: { code: 'UPGRADE_REQUIRED' } }
            );
        }
    },

    /**
     * Checks if a user can send a message in the chat.
     * This is a placeholder for more detailed tracking.
     */
    canUseChat: async (prisma: PrismaClient, userId: string): Promise<void> => {
        const user = await getUserWithSubscription(prisma, userId);
        const tier = user.subscription ?? defaultFreeTier;

        // In a real app, you would count messages from the last 24 hours.
        const messageCountToday = 0; // Placeholder
        if (messageCountToday >= tier.chatMessagesPerDay) {
            throw new GraphQLError(
                `You have reached your daily limit of ${tier.chatMessagesPerDay} chat messages for the ${tier.name} tier.`,
                { extensions: { code: 'UPGRADE_REQUIRED' } }
            );
        }
    },
};