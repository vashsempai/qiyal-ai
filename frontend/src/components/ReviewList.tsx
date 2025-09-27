"use client";

import React from 'react';

interface Review {
  rating: number;
  comment: string;
  reviewerId: string; // In a real app, you'd fetch the reviewer's name
  createdAt: string;
}

interface Props {
  reviews: Review[];
}

const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.958c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.175 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.24 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
    </svg>
);

const ReviewList: React.FC<Props> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-500">No reviews yet.</p>;
  }

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-4">Reviews</h3>
      <div className="flex items-center mb-6">
        <span className="text-3xl font-bold mr-2">{averageRating.toFixed(1)}</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= averageRating} />
          ))}
        </div>
        <span className="text-gray-600 ml-2">({reviews.length} reviews)</span>
      </div>
      <div className="space-y-6">
        {reviews.map((review, index) => (
          <div key={index} className="border-t pt-4">
            <div className="flex items-center mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= review.rating} />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
            {/* In a real app, you would fetch and display the reviewer's name */}
            <p className="text-sm text-gray-500 mt-2 text-right">- Reviewer {review.reviewerId.substring(0, 6)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;