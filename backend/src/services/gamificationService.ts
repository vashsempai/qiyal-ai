import { PrismaClient, User } from '@prisma/client';

// Defines the events that can trigger an XP gain.
export enum XpEvent {
  COMPLETE_PROJECT = 10,
  SUBMIT_REVIEW = 3,
  RECEIVE_GOOD_REVIEW = 5, // For freelancers who get a good review (e.g., 4+ stars)
  COMPLETE_TUTORIAL = 5, // Placeholder for when tutorials exist
  DAILY_LOGIN = 2,
  PUBLISH_PORTFOLIO_ITEM = 1,
}

// Defines the XP thresholds for each level.
const LEVEL_THRESHOLDS: Record<string, number> = {
  Junior: 0,
  Middle: 100,
  Senior: 300,
  Lead: 800,
  Guru: 2000,
};

/**
 * Determines the user's new level based on their total XP.
 * @param xp The user's total experience points.
 * @returns The new level as a string.
 */
const getLevelFromXp = (xp: number): string => {
  let currentLevel = 'Junior';
  for (const level in LEVEL_THRESHOLDS) {
    if (xp >= LEVEL_THRESHOLDS[level]) {
      currentLevel = level;
    }
  }
  return currentLevel;
};

/**
 * Adds XP to a user's profile and checks for level-ups.
 * This function should be called after a qualifying event occurs.
 * @param prisma The Prisma client instance.
 * @param userId The ID of the user to grant XP to.
 * @param event The type of event that occurred.
 */
export const addXp = async (prisma: PrismaClient, userId: string, event: XpEvent): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  const newXp = user.xp + event;
  const newLevel = getLevelFromXp(newXp);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
    },
  });

  if (newLevel !== user.level) {
    // Here you could trigger a notification about the level up.
    console.log(`User ${userId} has leveled up to ${newLevel}!`);
  }

  // After adding XP, check if any new achievements have been unlocked.
  await checkAndAwardAchievements(prisma, userId);

  return updatedUser;
};

/**
 * Checks and awards achievements to a user based on their actions.
 * This is a placeholder and should be expanded with real achievement logic.
 * @param prisma The Prisma client instance.
 * @param userId The ID of the user to check.
 */
export const checkAndAwardAchievements = async (prisma: PrismaClient, userId: string): Promise<void> => {
    // In a real application, you would have a list of all possible achievements
    // and check the conditions for each one that the user hasn't already earned.

    // Example: "Activist" achievement for completing 10 projects.
    const completedProjectsCount = await prisma.project.count({
        where: { ownerId: userId, status: 'COMPLETED' },
    });

    if (completedProjectsCount >= 10) {
        // In a real app, 'activist-achievement-id' would be a real ID.
        await prisma.userAchievement.upsert({
            where: { userId_achievementId: { userId, achievementId: 'activist-achievement-id' } },
            update: {},
            create: {
                userId,
                achievementId: 'activist-achievement-id',
            },
        });
    }

    // ... add checks for other achievements (Master, Versatile, etc.)
    console.log(`Checked achievements for user ${userId}.`);
};