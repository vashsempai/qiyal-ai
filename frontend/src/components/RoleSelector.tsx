"use client";

import React from 'react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_USER_ROLE } from '@/lib/mutations';
import { GET_ME } from '@/lib/queries';

type UserRole = 'CLIENT' | 'FREELANCER';

interface RoleSelectorProps {
  currentRole: UserRole;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole }) => {
  const [updateRole, { loading }] = useMutation(UPDATE_USER_ROLE, {
    refetchQueries: [{ query: GET_ME }],
    awaitRefetchQueries: true,
  });

  const handleRoleSelect = (role: UserRole) => {
    if (role !== currentRole) {
      updateRole({ variables: { role } });
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">Choose Your Role</h2>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleRoleSelect('CLIENT')}
          disabled={loading}
          className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 w-48
            ${currentRole === 'CLIENT'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-800 hover:bg-indigo-100'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          I&apos;m a Client
        </button>
        <button
          onClick={() => handleRoleSelect('FREELANCER')}
          disabled={loading}
          className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 w-48
            ${currentRole === 'FREELANCER'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-800 hover:bg-green-100'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          I&apos;m a Freelancer
        </button>
      </div>
      {loading && <p className="text-center mt-4 text-sm text-gray-500">Updating role...</p>}
    </div>
  );
};

export default RoleSelector;