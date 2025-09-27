import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # =================================
  # SCALAR & ENUM TYPES
  # =================================

  scalar DateTime

  enum UserRole {
    CLIENT
    FREELANCER
  }

  enum ProjectStatus {
    OPEN
    IN_PROGRESS
    CLOSED
    COMPLETED
    CANCELLED
  }

  enum FavoriteType {
    PROJECT
    FREELANCER
  }

  # =================================
  # CORE TYPES
  # =================================

  type User {
    id: ID!
    email: String!
    name: String
    role: UserRole!
    createdAt: DateTime!

    # Gamification
    xp: Int!
    level: String!
    tokens: Int!
    achievements: [UserAchievement!]

    # Subscription
    subscription: SubscriptionTier

    # Freelancer Profile
    skills: [String!]
    experience: Int
    bio: String
    hourlyRate: Float
    location: String
    portfolio: [String!]

    # Relations
    projects: [Project!]
    reviewsGiven: [Review!]
    reviewsReceived: [Review!]
    favoriteProjects: [Project!]
    favoriteFreelancers: [User!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Project {
    id: ID!
    title: String!
    description: String!
    budget: Float!
    deadline: DateTime!
    status: ProjectStatus!
    skills: [String!]!
    owner: User!
    ownerId: ID!
    category: Category
    bids: [Bid!]
  }

  type Category {
    id: ID!
    name: String!
  }

  type Bid {
    id: ID!
    amount: Float!
    proposal: String!
    user: User! # The freelancer who made the bid
    project: Project!
    createdAt: DateTime!
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String!
    reviewer: User! # User who wrote the review
    reviewee: User! # User who is being reviewed
    project: Project!
    createdAt: DateTime!
  }

  type SubscriptionTier {
    id: ID!
    name: String!
    maxProjects: Int!
    maxResponses: Int!
    maxPortfolioItems: Int!
    chatMessagesPerDay: Int!
  }

  type ProjectStats {
    activeProjects: Int!
    completedProjects: Int!
  }

  type Achievement {
    id: ID!
    name: String!
    description: String!
    icon: String!
  }

  type UserAchievement {
    achievement: Achievement!
    createdAt: DateTime!
  }

  type FavoritesPayload {
    projects: [Project!]!
    freelancers: [User!]!
  }

  # =================================
  # INPUT TYPES
  # =================================

  input RegisterInput {
    email: String!
    password: String!
    name: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateProjectInput {
    title: String!
    description: String!
    budget: Float!
    deadline: String!
    skills: [String!]!
    categoryId: ID
  }

  input UpdateProjectInput {
    title: String
    description: String
    budget: Float
    deadline: String
    skills: [String!]
    status: ProjectStatus
  }

  input UpdateProfileInput {
    name: String
    skills: [String!]
    experience: Int
    bio: String
    hourlyRate: Float
    location: String
    portfolio: [String!]
  }

  # =================================
  # QUERIES & MUTATIONS
  # =================================

  type Query {
    health: String!
    me: User
    myProjectStats: ProjectStats
    lenta: [Project!]
    project(id: ID!): Project
    recommendFreelancers(projectId: ID!): [User!]
    myFavorites: FavoritesPayload!
  }

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # User
    updateUserRole(role: UserRole!): User!
    updateProfile(input: UpdateProfileInput!): User!

    # Favorites
    addToFavorites(itemId: ID!, type: FavoriteType!): User!
    removeFromFavorites(itemId: ID!, type: FavoriteType!): User!

    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    # Reviews
    submitReview(projectId: ID!, rating: Int!, comment: String!): Review!

    # Subscriptions
    createSubscriptionCheckoutSession(tier: String!): String!
  }
`;