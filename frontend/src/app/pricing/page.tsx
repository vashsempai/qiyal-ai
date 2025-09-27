"use client";

import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUBSCRIPTION_TIERS, GET_ME } from '@/lib/queries';
import { CHANGE_SUBSCRIPTION, CREATE_SUBSCRIPTION_CHECKOUT_SESSION } from '@/lib/mutations';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe.js with your publishable key.
// Make sure to set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PricingPage = () => {
  const { loading: tiersLoading, error: tiersError, data: tiersData } = useQuery(GET_SUBSCRIPTION_TIERS);
  const { data: meData } = useQuery(GET_ME);

  const [changeSubscription, { loading: changeLoading, error: changeError }] = useMutation(CHANGE_SUBSCRIPTION, {
    refetchQueries: [{ query: GET_ME }],
  });

  const [createCheckoutSession, { loading: checkoutLoading, error: checkoutError }] = useMutation(CREATE_SUBSCRIPTION_CHECKOUT_SESSION, {
      onCompleted: (data) => {
          if (data.createSubscriptionCheckoutSession) {
              window.location.href = data.createSubscriptionCheckoutSession;
          }
      },
      onError: (err) => {
          console.error("Stripe session creation failed:", err);
      }
  });

  const handleSelectTier = (tierName: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    const currentTier = meData?.me?.subscription?.name || 'FREE';
    if (tierName === currentTier) return;

    if (tierName === 'FREE') {
      changeSubscription({ variables: { tier: tierName } });
    } else {
      createCheckoutSession({ variables: { tier: tierName } });
    }
  };

  if (tiersLoading) return <p className="text-center mt-10">Loading pricing plans...</p>;
  if (tiersError) return <p className="text-center text-red-500 mt-10">Error loading plans: {tiersError.message}</p>;

  const tiers = tiersData?.subscriptionTiers || [];
  const currentTierName = meData?.me?.subscription?.name || 'FREE';
  const isLoading = changeLoading || checkoutLoading;

  return (
    <div className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier: any) => (
            <div key={tier.id} className={`p-8 bg-white rounded-lg shadow-lg text-center ${tier.name === currentTierName ? 'border-2 border-indigo-600' : ''}`}>
              <h2 className="text-2xl font-bold mb-4">{tier.name}</h2>
              <p className="text-5xl font-bold mb-6">${tier.name === 'FREE' ? 0 : (tier.name === 'PRO' ? 29 : 99)}<span className="text-lg">/mo</span></p>
              <ul className="text-left space-y-3 mb-8">
                <li>✅ {tier.maxProjects} Active Projects</li>
                <li>✅ {tier.maxResponses} Monthly Responses</li>
                <li>✅ {tier.maxPortfolioItems} Portfolio Items</li>
                <li>✅ {tier.chatMessagesPerDay} Daily Chat Messages</li>
              </ul>
              <button
                onClick={() => handleSelectTier(tier.name)}
                disabled={isLoading || tier.name === currentTierName}
                className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tier.name === currentTierName ? 'Current Plan' : (tier.name === 'FREE' ? 'Downgrade' : 'Upgrade')}
              </button>
            </div>
          ))}
        </div>
        {(changeError || checkoutError) && <p className="text-center text-red-500 mt-4">Error: {changeError?.message || checkoutError?.message}</p>}
      </div>
    </div>
  );
};

export default PricingPage;