// /frontend/src/components/cards/DayContentCard.tsx

import React from 'react';
import { InstagramPostCard } from './InstagramPostCard';
import { LinkedInBlogCard } from './LinkedInBlogCard';

// Define types based on what contentByDay provides
interface DayData {
  day: number;
  // 👇 Allow 'post' for LinkedIn
  platform: 'instagram' | 'linkedin';
  content_type: 'post' | 'blog post';
  concept: string;
  assets: any[];
  copies: any[];
}

interface DayContentCardProps {
  day: DayData;
}

export const DayContentCard: React.FC<DayContentCardProps> = ({ day }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">
        Day {day.day}: <span className="capitalize">{day.platform}</span>
      </h2>
      <p className="text-md text-gray-600 mb-4 italic">"{day.concept}"</p>

      {/* --- START: UPDATED LOGIC --- */}

      {/* Renders an Instagram post OR a simple LinkedIn post */}
      {(day.platform === 'instagram' || (day.platform === 'linkedin' && day.content_type === 'post')) && (
        <InstagramPostCard
          asset={day.assets[0]}
          copy={day.copies.find(c => c.type === 'caption')}
        />
      )}

      {/* Renders a LinkedIn blog post */}
      {day.platform === 'linkedin' && day.content_type === 'blog post' && (
        <LinkedInBlogCard
          titleCopy={day.copies.find(c => c.type === 'blog_title')}
          bodyCopy={day.copies.find(c => c.type === 'blog_body')}
        />
      )}
      
      {/* --- END: UPDATED LOGIC --- */}
    </div>
  );
};