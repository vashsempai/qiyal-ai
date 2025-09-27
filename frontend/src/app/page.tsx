"use client";

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOGIN_USER, REGISTER_USER } from '@/lib/mutations';
import { GET_ME, GET_MY_PROJECT_STATS } from '@/lib/queries';
import RoleSelector from '@/components/RoleSelector';
import UserProfileCard from '@/components/UserProfileCard';

const AuthForm = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [login, { loading: loginLoading }] = useMutation(LOGIN_USER, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      setSuccess('Login successful!');
      setError('');
      onLoginSuccess();
    },
    onError: (err) => setError(err.message),
  });

  const [register, { loading: registerLoading }] = useMutation(REGISTER_USER, {
    onCompleted: () => {
      setSuccess('Registration successful! Please log in.');
      setError('');
      setIsLogin(true);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (isLogin) {
      login({ variables: { input: { email, password } } });
    } else {
      register({ variables: { input: { email, password, name } } });
    }
  };

  // The form JSX remains the same as before
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
              <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div>
            <button type="submit" disabled={loginLoading || registerLoading} className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {isLogin ? 'Log In' : 'Register'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLogin(!isLogin)} className="ml-1 font-medium text-indigo-600 hover:text-indigo-500">
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { loading: meLoading, error: meError, data: meData } = useQuery(GET_ME);
  const { loading: statsLoading, error: statsError, data: statsData } = useQuery(GET_MY_PROJECT_STATS, {
    skip: !meData?.me, // Don't run this query until we have the user
  });

  if (meLoading || statsLoading) return <p className="text-center mt-10">Loading dashboard...</p>;
  if (meError || statsError) return <p className="text-center text-red-500 mt-10">Error loading data: {meError?.message || statsError?.message}</p>;
  if (!meData || !meData.me) return <p>No user data found.</p>;

  const user = meData.me;
  const stats = statsData?.myProjectStats;
  const tierMaxProjects = user.subscription?.maxProjects || 3; // Default to FREE tier limit

  return (
    <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <button onClick={onLogout} className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Log Out
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="p-6 bg-white rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            {user.role === 'CLIENT' ? 'Client Workspace' : 'Freelancer Workspace'}
                        </h3>

                        {user.role === 'CLIENT' && stats && (
                            <div className="mb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Active Projects</span>
                                    <span className="text-sm font-medium text-gray-700">{stats.activeProjects} / {tierMaxProjects}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${(stats.activeProjects / tierMaxProjects) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <p>
                            {user.role === 'CLIENT'
                                ? 'Here you can post new projects and manage your existing ones.'
                                : 'Here you can browse for projects and manage your bids.'
                            }
                        </p>
                        <div className="mt-4">
                            <a href={user.role === 'CLIENT' ? '/projects/new' : '/lenta'} className="text-indigo-600 hover:underline">
                                {user.role === 'CLIENT' ? 'Post a New Project' : 'Browse Projects'}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1">
                    <UserProfileCard user={user} />
                </div>
            </div>

            <div className="mt-8">
                <RoleSelector currentRole={user.role} />
            </div>
        </div>
    </div>
  );
};

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default HomePage;