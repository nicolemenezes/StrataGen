// /frontend/src/pages/CampaignCanvasPage.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../services/apiClient';
import { supabase } from '../services/supabaseClient';
import { InfluencerCard } from '@/components/ui/InfluencerCard';
import { AssetCard } from '@/components/ui/AssetCard';

// Define more specific types for our data
interface CampaignData {
  id: string;
  title: string;
  strategy: any;
  tasks: any[];
  assets: any[];
  copies: any[];
  // This is the correct shape from the backend query
  campaign_influencer_tips: any[];
}

const CampaignCanvasPage = () => {
  const { id: campaignId } = useParams();
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [isCommandLoading, setIsCommandLoading] = useState(false);

  const fetchCampaignData = async () => {
    if (!campaignId) return;
    try {
      const response = await apiClient.get<CampaignData>(`/api/campaigns/${campaignId}`);
      setCampaignData(response.data);
    } catch (error) {
      toast.error('Failed to load campaign data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);
  
  // (Your Supabase Realtime useEffect remains the same)

  const handleCommandSubmit = async (e: FormEvent) => {
    // ... (This function is correct, no changes needed)
  };

  if (isLoading) return <div>Loading Campaign Canvas...</div>;
  if (!campaignData) return <div>Campaign not found or you do not have access.</div>;

  // Group assets and copies by day for easy rendering
  const contentByDay = (campaignData.strategy?.days || []).reduce((acc, day) => {
    acc[day.day] = {
      ...day,
      tasks: campaignData.tasks.filter(t => t.meta?.day === day.day),
      assets: campaignData.assets.filter(a => a.metadata?.day === day.day),
      copies: campaignData.copies.filter(c => c.metadata?.day === day.day),
    };
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', padding: '20px 80px', gap: '40px', background: '#f9f9f9' }}>
      {/* Left Column: Content */}
      <div style={{ flex: 2.5 }}>
        <h1>{campaignData.title}</h1>
        {Object.values(contentByDay).map((day: any) => (
          <div key={day.day} style={{ marginBottom: '30px' }}>
            <h2>Day {day.day}: {day.platform} - {day.concept}</h2>
            <AssetCard day={day} />
          </div>
        ))}
      </div>

      {/* Right Column: Influencers & Strategy */}
      <div style={{ flex: 1, position: 'sticky', top: '20px', height: '90vh' }}>
        <h3>Influencers & Tips</h3>
        <div style={{ maxHeight: '40%', overflowY: 'auto', background: 'white', padding: '10px', borderRadius: '8px' }}>
          {/* ✅ FIX: Map over the correct array and access the nested influencer data */}
          {(campaignData.campaign_influencer_tips || []).map(tip => (
            <InfluencerCard key={tip.id} tip={tip} influencer={tip.influencers} />
          ))}
        </div>
        <hr />
        <h3>Strategy Summary</h3>
        {/* ... (strategy summary section) */}
      </div>

      {/* ... (central command bar form) */}
    </div>
  );
};

export default CampaignCanvasPage;