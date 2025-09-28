import { gql } from '@apollo/client';

export const GET_LENTA_FEED = gql`
  query GetLentaFeed {
    lenta {
      id
      title
      description
      skills
      budget
      owner {
        id
        name
      }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      email
      name
      role
      xp
      level
      tokens
      subscription {
        id
        name
        maxProjects
      }
      achievements {
        createdAt
        achievement {
          id
          name
          description
          icon
        }
      }
    }
  }
`;

export const GET_PROJECT_DETAILS = gql`
    query Project($id: ID!) {
        project(id: $id) {
            id
            title
            description
            budget
            deadline
            status
            canShowInPortfolio
            skills
            owner {
                id
                name
            }
            review {
                id
            }
        }
    }
`;

export const GET_MY_PROJECT_STATS = gql`
    query MyProjectStats {
        myProjectStats {
            activeProjects
            completedProjects
        }
    }
`;

export const GET_SUBSCRIPTION_TIERS = gql`
    query SubscriptionTiers {
        subscriptionTiers {
            id
            name
            maxProjects
            maxResponses
            maxPortfolioItems
            chatMessagesPerDay
        }
    }
`;