import { PrismaClient } from '@prisma/client';
import { Context } from '../types';

const prisma = new PrismaClient();

export const projectResolvers = {
  Query: {
    projects: async () => {
      return await prisma.project.findMany({
        include: {
          owner: true,
          bids: true,
          category: true,
        },
      });
    },
    project: async (_: any, { id }: { id: string }) => {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          owner: true,
          bids: {
            include: {
              freelancer: true,
            },
          },
          category: true,
        },
      });
    },
    projectsByOwner: async (_: any, { ownerId }: { ownerId: string }) => {
      return await prisma.project.findMany({
        where: { ownerId },
        include: {
          owner: true,
          bids: true,
          category: true,
        },
      });
    },
    projectsByCategory: async (_: any, { categoryId }: { categoryId: string }) => {
      return await prisma.project.findMany({
        where: { categoryId },
        include: {
          owner: true,
          bids: true,
          category: true,
        },
      });
    },
  },
  Mutation: {
    createProject: async (
      _: any,
      {
        title,
        description,
        budget,
        deadline,
        categoryId,
        skills,
        ownerId,
      }: {
        title: string;
        description: string;
        budget: number;
        deadline: string;
        categoryId: string;
        skills: string[];
        ownerId: string;
      }
    ) => {
      return await prisma.project.create({
        data: {
          title,
          description,
          budget,
          deadline: new Date(deadline),
          categoryId,
          skills,
          ownerId,
          status: 'OPEN',
        },
        include: {
          owner: true,
          bids: true,
          category: true,
        },
      });
    },
    updateProject: async (
      _: any,
      {
        id,
        title,
        description,
        budget,
        deadline,
        categoryId,
        skills,
        status,
      }: {
        id: string;
        title?: string;
        description?: string;
        budget?: number;
        deadline?: string;
        categoryId?: string;
        skills?: string[];
        status?: string;
      }
    ) => {
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (budget) updateData.budget = budget;
      if (deadline) updateData.deadline = new Date(deadline);
      if (categoryId) updateData.categoryId = categoryId;
      if (skills) updateData.skills = skills;
      if (status) updateData.status = status;

      return await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          owner: true,
          bids: true,
          category: true,
        },
      });
    },
    deleteProject: async (_: any, { id }: { id: string }) => {
      return await prisma.project.delete({
        where: { id },
      });
    },
    closeProject: async (_: any, { id }: { id: string }) => {
      return await prisma.project.update({
        where: { id },
        data: {
          status: 'CLOSED',
        },
        include: {
          owner: true,
          bids: true,
          category: true,
        },
      });
    },
  },
};
