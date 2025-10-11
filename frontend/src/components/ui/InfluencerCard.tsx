import React from 'react';

export const InfluencerCard = ({ tip, influencer }) => {
  if (!influencer) return null; // Don't render if influencer data is missing

  return (
    <div style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
      <a href={influencer.profile_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', textDecoration: 'none' }}>
        {influencer.name}
      </a>
      <p style={{ fontSize: '14px', margin: '4px 0', color: '#666' }}>{influencer.notes}</p>
      {tip.tip && <p style={{ fontSize: '14px', fontStyle: 'italic', margin: '4px 0' }}><strong>Tip:</strong> {tip.tip}</p>}
    </div>
  );
};