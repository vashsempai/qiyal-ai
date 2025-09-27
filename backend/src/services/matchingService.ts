import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { Prisma, PrismaClient } from '@prisma/client';

// 1. CLIENT INITIALIZATION
// =================================

let pinecone: Pinecone | null = null;
// The latest Pinecone SDK no longer requires the 'environment' parameter for initialization.
// It is determined automatically from the API key.
if (process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
} else {
  console.warn(
    'PINECONE_API_KEY not set. AI matching features will be disabled.'
  );
}

let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn(
    'GEMINI_API_KEY not set. AI features will be disabled.'
  );
}

const getPineconeIndex = () => {
    if (!pinecone) return null;
    // Ensure the index name is set, or default to a name.
    const indexName = process.env.PINECONE_INDEX_NAME || 'qiyal-ai-index';
    return pinecone.Index(indexName);
}

// 2. EMBEDDING GENERATION
// =================================

const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' }, // Add role to content
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return result.embedding.values;
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

export const findMatchingFreelancers = async (project: ProjectDescription, prisma: PrismaClient): Promise<Prisma.FreelancerGetPayload<null>[]> => {
    const pineconeIndex = getPineconeIndex();
    if (!pineconeIndex) return [];

    const projectText = `
        Project: ${project.title}.
        Description: ${project.description}.
        Required Skills: ${project.skills.join(', ')}.
    `;

    const embedding = await generateEmbedding(projectText);
    if (!embedding) return [];

    // Query Pinecone for the top 5 most similar freelancer profiles.
    const queryResult = await pineconeIndex.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true, // We can use this if we add metadata
    });

    if (!queryResult.matches || queryResult.matches.length === 0) {
        return [];
    }

    const freelancerIds = queryResult.matches.map(match => match.id);

    // Fetch the full freelancer profiles from the primary database (Postgres).
    return prisma.freelancer.findMany({
        where: {
            id: {
                in: freelancerIds,
            },
        },
    });
};

// 5. FREELANCER PROFILE DELETION
// =================================

export const deleteFreelancerProfile = async (freelancerId: string) => {
    const pineconeIndex = getPineconeIndex();
    if (!pineconeIndex) return;

    await pineconeIndex.deleteOne(freelancerId);
    console.log(`Deleted freelancer profile ${freelancerId} from Pinecone.`);
};