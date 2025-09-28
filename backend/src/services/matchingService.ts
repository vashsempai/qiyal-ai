import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

import { Prisma, PrismaClient } from '@prisma/client';

// 1. CLIENT INITIALIZATION (Lazy)
// =================================

let pinecone: Pinecone | null = null;
let pineconeInitialized = false;
const getPineconeClient = (): Pinecone | null => {
  if (!pineconeInitialized) {
    pineconeInitialized = true;
    if (process.env.PINECONE_API_KEY) {
      pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    } else {
      console.warn('PINECONE_API_KEY not set. AI matching features will be disabled.');
    }
  }
  return pinecone;
}

let genAI: GoogleGenerativeAI | null = null;
let genAIInitialized = false;
const getGenAIClient = (): GoogleGenerativeAI | null => {
  if (!genAIInitialized) {
    genAIInitialized = true;
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
      console.warn('GEMINI_API_KEY not set. AI features will be disabled.');
    }
  }
  return genAI;
}

const getPineconeIndex = () => {
  const client = getPineconeClient();
  if (!client) return null;
  const indexName = process.env.PINECONE_INDEX_NAME || 'qiyal-ai-index';
  return client.Index(indexName);
};

// 2. EMBEDDING GENERATION
// =================================
const generateEmbedding = async (text: string): Promise<number[] | null> => {
  const aiClient = getGenAIClient();
  if (!aiClient) return null;
  const model = aiClient.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return result.embedding.values;
};

// 3. USER PROFILE UPSERT (for Freelancers)
// =================================

// We now use the User model directly. This function should be called when a user's
// freelancer-specific profile information is updated.
export const upsertUserProfileInVectorDB = async (user: any) => {
  const pineconeIndex = getPineconeIndex();
  if (!pineconeIndex || user.role !== 'FREELANCER') return;

  const profileText = `
    Bio: ${user.bio || ''}.
    Skills: ${(user.skills || []).join(', ')}.
    Experience: ${user.experience || 0} years.
    Rate: $${user.hourlyRate || 0}/hour.
  `;

  const embedding = await generateEmbedding(profileText);
  if (!embedding) return;

  await pineconeIndex.upsert([
    {
      id: user.id,
      values: embedding,
      metadata: {
        experience: user.experience || 0,
        hourlyRate: user.hourlyRate || 0,
      },
    },
  ]);
  console.log(`Upserted user profile ${user.id} to Pinecone.`);
};

// 3. FREELANCER PROFILE UPSERT
// =================================

// Define a type for the freelancer data we need to generate an embedding.
type FreelancerProfile = {
    id: string;
    bio: string;
    skills: string[];
    experience: number;
    hourlyRate: number;
};

export const upsertFreelancerProfile = async (freelancer: FreelancerProfile) => {
  const pineconeIndex = getPineconeIndex();
  if (!pineconeIndex) return;

  // Combine relevant fields into a single string for a rich embedding.
  const profileText = `
    Bio: ${freelancer.bio}.
    Skills: ${freelancer.skills.join(', ')}.
    Experience: ${freelancer.experience} years.
    Rate: $${freelancer.hourlyRate}/hour.
  `;

  const embedding = await generateEmbedding(profileText);
  if (!embedding) return;


  await pineconeIndex.upsert([
    {
      id: freelancer.id,
      values: embedding,
      metadata: {
        experience: freelancer.experience,
        hourlyRate: freelancer.hourlyRate,
      },
    },
  ]);
  console.log(`Upserted freelancer profile ${freelancer.id} to Pinecone.`);

  // Upsert the vector into the Pinecone index.
  await pineconeIndex.upsert([
    {
      id: freelancer.id,
      values: embedding,
      // Optional: Store metadata for filtering in Pinecone later.
      metadata: {
        experience: freelancer.experience,
        hourlyRate: freelancer.hourlyRate,
      },
    },
  ]);
  console.log(`Upserted freelancer profile ${freelancer.id} to Pinecone.`);

};


// 4. PROJECT MATCHING
// =================================

type ProjectDescription = {
    title: string;
    description: string;
    skills: string[];
};

// The function now returns Users with the FREELANCER role.
export const findMatchingFreelancers = async (project: ProjectDescription, prisma: PrismaClient): Promise<any[]> => {
  const pineconeIndex = getPineconeIndex();
  if (!pineconeIndex) return [];
  const projectText = `
    Project: ${project.title}.
    Description: ${project.description}.
    Required Skills: ${project.skills.join(', ')}.
  `;
  const embedding = await generateEmbedding(projectText);
  if (!embedding) return [];
  const queryResult = await pineconeIndex.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
  });
  if (!queryResult.matches || queryResult.matches.length === 0) {
    return [];
  }
  const userIds = queryResult.matches.map(match => match.id);
  // Fetch the full User profiles from the primary database (Postgres).
  return prisma.user.findMany({
    where: {
      id: { in: userIds },
      role: 'FREELANCER',
    },
  });
};

// 5. USER PROFILE DELETION
// =================================

export const deleteUserProfileFromVectorDB = async (userId: string) => {
    const pineconeIndex = getPineconeIndex();
    if (!pineconeIndex) return;

  await pineconeIndex.deleteOne(userId);
  console.log(`Deleted user profile ${userId} from Pinecone.`);
};

// 5. FREELANCER PROFILE DELETION
// =================================

export const deleteFreelancerProfile = async (freelancerId: string) => {
    const pineconeIndex = getPineconeIndex();
    if (!pineconeIndex) return;

  await pineconeIndex.deleteOne(freelancerId);
  console.log(`Deleted freelancer profile ${freelancerId} from Pinecone.`);
};