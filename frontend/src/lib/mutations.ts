import { gql } from '@apollo/client';

export const REGISTER_USER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
    mutation SendMessage($message: String!, $conversationId: ID) {
        sendMessage(message: $message, conversationId: $conversationId) {
            id
            content
            role
            createdAt
        }
    }
`;

export const SUBMIT_REVIEW = gql`
    mutation SubmitReview($freelancerId: ID!, $projectId: ID!, $rating: Int!, $comment: String!) {
        submitReview(freelancerId: $freelancerId, projectId: $projectId, rating: $rating, comment: $comment) {
            id
            rating
            comment
        }
    }
`;

export const CREATE_SUBSCRIPTION_CHECKOUT_SESSION = gql`
    mutation CreateSubscriptionCheckoutSession($tier: String!) {
        createSubscriptionCheckoutSession(tier: $tier)
    }
`;

export const CHANGE_SUBSCRIPTION = gql`
    mutation ChangeSubscription($tier: String!) {
        changeSubscription(tier: $tier) {
            id
            subscription {
                id
                name
            }
        }
    }
`;

export const UPDATE_USER_ROLE = gql`
    mutation UpdateUserRole($role: UserRole!) {
        updateUserRole(role: $role) {
            id
            role
        }
    }
`;

export const DELETE_CONVERSATION = gql`
    mutation DeleteConversation($id: ID!) {
        deleteConversation(id: $id)
    }
`;

export const UPDATE_PROJECT_PORTFOLIO_PERMISSION = gql`
    mutation UpdateProjectPortfolioPermission($projectId: ID!, $canShowInPortfolio: Boolean!) {
        updateProjectPortfolioPermission(projectId: $projectId, canShowInPortfolio: $canShowInPortfolio) {
            id
            canShowInPortfolio
        }
    }
`;