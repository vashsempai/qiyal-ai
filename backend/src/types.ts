import { PrismaClient } from '@prisma/client';

export interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface Context {
  prisma: PrismaClient;
  user: DecodedToken | null;
}

// =================================
// INPUT TYPES FOR GRAPHQL RESOLVERS
// =================================


// Input Types for GraphQL Resolvers

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateProjectInput {
    title: string;
    description: string;
    budget: number;
    deadline: string;
    skills: string[];
    categoryId?: string;
}

export interface UpdateProjectInput {
    title?: string;
    description?: string;
    budget?: number;
    deadline?: string;
    skills?: string[];

    status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateProfileInput {

    status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'COMPLETED';
}

export interface CreateFreelancerInput {
    name: string;
    email: string;
    skills: string[];
    experience: number;
    bio: string;
    hourlyRate: number;
    location?: string;
    portfolio?: string;
}

export interface UpdateFreelancerInput {

    name?: string;
    skills?: string[];
    experience?: number;
    bio?: string;
    hourlyRate?: number;
    location?: string;

    portfolio?: string[];
}

export type FavoriteType = 'PROJECT' | 'FREELANCER';

    portfolio?: string;
}

