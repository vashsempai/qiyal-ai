"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_PROJECT_DETAILS, GET_ME } from '@/lib/queries';
import PortfolioPermissionToggle from '@/components/PortfolioPermissionToggle';
import ReviewForm from '@/components/ReviewForm';

const ProjectDetailsPage = () => {
  const params = useParams();
  const id = params.id as string;

  const { data: meData } = useQuery(GET_ME);
  const { loading, error, data } = useQuery(GET_PROJECT_DETAILS, {
    variables: { id },
    skip: !id,
  });

  if (loading) return <p className="text-center mt-8">Loading project details...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">Error: {error.message}</p>;
  if (!data?.project) return <p className="text-center mt-8">Project not found.</p>;

  const { project } = data;
  const isOwner = meData?.me?.id === project.owner.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
            <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                project.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
                {project.status}
            </span>
        </div>

        <p className="text-gray-700 mb-6">{project.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="text-lg font-semibold">{project.owner.name}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-lg font-semibold">${project.budget.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-lg font-semibold">{new Date(project.deadline).toLocaleDateString()}</p>
            </div>
        </div>

        <div>
            <p className="text-sm text-gray-500 mb-2">Skills Required</p>
            <div className="flex flex-wrap gap-2">
                {project.skills.map((skill: string) => (
                    <span key={skill} className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {skill}
                    </span>
                ))}
            </div>
        </div>

        {isOwner && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-3">Project Settings</h2>
            <PortfolioPermissionToggle
              projectId={project.id}
              initialValue={project.canShowInPortfolio}
            />
          </div>
        )}

        {isOwner && project.status === 'COMPLETED' && !project.review && (
            <div className="mt-8 border-t pt-6">
                {/* A real app would need a clear way to identify the freelancer being reviewed */}
                <ReviewForm
                    projectId={project.id}
                    freelancerId={"freelancer-placeholder-id"} // This needs a proper way to be identified
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;