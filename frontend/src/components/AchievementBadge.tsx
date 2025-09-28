import React from 'react';

interface Achievement {
  name: string;
  icon: string;
  description: string;
}

interface Props {
  achievement: Achievement;
}

const AchievementBadge: React.FC<Props> = ({ achievement }) => {
  return (
    <div className="flex items-center p-2 bg-gray-100 rounded-lg" title={achievement.description}>
      <span className="text-2xl mr-2">{achievement.icon}</span>
      <span className="font-semibold text-sm">{achievement.name}</span>
    </div>
  );
};

export default AchievementBadge;