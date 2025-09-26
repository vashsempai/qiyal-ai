import { gql } from '@apollo/client';

// Query for fetching user profile
export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
      name
      email
      avatar
      createdAt
      updatedAt
    }
  }
`;

// Query for fetching all users
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      name
      email
      avatar
      isActive
    }
  }
`;

// Query for fetching posts
export const GET_POSTS = gql`
  query GetPosts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
      id
      title
      content
      author {
        id
        name
      }
      createdAt
      updatedAt
      likes
      comments {
        id
        content
        author {
          id
          name
        }
        createdAt
      }
    }
  }
`;

// Query for fetching a single post
export const GET_POST_BY_ID = gql`
  query GetPostById($postId: ID!) {
    post(id: $postId) {
      id
      title
      content
      author {
        id
        name
        avatar
      }
      createdAt
      updatedAt
      likes
      comments {
        id
        content
        author {
          id
          name
          avatar
        }
        createdAt
      }
    }
  }
`;

// Mutation for creating a new post
export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      author {
        id
        name
      }
      createdAt
    }
  }
`;

// Mutation for updating a post
export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      content
      updatedAt
    }
  }
`;

// Mutation for deleting a post
export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success
      message
    }
  }
`;

// Mutation for user authentication
export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

// Mutation for user registration
export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

// Subscription for real-time updates
export const POST_CREATED_SUBSCRIPTION = gql`
  subscription PostCreated {
    postCreated {
      id
      title
      content
      author {
        id
        name
      }
      createdAt
    }
  }
`;
