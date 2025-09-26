import { Resolvers } from '@apollo/server';
import { Context } from './types';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FreelancerInput {
  name: string;
  email: string;
  skills: string[];
  experience: number;
  bio: string;
  hourlyRate: number;
  location?: string;
  portfolio?: string;
}

interface FreelancerUpdateInput {
  name?: string;
  skills?: string[];
  experience?: number;
  bio?: string;
  hourlyRate?: number;
  location?: string;
  portfolio?: string;
}

interface FreelancerSearchFilters {
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  minRate?: number;
  maxRate?: number;
  location?: string;
}

export const freelancerResolvers: Resolvers = {
  Query: {
    // Получить всех фрилансеров
    freelancers: async (_, args, context: Context) => {
      try {
        const freelancers = await prisma.freelancer.findMany({
          include: {
            reviews: true,
            projects: true,
          },
        });
        return freelancers;
      } catch (error) {
        throw new Error(`Ошибка при получении фрилансеров: ${error.message}`);
      }
    },

    // Получить фрилансера по ID
    freelancer: async (_, { id }, context: Context) => {
      try {
        const freelancer = await prisma.freelancer.findUnique({
          where: { id },
          include: {
            reviews: true,
            projects: true,
          },
        });
        
        if (!freelancer) {
          throw new Error('Фрилансер не найден');
        }
        
        return freelancer;
      } catch (error) {
        throw new Error(`Ошибка при получении фрилансера: ${error.message}`);
      }
    },

    // Поиск фрилансеров с фильтрами
    searchFreelancers: async (_, { filters, query }, context: Context) => {
      try {
        let whereClause: any = {};
        
        // Применяем фильтры
        if (filters) {
          if (filters.skills && filters.skills.length > 0) {
            whereClause.skills = {
              hasSome: filters.skills,
            };
          }
          
          if (filters.minExperience !== undefined) {
            whereClause.experience = {
              ...whereClause.experience,
              gte: filters.minExperience,
            };
          }
          
          if (filters.maxExperience !== undefined) {
            whereClause.experience = {
              ...whereClause.experience,
              lte: filters.maxExperience,
            };
          }
          
          if (filters.minRate !== undefined) {
            whereClause.hourlyRate = {
              ...whereClause.hourlyRate,
              gte: filters.minRate,
            };
          }
          
          if (filters.maxRate !== undefined) {
            whereClause.hourlyRate = {
              ...whereClause.hourlyRate,
              lte: filters.maxRate,
            };
          }
          
          if (filters.location) {
            whereClause.location = {
              contains: filters.location,
              mode: 'insensitive',
            };
          }
        }
        
        // Текстовый поиск
        if (query) {
          whereClause.OR = [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              bio: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ];
        }
        
        const freelancers = await prisma.freelancer.findMany({
          where: whereClause,
          include: {
            reviews: true,
            projects: true,
          },
        });
        
        return freelancers;
      } catch (error) {
        throw new Error(`Ошибка при поиске фрилансеров: ${error.message}`);
      }
    },

    // AI-powered рекомендации фрилансеров для проекта
    recommendFreelancers: async (_, { projectId }, context: Context) => {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });
        
        if (!project) {
          throw new Error('Проект не найден');
        }
        
        // Создаем эмбеддинг для описания проекта
        const projectEmbedding = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: `${project.title} ${project.description} ${project.skills.join(' ')}`,
        });
        
        // Получаем всех фрилансеров
        const freelancers = await prisma.freelancer.findMany({
          include: {
            reviews: true,
            projects: true,
          },
        });
        
        // Создаем эмбеддинги для каждого фрилансера и вычисляем схожесть
        const freelancersWithSimilarity = await Promise.all(
          freelancers.map(async (freelancer) => {
            const freelancerText = `${freelancer.name} ${freelancer.bio} ${freelancer.skills.join(' ')}`;
            
            const freelancerEmbedding = await openai.embeddings.create({
              model: 'text-embedding-ada-002',
              input: freelancerText,
            });
            
            // Вычисляем косинусное сходство
            const similarity = cosineSimilarity(
              projectEmbedding.data[0].embedding,
              freelancerEmbedding.data[0].embedding
            );
            
            return {
              ...freelancer,
              similarity,
            };
          })
        );
        
        // Сортируем по схожести и возвращаем топ-10
        return freelancersWithSimilarity
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 10);
      } catch (error) {
        throw new Error(`Ошибка при получении рекомендаций: ${error.message}`);
      }
    },
  },

  Mutation: {
    // Создать профиль фрилансера
    createFreelancer: async (_, { input }, context: Context) => {
      try {
        // Проверяем уникальность email
        const existingFreelancer = await prisma.freelancer.findUnique({
          where: { email: input.email },
        });
        
        if (existingFreelancer) {
          throw new Error('Фрилансер с таким email уже существует');
        }
        
        const freelancer = await prisma.freelancer.create({
          data: {
            name: input.name,
            email: input.email,
            skills: input.skills,
            experience: input.experience,
            bio: input.bio,
            hourlyRate: input.hourlyRate,
            location: input.location,
            portfolio: input.portfolio,
          },
          include: {
            reviews: true,
            projects: true,
          },
        });
        
        return freelancer;
      } catch (error) {
        throw new Error(`Ошибка при создании профиля фрилансера: ${error.message}`);
      }
    },

    // Обновить профиль фрилансера
    updateFreelancer: async (_, { id, input }, context: Context) => {
      try {
        const existingFreelancer = await prisma.freelancer.findUnique({
          where: { id },
        });
        
        if (!existingFreelancer) {
          throw new Error('Фрилансер не найден');
        }
        
        const freelancer = await prisma.freelancer.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.skills && { skills: input.skills }),
            ...(input.experience !== undefined && { experience: input.experience }),
            ...(input.bio && { bio: input.bio }),
            ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
            ...(input.location && { location: input.location }),
            ...(input.portfolio && { portfolio: input.portfolio }),
          },
          include: {
            reviews: true,
            projects: true,
          },
        });
        
        return freelancer;
      } catch (error) {
        throw new Error(`Ошибка при обновлении профиля фрилансера: ${error.message}`);
      }
    },

    // Удалить профиль фрилансера
    deleteFreelancer: async (_, { id }, context: Context) => {
      try {
        const existingFreelancer = await prisma.freelancer.findUnique({
          where: { id },
        });
        
        if (!existingFreelancer) {
          throw new Error('Фрилансер не найден');
        }
        
        await prisma.freelancer.delete({
          where: { id },
        });
        
        return true;
      } catch (error) {
        throw new Error(`Ошибка при удалении профиля фрилансера: ${error.message}`);
      }
    },
  },
};

// Функция для вычисления косинусного сходства
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}
