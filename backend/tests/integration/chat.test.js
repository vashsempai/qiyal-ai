import { io as Client } from 'socket.io-client';
import { jest, describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import { server } from '../../server.js';
import { db } from '../../src/utils/database.js';

// Mock ioredis to prevent Redis connection errors in tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Mock Sentry to prevent initialization errors in tests
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
}));

// Mock the database to prevent actual DB calls
jest.mock('../../src/utils/database.js');

describe('Chat Socket.io API', () => {
  let clientSocket;
  const PORT = process.env.PORT || 5000; // Ensure it matches the server's port

  beforeAll((done) => {
    // The server is already started by Jest's import of `server.js`.
    // We just need to connect our client.
    const serverAddress = `http://localhost:${PORT}`;
    clientSocket = Client(serverAddress);
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    // Disconnect the client and close the server
    clientSocket.close();
    server.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    db.query.mockReset();
  });

  describe('on:send_message', () => {
    it('should receive a "new_message" event after sending a message', (done) => {
      // --- Arrange ---
      const conversationId = 'convo-123';
      const messageData = {
        senderId: 'user-abc',
        conversationId: conversationId,
        content: 'Hello, world!',
      };

      // Mock the database response for ChatService.sendMessage
      db.query.mockResolvedValue({ rows: [{ ...messageData, id: 'msg-456' }] });

      // --- Act ---
      // Join the conversation room first
      clientSocket.emit('join_conversation', conversationId);

      // Listen for the broadcasted message
      clientSocket.on('new_message', (receivedMessage) => {
        // --- Assert ---
        expect(receivedMessage.content).toBe(messageData.content);
        expect(receivedMessage.id).toBe('msg-456');
        done(); // End the test
      });

      // Send the message
      clientSocket.emit('send_message', messageData);
    });

    it('should receive an error event if message sending fails', (done) => {
        // --- Arrange ---
        const conversationId = 'convo-failing';
        const messageData = { senderId: 'user-abc', conversationId, content: 'This will fail.' };

        // Mock a database error
        db.query.mockRejectedValue(new Error('Database error'));

        // --- Act ---
        clientSocket.emit('join_conversation', conversationId);

        // Listen for the error
        clientSocket.on('error', (errorMessage) => {
          // --- Assert ---
          expect(errorMessage).toBe('Database error');
          done();
        });

        clientSocket.emit('send_message', messageData);
      });
  });
});
