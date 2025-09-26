import { gql } from '@apollo/client';

// =================================================================
// USER & AUTH MUTATIONS
// =================================================================
/**
 * @description Мутация для регистрации нового пользователя.
 * @param {string} email - Email пользователя.
 * @param {string} password - Пароль пользователя.
 * @param {UserType} userType - Тип пользователя (FREELANCER или CLIENT).
 * @returns {id, email, token} - Данные аутентификации.
 */
export const REGISTER_USER = gql`
  mutation RegisterUser($email: String!, $password: String!, $userType: UserType!) {
    register(email: $email, password: $password, userType: $userType) {
      id
      email
      token
    }
  }
`;

/**
 * @description Мутация для входа пользователя в систему.
 * @param {string} email - Email пользователя.
 * @param {string} password - Пароль пользователя.
 * @returns {id, email, token} - Данные аутентификации.
 */
export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
      token
    }
  }
`;

// =================================================================
// FREELANCER PROFILE MUTATIONS
// =================================================================
/**
 * @description Мутация для создания профиля фрилансера.
 * @param {FreelancerProfileInput!} input - Объект с данными для создания профиля.
 */
export const CREATE_FREELANCER_PROFILE = gql`
  mutation CreateFreelancerProfile($input: FreelancerProfileInput!) {
    createFreelancerProfile(input: $input) {
      id
      headline
      bio
      skills
      experienceLevel
      languages
    }
  }
`;

/**
 * @description Мутация для обновления профиля фрилансера.
 * @param {ID!} id - ID профиля для обновления.
 * @param {UpdateFreelancerProfileInput!} input - Объект с обновляемыми данными.
 */
export const UPDATE_FREELANCER_PROFILE = gql`
  mutation UpdateFreelancerProfile($id: ID!, $input: UpdateFreelancerProfileInput!) {
    updateFreelancerProfile(id: $id, input: $input) {
      id
      headline
      bio
      skills
      hourlyRate
      availability
      experienceLevel
      averageRating
      reviewsCount
    }
  }
`;

// =================================================================
// PROJECT BRIEF MUTATIONS
// =================================================================
/**
 * @description Мутация для создания нового проекта (брифа).
 * @param {ProjectBriefInput!} input - Объект с данными для создания проекта.
 */
export const CREATE_PROJECT_BRIEF = gql`
  mutation CreateProjectBrief($input: ProjectBriefInput!) {
    createProjectBrief(input: $input) {
      id
      title
      description
      budget
      deadline
      requiredSkills
      complexity
      industryType
    }
  }
`;

/**
 * @description Мутация для обновления существующего проекта (брифа).
 * @param {ID!} id - ID проекта для обновления.
 * @param {UpdateProjectBriefInput!} input - Объект с обновляемыми данными.
 */
export const UPDATE_PROJECT_BRIEF = gql`
  mutation UpdateProjectBrief($id: ID!, $input: UpdateProjectBriefInput!) {
    updateProjectBrief(id: $id, input: $input) {
      id
      title
      description
      status
      budget
      deadline
      complexity
      communicationPreferences
    }
  }
`;

/**
 * @description Мутация для удаления проекта.
 * @param {ID!} id - ID проекта для удаления.
 */
export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      id
      title
    }
  }
`;


// =================================================================
// TYPESCRIPT TYPES FOR MUTATIONS
// =================================================================
// Примечание: В идеальном сценарии эти типы должны генерироваться автоматически
// из вашей GraphQL-схемы с помощью инструментов вроде GraphQL Code Generator
// для обеспечения 100% безопасности типов. Ниже приведены примеры.
// =================================================================
// ----- User & Auth Types -----
export type UserType = 'FREELANCER' | 'CLIENT';

export interface AuthPayload {
  id: string;
  email: string;
  token: string;
}

export interface RegisterUserData {
  register: AuthPayload;
}

export interface RegisterUserVars {
  email: string;
  password: string;
  userType: UserType;
}

export interface LoginUserData {
  login: AuthPayload;
}

export interface LoginUserVars {
  email: string;
  password: string;
}


// ----- Freelancer Profile Types -----
export type ExperienceLevel = 'JUNIOR' | 'MIDDLE' | 'SENIOR';

interface PortfolioItemInput {
  title: string;
  description?: string;
  url: string;
}

export interface FreelancerProfileInput {
  headline: string;
  bio: string;
  skills: string[];
  portfolio: PortfolioItemInput[];
  hourlyRate?: number;
  availability: boolean;
  experienceLevel: ExperienceLevel;
  languages: string[];
}

export interface UpdateFreelancerProfileInput {
  headline?: string;
  bio?: string;
  skills?: string[];
  portfolio?: PortfolioItemInput[];
  hourlyRate?: number;
  availability?: boolean;
  experienceLevel?: ExperienceLevel;
  languages?: string[];
}

export interface UpdateFreelancerProfileData {
  updateFreelancerProfile: {
    id: string;
  };
}

export interface UpdateFreelancerProfileVars {
  id: string;
  input: UpdateFreelancerProfileInput;
}


// ----- Project Brief Types -----
export type ProjectComplexity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface ProjectBriefInput {
  title: string;
  description: string;
  requiredSkills: string[];
  budget: number;
  deadline: string; // Формат: ISO 8601
  complexity: ProjectComplexity;
  industryType: string;
  communicationPreferences?: string;
}

export interface UpdateProjectBriefInput {
    title?: string;
    description?: string;
    requiredSkills?: string[];
    budget?: number;
    deadline?: string;
    status?: ProjectStatus;
    complexity?: ProjectComplexity;
    industryType?: string;
    communicationPreferences?: string;
}

export interface UpdateProjectBriefData {
  updateProjectBrief: {
    id: string;
  };
}

export interface UpdateProjectBriefVars {
  id: string;
  input: UpdateProjectBriefInput;
}

export interface DeleteProjectData {
  deleteProject: {
    id: string;
    title: string;
  };
}

export interface DeleteProjectVars {
  id: string;
}
