"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_PROJECT_PORTFOLIO_PERMISSION } from '@/lib/mutations';
import { GET_PROJECT_DETAILS } from '@/lib/queries';

interface Props {
  projectId: string;
  initialValue: boolean;
}

const PortfolioPermissionToggle: React.FC<Props> = ({ projectId, initialValue }) => {
  const [isChecked, setIsChecked] = useState(initialValue);
  const [updatePermission, { loading, error }] = useMutation(UPDATE_PROJECT_PORTFOLIO_PERMISSION, {
    // Refetch the project details to update the cache and the UI
    refetchQueries: [{ query: GET_PROJECT_DETAILS, variables: { id: projectId } }],
  });

  const handleChange = async () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    try {
      await updatePermission({
        variables: {
          projectId,
          canShowInPortfolio: newValue,
        },
      });
    } catch (e) {
      console.error("Failed to update permission", e);
      // Revert the state if the mutation fails
      setIsChecked(!newValue);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <label htmlFor="portfolio-toggle" className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            id="portfolio-toggle"
            type="checkbox"
            className="sr-only"
            checked={isChecked}
            onChange={handleChange}
            disabled={loading}
          />
          <div className={`block w-14 h-8 rounded-full ${isChecked ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isChecked ? 'transform translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-gray-700 font-medium">
          Show this project in the public Lenta
        </div>
      </label>
      {loading && <p className="text-sm text-gray-500">Saving...</p>}
      {error && <p className="text-sm text-red-500">Error!</p>}
    </div>
  );
};

export default PortfolioPermissionToggle;