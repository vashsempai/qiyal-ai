import React from 'react';
import AchievementBadge from './AchievementBadge';

// A simple mapping for XP required for next level. In a real app, this would be more dynamic.
const xpToNextLevel: Record<string, number> = {
  Junior: 100,
  Middle: 300,
  Senior: 800,
  Lead: 2000,
  Guru: Infinity,
};

const UserProfileCard = ({ user }: { user: any }) => {
  const nextLevelXp = xpToNextLevel[user.level] || 100;
  const progressPercentage = user.level === 'Guru' ? 100 : (user.xp / nextLevelXp) * 100;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold">{user.name}</h3>
      <p className="text-gray-500 mb-4">Level: {user.level} ({user.subscription?.name || 'FREE'} Tier)</p>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">XP: {user.xp} / {nextLevelXp}</span>
          <span className="text-sm font-medium text-gray-700">Tokens: {user.tokens} 🪙</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h4 className="font-semibold mb-2">Achievements</h4>
        {user.achievements?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.achievements.map((userAchievement: any) => (
              <AchievementBadge
                key={userAchievement.achievement.id}
                achievement={userAchievement.achievement}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No achievements yet. Keep going!</p>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;