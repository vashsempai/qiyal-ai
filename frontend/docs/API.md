# Qiyal AI - API Documentation

## Overview

Qiyal AI provides a comprehensive GraphQL API for managing AI-powered conversations and content generation. This API enables seamless integration with frontend applications and third-party services.

## Base URL

```
https://api.qiyal-ai.com/graphql
```

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer YOUR_API_TOKEN
```

## GraphQL Schema

### Queries

#### `getConversation`

Retrieve a conversation by ID.

```graphql
query GetConversation($id: ID!) {
  conversation(id: $id) {
    id
    title
    createdAt
    updatedAt
    messages {
      id
      content
      role
      timestamp
    }
    user {
      id
      name
      email
    }
  }
}
```

**Parameters:**
- `id` (ID, required): The conversation ID

**Response:**
- `conversation`: Conversation object with messages and user information

#### `getConversations`

Retrieve all conversations for the authenticated user.

```graphql
query GetConversations($limit: Int, $offset: Int) {
  conversations(limit: $limit, offset: $offset) {
    id
    title
    createdAt
    updatedAt
    messageCount
  }
}
```

**Parameters:**
- `limit` (Int, optional): Number of conversations to retrieve (default: 50)
- `offset` (Int, optional): Number of conversations to skip (default: 0)

**Response:**
- `conversations`: Array of conversation objects

#### `searchContent`

Search through conversation content.

```graphql
query SearchContent($query: String!, $limit: Int) {
  search(query: $query, limit: $limit) {
    conversations {
      id
      title
      relevance
    }
    messages {
      id
      content
      conversationId
      relevance
    }
  }
}
```

**Parameters:**
- `query` (String, required): Search query
- `limit` (Int, optional): Maximum results to return (default: 20)

### Mutations

#### `createConversation`

Create a new conversation.

```graphql
mutation CreateConversation($input: ConversationInput!) {
  createConversation(input: $input) {
    id
    title
    createdAt
    success
    error
  }
}
```

**Input:**
```graphql
input ConversationInput {
  title: String!
  initialMessage: String
}
```

#### `sendMessage`

Send a message in a conversation.

```graphql
mutation SendMessage($input: MessageInput!) {
  sendMessage(input: $input) {
    message {
      id
      content
      role
      timestamp
    }
    aiResponse {
      id
      content
      timestamp
    }
    success
    error
  }
}
```

**Input:**
```graphql
input MessageInput {
  conversationId: ID!
  content: String!
  role: MessageRole = USER
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

#### `updateConversation`

Update conversation details.

```graphql
mutation UpdateConversation($id: ID!, $input: UpdateConversationInput!) {
  updateConversation(id: $id, input: $input) {
    conversation {
      id
      title
      updatedAt
    }
    success
    error
  }
}
```

**Input:**
```graphql
input UpdateConversationInput {
  title: String
}
```

#### `deleteConversation`

Delete a conversation.

```graphql
mutation DeleteConversation($id: ID!) {
  deleteConversation(id: $id) {
    success
    error
  }
}
```

### Subscriptions

#### `conversationUpdated`

Subscribe to conversation updates.

```graphql
subscription ConversationUpdated($conversationId: ID!) {
  conversationUpdated(conversationId: $conversationId) {
    id
    type
    message {
      id
      content
      role
      timestamp
    }
  }
}
```

## Error Handling

The API uses standard GraphQL error handling. Errors are returned in the `errors` array:

```json
{
  "errors": [
    {
      "message": "Conversation not found",
      "extensions": {
        "code": "NOT_FOUND",
        "field": "id"
      }
    }
  ],
  "data": null
}
```

### Common Error Codes

- `UNAUTHENTICATED`: Invalid or missing authentication token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Requested resource does not exist
- `VALIDATION_ERROR`: Invalid input parameters
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server-side error

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1,000 requests per hour
- **Enterprise Tier**: 10,000 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## WebSocket Connection

For real-time features, connect to the WebSocket endpoint:

```
wss://api.qiyal-ai.com/graphql
```

### Connection Parameters

```javascript
const wsLink = new GraphQLWsLink(createClient({
  url: 'wss://api.qiyal-ai.com/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`,
  },
}));
```

## Client Libraries

### Apollo Client (React)

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'https://api.qiyal-ai.com/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('qiyal-ai-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
```

### Curl Examples

```bash
# Get conversations
curl -X POST \
  https://api.qiyal-ai.com/graphql \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query { conversations { id title createdAt } }"
  }'

# Create conversation
curl -X POST \
  https://api.qiyal-ai.com/graphql \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation($input: ConversationInput!) { createConversation(input: $input) { id title } }",
    "variables": {
      "input": {
        "title": "New Conversation",
        "initialMessage": "Hello, AI!"
      }
    }
  }'
```

## API Versioning

The current API version is `v1`. Version is specified in the URL:

```
https://api.qiyal-ai.com/v1/graphql
```

## Changelog

### v1.2.0 (2024-12-01)
- Added conversation search functionality
- Improved error handling
- Added WebSocket subscriptions

### v1.1.0 (2024-11-15)
- Added conversation management mutations
- Enhanced authentication system
- Added rate limiting

### v1.0.0 (2024-11-01)
- Initial API release
- Basic conversation queries and mutations
- User authentication

## Support

For API support and questions:
- Email: api-support@qiyal-ai.com
- Documentation: https://docs.qiyal-ai.com
- Status Page: https://status.qiyal-ai.com

## SDK and Tools

- [Official TypeScript SDK](https://github.com/qiyal-ai/typescript-sdk)
- [Postman Collection](https://www.postman.com/qiyal-ai/collections)
- [GraphQL Playground](https://api.qiyal-ai.com/playground)

---

*This documentation is automatically updated with each API release.*
