// /frontend/src/components/cards/LinkedInBlogCard.tsx

import React from 'react';

interface CardProps {
  titleCopy?: { content: string };
  bodyCopy?: { content:string };
}

export const LinkedInBlogCard: React.FC<CardProps> = ({ titleCopy, bodyCopy }) => {
  return (
    <div className="border rounded-lg p-5 bg-gray-50">
      <h3 className="text-xl font-semibold text-blue-800 mb-2">
        {titleCopy?.content || 'Generating blog title...'}
      </h3>
      <hr className="mb-3" />
      <p className="text-gray-800 whitespace-pre-wrap">
        {bodyCopy?.content || 'Generating blog content...'}
      </p>
    </div>
  );
};