"use client";

import React from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_LENTA_FEED } from '@/lib/queries';
import ProjectCard from '@/components/ProjectCard'; // We will create this next

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

const LentaPage = () => {
  const { loading, error, data } = useQuery(GET_LENTA_FEED);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-500">Error loading feed: {error.message}</p>
      </div>
    );
  }

  const projects: Project[] = data?.lenta || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Lenta</h1>
      {projects.length === 0 ? (
        <p className="text-center text-gray-500">No projects to display yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LentaPage;