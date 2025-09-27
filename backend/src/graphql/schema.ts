import { gql } from 'graphql-tag';

export const typeDefs = gql`

  # =================================
  # SCALAR & ENUM TYPES
  # =================================

  scalar DateTime


  # Scalar types
  scalar DateTime

  # Enums
  enum MessageRole {
    user
    assistant
  }


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


  }

  # Core Types

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

    xp: Int!
    level: String!
    tokens: Int!
    subscription: SubscriptionTier
    achievements: [UserAchievement!]
    createdAt: DateTime!

  }

  type AuthPayload {
    token: String!
    user: User!
  }


  type Message {
    id: ID!
    content: String!
    role: MessageRole!
    createdAt: DateTime!
  }

  type Conversation {
    id: ID!
    title: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    messages: [Message!]!
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

    canShowInPortfolio: Boolean!
    skills: [String!]!
    owner: User!
    ownerId: ID!
    bids: [Bid!]
    category: Category
    categoryId: ID
  }

  type Freelancer {
    id: ID!
    name: String!
    email: String!
    skills: [String!]!
    experience: Int!
    bio: String!
    hourlyRate: Float!
    location: String
    portfolio: String
    reviews: [Review!]
    projects: [Project!]
  }

  # Dummy types for relationships that might not be fully implemented yet
  type Bid {
    id: ID!
    amount: Float!
    freelancer: Freelancer!

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


  type Category {
    id: ID!
    name: String!
  }

  type ProjectStats {
    activeProjects: Int!
    completedProjects: Int!
  }

  # Input Types

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

  input CreateFreelancerInput {
    name: String!
    email: String!
    skills: [String!]!
    experience: Int!
    bio: String!
    hourlyRate: Float!
    location: String
    portfolio: String
  }

  input UpdateFreelancerInput {

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


    portfolio: String
  }

  # Queries
  type Query {
    # Health check
    health: String!

    # User
    me: User
    myProjectStats: ProjectStats

    # Conversations & Chat
    conversations: [Conversation!]
    conversation(id: ID!): Conversation

    # Projects
    projects: [Project!]
    project(id: ID!): Project

    # Lenta
    lenta: [Project!]

    # Subscriptions
    subscriptionTiers: [SubscriptionTier!]

    # Freelancers
    freelancers: [Freelancer!]
    freelancer(id: ID!): Freelancer
    recommendFreelancers(projectId: ID!): [Freelancer!]
  }

  # Mutations

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


    # Chat
    sendMessage(message: String!, conversationId: ID): Message!
    deleteConversation(id: ID!): Boolean


    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!


    # Reviews
    submitReview(projectId: ID!, rating: Int!, comment: String!): Review!

    # Subscriptions
    createSubscriptionCheckoutSession(tier: String!): String!

    updateProjectPortfolioPermission(projectId: ID!, canShowInPortfolio: Boolean!): Project!
    submitReview(freelancerId: ID!, projectId: ID!, rating: Int!, comment: String!): Review!

    # Subscriptions
    changeSubscription(tier: String!): User!
    createSubscriptionCheckoutSession(tier: String!): String!

    # Freelancers
    createFreelancer(input: CreateFreelancerInput!): Freelancer!
    updateFreelancer(id: ID!, input: UpdateFreelancerInput!): Freelancer!
    deleteFreelancer(id: ID!): Boolean!

  }
`;