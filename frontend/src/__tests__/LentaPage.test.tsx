import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import LentaPage from '../app/lenta/page';
import { GET_LENTA_FEED } from '../lib/queries';

const mocks = [
  {
    request: {
      query: GET_LENTA_FEED,
    },
    result: {
      data: {
        lenta: [
          { id: '1', title: 'Test Project 1', description: 'Desc 1', skills: ['React'], budget: 1000, owner: { name: 'Client A' } },
          { id: '2', title: 'Test Project 2', description: 'Desc 2', skills: ['Node'], budget: 2000, owner: { name: 'Client B' } },
        ],
      },
    },
  },
];

const errorMock = [
    {
      request: {
        query: GET_LENTA_FEED,
      },
      error: new Error('An error occurred'),
    },
];

const emptyMock = [
    {
        request: {
          query: GET_LENTA_FEED,
        },
        result: {
          data: {
            lenta: [],
          },
        },
      },
];

describe('LentaPage', () => {
  it('renders loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <LentaPage />
      </MockedProvider>
    );
    expect(screen.getByText(/loading feed/i)).toBeInTheDocument();
  });

  it('renders an error message if the query fails', async () => {
    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <LentaPage />
      </MockedProvider>
    );
    expect(await screen.findByText(/error loading feed/i)).toBeInTheDocument();
  });

  it('renders a list of projects on successful query', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <LentaPage />
      </MockedProvider>
    );
    expect(await screen.findByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('renders a message when no projects are available', async () => {
    render(
        <MockedProvider mocks={emptyMock} addTypename={false}>
          <LentaPage />
        </MockedProvider>
    );
    expect(await screen.findByText(/no projects to display yet/i)).toBeInTheDocument();
  });
});