import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import RoleSelector from '../components/RoleSelector';
import { UPDATE_USER_ROLE } from '../lib/mutations';
import { GET_ME } from '../lib/queries';

const mocks = (newRole: 'CLIENT' | 'FREELANCER') => [
  {
    request: {
      query: UPDATE_USER_ROLE,
      variables: { role: newRole },
    },
    result: {
      data: {
        updateUserRole: { id: '1', role: newRole },
      },
    },
  },
  {
    request: {
        query: GET_ME
    },
    result: {
        data: {
            me: {id: '1', role: newRole}
        }
    }
  }
];

describe('RoleSelector', () => {
  it('renders correctly and highlights the current role', () => {
    render(
      <MockedProvider mocks={[]}>
        <RoleSelector currentRole="CLIENT" />
      </MockedProvider>
    );

    const clientButton = screen.getByRole('button', { name: /i'm a client/i });
    const freelancerButton = screen.getByRole('button', { name: /i'm a freelancer/i });

    expect(clientButton).toHaveClass('bg-indigo-600');
    expect(freelancerButton).toHaveClass('bg-gray-200');
  });

  it('calls the update mutation when a new role is selected', async () => {
    const newRole = 'FREELANCER';

    const mutationResultSpy = jest.fn(() => ({
      data: {
        updateUserRole: { id: '1', role: newRole, __typename: 'User' },
      },
    }));

    const mocks = [
      {
        request: {
          query: UPDATE_USER_ROLE,
          variables: { role: newRole },
        },
        result: mutationResultSpy,
      },
      {
        request: { query: GET_ME },
        result: { data: { me: { id: '1', role: newRole, __typename: 'User' } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <RoleSelector currentRole="CLIENT" />
      </MockedProvider>
    );

    const freelancerButton = screen.getByRole('button', { name: /i'm a freelancer/i });
    fireEvent.click(freelancerButton);

    await waitFor(() => {
      expect(mutationResultSpy).toHaveBeenCalled();
    });
  });

  it('does not call mutation if the current role is clicked', () => {
    const mutationMock = {
        request: {
          query: UPDATE_USER_ROLE,
          variables: { role: 'CLIENT' },
        },
        result: jest.fn(),
    };

    render(
      <MockedProvider mocks={[mutationMock]} addTypename={false}>
        <RoleSelector currentRole="CLIENT" />
      </MockedProvider>
    );

    const clientButton = screen.getByRole('button', { name: /i'm a client/i });
    fireEvent.click(clientButton);

    expect(mutationMock.result).not.toHaveBeenCalled();
  });

  it('disables buttons while loading', async () => {
    render(
      <MockedProvider mocks={mocks('FREELANCER')} addTypename={false}>
        <RoleSelector currentRole="CLIENT" />
      </MockedProvider>
    );

    const freelancerButton = screen.getByRole('button', { name: /i'm a freelancer/i });
    fireEvent.click(freelancerButton);

    // Buttons should be disabled immediately after click
    expect(freelancerButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /i'm a client/i })).toBeDisabled();

    // Wait for the mutation to complete
    await waitFor(() => {
        expect(freelancerButton).not.toBeDisabled();
    });
  });
});