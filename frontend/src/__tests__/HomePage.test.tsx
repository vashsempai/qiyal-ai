import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import HomePage from '../app/page';
import { LOGIN_USER, REGISTER_USER } from '../lib/mutations';
import { GET_ME, GET_MY_PROJECT_STATS } from '../lib/queries';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const getMeMock = {
  request: { query: GET_ME },
  result: {
    data: {
      me: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CLIENT',
        xp: 50,
        level: 5,
        tokens: 100,
        subscription: {
          id: 'sub1',
          name: 'FREE',
          maxProjects: 3,
          __typename: 'SubscriptionTier',
        },
        achievements: [],
        __typename: 'User',
      },
    },
  },
};

const getMyProjectStatsMock = {
    request: { query: GET_MY_PROJECT_STATS },
    result: {
        data: {
            myProjectStats: {
                activeProjects: 2,
                completedProjects: 5,
                __typename: 'ProjectStats'
            }
        }
    }
};


const mocks = [
  {
    request: {
      query: LOGIN_USER,
      variables: {
        input: { email: 'test@example.com', password: 'password123' },
      },
    },
    result: {
      data: {
        login: {
          token: 'mock-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
        },
      },
    },
  },
  {
    request: {
      query: REGISTER_USER,
      variables: {
        input: {
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        },
      },
    },
    result: {
      data: {
        register: {
          token: 'new-mock-token',
          user: { id: '2', email: 'new@example.com', name: 'New User' },
        },
      },
    },
  },
    {
    request: {
      query: LOGIN_USER,
      variables: {
        input: { email: 'fail@example.com', password: 'wrongpassword' },
      },
    },
    error: new Error('Invalid credentials'),
  },
  getMeMock,
  getMyProjectStatsMock,
];

describe('HomePage Authentication Flow', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorageMock.clear();
  });

  it('renders the login form by default', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <HomePage />
      </MockedProvider>
    );
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('allows a user to log in successfully', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <HomePage />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-token');
    });
  });

  it('shows an error message on failed login', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <HomePage />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'fail@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('switches to the registration form', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <HomePage />
      </MockedProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('allows a user to register successfully', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <HomePage />
      </MockedProvider>
    );

    // Switch to register form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Fill out and submit form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration successful! Please log in.')).toBeInTheDocument();
    });

    // Check that it switches back to login form
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('shows logged-in view if token exists in localStorage', async () => {
    localStorageMock.setItem('token', 'some-token');

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <HomePage />
      </MockedProvider>
    );

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/client workspace/i)).toBeInTheDocument();
  });
});