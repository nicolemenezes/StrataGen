// /frontend/src/components/cards/InstagramPostCard.tsx

import React from 'react';

const supabase = {
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
} as any; // TODO: restore Supabase storage wiring after the client is reintroduced.

interface CardProps {
  asset?: { storage_path: string };
  copy?: { content: string };
}

export const InstagramPostCard: React.FC<CardProps> = ({ asset, copy }) => {
  // Construct the public URL for the image from Supabase Storage
  const imageUrl = asset 
    ? supabase.storage.from('assets').getPublicUrl(asset.storage_path).data.publicUrl 
    : null;

  return (
    <div className="border rounded-lg overflow-hidden max-w-lg mx-auto">
      {imageUrl ? (
        <img src={imageUrl} alt="Campaign asset" className="w-full h-auto object-cover" />
      ) : (
        <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">Generating Image...</p>
        </div>
      )}
      <div className="p-4 bg-gray-50">
        <p className="text-gray-700 whitespace-pre-wrap">
          {copy?.content || 'Generating caption...'}
        </p>
      </div>
    </div>
  );
};