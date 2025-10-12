// /src/pages/CampaignCanvasPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // Assuming you use react-hot-toast for notifications
import apiClient from '../services/apiClient'; // Your pre-configured Axios instance
import { supabase } from '../services/supabaseClient'; // Your initialized Supabase client

// --- 1. DEFINE TYPES AND HELPER FUNCTIONS ---

/**
 * A robust helper function to clean the extra conversational text and formatting
 * from the raw AI-generated content.
 */
const cleanAiContent = (content: string, type: 'caption' | 'blog_title' | 'blog_body'): string => {
  if (!content) return '';

  try {
    if (type === 'caption') {
      const parts = content.split(/---\s*|\*\*Image Caption:\*\*/i);
      const lastPart = parts[parts.length - 1]?.trim();
      if (lastPart) {
        const lines = lastPart.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 1 && lines[0].length < 50 && !lines[0].includes('.')) {
          return lines.slice(1).join('\n\n').trim();
        }
        return lastPart;
      }
    }
    if (type === 'blog_title') {
      const match = content.match(/1\.\s*\*\*(.*?)\*\*/);
      if (match && match[1]) return match[1];
      return content.split('\n')[0].replace(/Here are several compelling, professional blog titles.*?:\s*/i, "").trim();
    }
    if (type === 'blog_body') {
      const headingMatch = content.match(/###\s(.*?)\n/);
      let body = content;
      if (headingMatch && headingMatch.index) {
        body = content.substring(headingMatch.index);
      }
      const finalParts = body.split(/\n---\n#/);
      return finalParts[0].trim();
    }
  } catch (e) { console.error("Error cleaning AI content:", e); }
  return content;
};

// --- Type definitions that match your database schema and backend response ---
interface Influencer { id: string; name: string; profile_url: string; platform: string; }
interface InfluencerTip { id: string; tip: string; influencers: Influencer; } // Assumes backend joins influencers table
interface Asset { id: string; storage_path: string; metadata: { day?: number; platform?: string; }; }
interface Copy { id: string; type: 'caption' | 'blog_title' | 'blog_body'; content: string; metadata: { day?: number; platform?: string; }; }
interface DayPlan { day: number; platform: 'instagram' | 'linkedin'; content_type: 'post' | 'blog post'; concept: string; key: string; assets: Asset[]; copies: Copy[]; }
interface CampaignData { id: string; title: string; strategy: any; assets: Asset[]; copies: Copy[]; campaign_influencer_tips: InfluencerTip[]; }

// --- 2. DEFINE INTERNAL UI COMPONENTS ---

const InstagramPostCard: React.FC<{ asset?: Asset; copy?: Copy }> = ({ asset, copy }) => {
  const imageUrl = asset 
    ? supabase.storage.from('assets').getPublicUrl(asset.storage_path).data.publicUrl 
    : null;

  const cleanedCaption = copy ? cleanAiContent(copy.content, 'caption') : 'Generating caption...';

  return (
    <div className="border rounded-lg overflow-hidden max-w-lg mx-auto bg-white">
      {imageUrl ? (
        <img src={imageUrl} alt="Campaign asset" className="w-full h-auto object-cover bg-gray-100" />
      ) : (
        <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">Generating Image...</p>
        </div>
      )}
      <div className="p-4">
        <p className="text-gray-700 whitespace-pre-wrap text-sm">{cleanedCaption}</p>
      </div>
    </div>
  );
};

const LinkedInBlogCard: React.FC<{ titleCopy?: Copy; bodyCopy?: Copy }> = ({ titleCopy, bodyCopy }) => {
    const cleanedTitle = titleCopy ? cleanAiContent(titleCopy.content, 'blog_title') : 'Generating blog title...';
    const cleanedBody = bodyCopy ? cleanAiContent(bodyCopy.content, 'blog_body') : 'Generating blog content...';
    const formattedBody = cleanedBody.replace(/###\s(.*?)\n/g, '<h3 class="text-xl font-bold my-4">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

    return (
        <div className="border rounded-lg p-5 bg-gray-50">
            <h3 className="text-2xl font-bold text-blue-800 mb-2">{cleanedTitle}</h3>
            <hr className="my-4" />
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formattedBody }} />
        </div>
    );
};

const InfluencerCard: React.FC<{ tip: InfluencerTip }> = ({ tip }) => (
    <div className="bg-gray-50 p-3 rounded-lg border flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-200 to-blue-300 flex-shrink-0"></div>
            <div>
                <p className="font-semibold text-sm text-gray-800">{tip.influencers?.name || 'Unknown Influencer'}</p>
                <a href={tip.influencers?.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    View Profile
                </a>
            </div>
        </div>
        <p className="text-sm text-gray-700">💡 {tip.tip}</p>
    </div>
);

const DayContentCard: React.FC<{ dayData: DayPlan }> = ({ dayData }) => {
    const { day, platform, concept, content_type, assets, copies } = dayData;
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-1"> Day {day}: <span className="capitalize">{platform}</span> </h2>
            <p className="text-md text-gray-600 mb-4 italic" dangerouslySetInnerHTML={{ __html: concept.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            {(platform === 'instagram' || (platform === 'linkedin' && content_type === 'post')) && (
                <InstagramPostCard asset={assets[0]} copy={copies.find(c => c.type === 'caption')} />
            )}
            {(platform === 'linkedin' && content_type === 'blog post') && (
                <LinkedInBlogCard titleCopy={copies.find(c => c.type === 'blog_title')} bodyCopy={copies.find(c => c.type === 'blog_body')} />
            )}
        </div>
    );
};

// --- 3. MAIN PAGE COMPONENT ---

const CampaignCanvasPage = () => {
    const { id: campaignId } = useParams<{ id: string }>();
    const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCampaignData = async () => {
            if (!campaignId) return;

            setIsLoading(true);
            try {
                const response = await apiClient.get<CampaignData>(`/api/campaigns/${campaignId}`);
                setCampaignData(response.data);
            } catch (error) {
                console.error("Failed to fetch campaign data:", error);
                toast.error("Could not load campaign data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaignData();
    }, [campaignId]);

    if (isLoading) {
        return <div className="p-8 text-center">Loading Campaign Canvas...</div>;
    }
    if (!campaignData) {
        return <div className="p-8 text-center text-red-600">Campaign not found or you do not have access.</div>;
    }

    // --- Data Processing Logic ---
    const groupedContent: DayPlan[] = (campaignData.strategy?.days || []).map((dayPlan: any, index: number) => ({
        ...dayPlan,
        key: `day-plan-${index}`,
        assets: campaignData.assets.filter(a => a.metadata?.day === dayPlan.day && a.metadata?.platform === dayPlan.platform),
        copies: campaignData.copies.filter(c => c.metadata?.day === dayPlan.day && c.metadata?.platform === dayPlan.platform),
    }));

    return (
        <div className="flex flex-col lg:flex-row p-4 md:p-8 lg:p-12 gap-10 bg-gray-50 min-h-screen font-sans">
            {/* Left Column: Day-by-day Content */}
            <div className="flex-[2.5] space-y-8">
                <h1 className="text-4xl font-bold text-gray-800">{campaignData.title}</h1>
                {groupedContent.map((dayData) => (
                    <DayContentCard key={dayData.key} dayData={dayData} />
                ))}
            </div>

            {/* Right Column: Influencers Panel */}
            <div className="flex-1">
                <div className="sticky top-8 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Influencers & Tips</h3>
                        <div className="max-h-[60vh] overflow-y-auto bg-white p-4 rounded-lg shadow-sm border space-y-4">
                            {campaignData.campaign_influencer_tips.length > 0 ? (
                                campaignData.campaign_influencer_tips.map(tip => (
                                    <InfluencerCard key={tip.id} tip={tip} />
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No influencer tips for this campaign yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignCanvasPage;