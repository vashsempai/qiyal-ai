import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import Chatbot from '../components/Chatbot';
import { SEND_MESSAGE } from '../lib/mutations';

const mocks = [
  {
    request: {
      query: SEND_MESSAGE,
      variables: { message: 'Hello', conversationId: null },
    },
    result: {
      data: {
        sendMessage: {
          role: 'assistant',
          content: 'Hi there!',
        },
      },
    },
  },
];

describe('Chatbot', () => {
  beforeAll(() => {
    // Mock scrollIntoView as it is not implemented in JSDOM
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('renders the floating action button by default', () => {
    render(
      <MockedProvider mocks={[]}>
        <Chatbot />
      </MockedProvider>
    );
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ask something/i)).not.toBeInTheDocument();
  });

  it('opens the chat window when the button is clicked', () => {
    render(
      <MockedProvider mocks={[]}>
        <Chatbot />
      </MockedProvider>
    );

    const openButton = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(openButton);

    expect(screen.getByPlaceholderText(/ask something/i)).toBeInTheDocument();
    expect(screen.getByText(/qiyal ai assistant/i)).toBeInTheDocument();
  });

  it('allows a user to send a message and displays the response', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Chatbot />
      </MockedProvider>
    );

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }));

    // Send a message
    const input = screen.getByPlaceholderText(/ask something/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // User message should appear immediately
    expect(await screen.findByText('Hello')).toBeInTheDocument();

    // Assistant response should appear after the mutation completes
    expect(await screen.findByText('Hi there!')).toBeInTheDocument();
  });

  it('closes the chat window when the close button is clicked', () => {
    render(
      <MockedProvider mocks={[]}>
        <Chatbot />
      </MockedProvider>
    );

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /open chat/i }));
    expect(screen.getByText(/qiyal ai assistant/i)).toBeInTheDocument();

    // Close chat
    const closeButton = screen.getByRole('button', { name: /close chat/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText(/qiyal ai assistant/i)).not.toBeInTheDocument();
  });
});
