import React from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  owner: {
    name: string;
  };
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
        <p className="text-gray-600 mb-4 truncate">{project.description}</p>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700">Skills Required:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.skills.map((skill) => (
              <span key={skill} className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="text-lg font-bold text-green-600">${project.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Posted by</p>
            <p className="text-lg font-semibold text-gray-800">{project.owner.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;