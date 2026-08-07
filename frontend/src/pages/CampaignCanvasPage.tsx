// /frontend/src/pages/CampaignCanvasPage.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCampaignById, updateCampaignCopy, sendCampaignCommand } from '../services/api/campaignApi';
import { getImageUrl } from '../services/api/imageApi';

// --- 1. DEFINE TYPES AND HELPER FUNCTIONS ---

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
      if (headingMatch && headingMatch.index) { body = content.substring(headingMatch.index); }
      const finalParts = body.split(/\n---\n#/);
      return finalParts[0].trim();
    }
  } catch (e) { console.error("Error cleaning AI content:", e); }
  return content;
};

// --- Type definitions ---
interface Influencer { id: string; name: string; profile_url: string; platform: string; }
interface InfluencerTip { id: string; tip: string; influencers: Influencer; }
// ✅ Added created_at for sorting regenerated assets/copies
interface Asset { id: string; storage_path: string; metadata: { day?: number; platform?: string; }; created_at: string; }
interface Copy { id: string; type: 'caption' | 'blog_title' | 'blog_body'; content: string; metadata: { day?: number; platform?: string; }; created_at: string; }
interface DayPlan { day: number; platform: 'instagram' | 'linkedin'; content_type: 'post' | 'blog post'; concept: string; key: string; assets: Asset[]; copies: Copy[]; }
interface CampaignData { id: string; title: string; strategy: any; assets: Asset[]; copies: Copy[]; campaign_influencer_tips: InfluencerTip[]; }


// --- 2. DEFINE INTERNAL UI COMPONENTS (WITH EDITING CAPABILITIES) ---

const InstagramPostCard: React.FC<{ asset?: Asset; copy?: Copy; onUpdate: (copyId: string, newContent: string) => Promise<void>; }> = ({ asset, copy, onUpdate }) => {
  const imageUrl = asset ? getImageUrl(asset.storage_path) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(copy?.content || '');

  // Update local state if the copy prop changes from the parent
  useEffect(() => {
    setEditedContent(copy?.content || '');
  }, [copy]);

  const handleSave = () => {
    if (!copy || !copy.id) {
        toast.error("Cannot save: No content record exists yet.");
        return;
    }
    onUpdate(copy.id, editedContent).then(() => setIsEditing(false));
  };
  
  const cleanedCaption = copy ? cleanAiContent(copy.content, 'caption') : 'Generating caption...';

  return (
    <div className="border rounded-lg overflow-hidden max-w-lg mx-auto bg-white">
      {imageUrl ? (
        <img src={imageUrl} alt="Campaign asset" className="w-full h-auto object-cover bg-gray-100" />
      ) : (
        <div className="w-full h-80 bg-gray-200 flex items-center justify-center"><p className="text-gray-500">Generating Image...</p></div>
      )}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full p-2 border rounded-md text-sm" rows={8}/>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold">Save</button>
              <button onClick={() => setIsEditing(false)} className="bg-gray-200 px-3 py-1 rounded-md text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap text-sm p-2 rounded-md hover:bg-gray-100 cursor-pointer" onClick={() => setIsEditing(true)}>
            {cleanedCaption}
          </p>
        )}
      </div>
    </div>
  );
};

const LinkedInBlogCard: React.FC<{ titleCopy?: Copy; bodyCopy?: Copy; onUpdate: (copyId: string, newContent: string) => Promise<void>; }> = ({ titleCopy, bodyCopy, onUpdate }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(titleCopy?.content || '');
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [editedBody, setEditedBody] = useState(bodyCopy?.content || '');

    useEffect(() => { setEditedTitle(titleCopy?.content || ''); }, [titleCopy]);
    useEffect(() => { setEditedBody(bodyCopy?.content || ''); }, [bodyCopy]);

    const handleSaveTitle = () => { if (titleCopy?.id) onUpdate(titleCopy.id, editedTitle).then(() => setIsEditingTitle(false)); else toast.error("Cannot save title."); };
    const handleSaveBody = () => { if (bodyCopy?.id) onUpdate(bodyCopy.id, editedBody).then(() => setIsEditingBody(false)); else toast.error("Cannot save body."); };
    
    const cleanedTitle = titleCopy ? cleanAiContent(titleCopy.content, 'blog_title') : 'Generating blog title...';
    const cleanedBody = bodyCopy ? cleanAiContent(bodyCopy.content, 'blog_body') : 'Generating blog content...';
    const formattedBody = cleanedBody.replace(/###\s(.*?)\n/g, '<h3 class="text-xl font-bold my-4">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

    return (
        <div className="border rounded-lg p-5 bg-gray-50 space-y-4">
            <div>
                {isEditingTitle ? (
                    <div className="space-y-2">
                        <textarea value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="w-full p-2 border rounded-md text-2xl font-bold" rows={2}/>
                        <div className="flex gap-2"><button onClick={handleSaveTitle} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold">Save</button><button onClick={() => setIsEditingTitle(false)} className="bg-gray-200 px-3 py-1 rounded-md text-sm">Cancel</button></div>
                    </div>
                ) : ( <h3 className="text-2xl font-bold text-blue-800 p-1 rounded-md hover:bg-gray-200 cursor-pointer" onClick={() => setIsEditingTitle(true)}>{cleanedTitle}</h3> )}
            </div>
            <hr />
            <div>
                {isEditingBody ? (
                    <div className="space-y-2">
                        <textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)} className="w-full p-2 border rounded-md" rows={15}/>
                        <div className="flex gap-2"><button onClick={handleSaveBody} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold">Save</button><button onClick={() => setIsEditingBody(false)} className="bg-gray-200 px-3 py-1 rounded-md text-sm">Cancel</button></div>
                    </div>
                ) : ( <div className="prose prose-sm max-w-none p-1 rounded-md hover:bg-gray-200 cursor-pointer" onClick={() => setIsEditingBody(true)} dangerouslySetInnerHTML={{ __html: formattedBody }} /> )}
            </div>
        </div>
    );
};

const InfluencerCard: React.FC<{ tip: InfluencerTip }> = ({ tip }) => (
    <div className="bg-gray-50 p-3 rounded-lg border flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-200 to-blue-300 flex-shrink-0"></div>
            <div>
                <p className="font-semibold text-sm text-gray-800">{tip.influencers?.name || 'Unknown Influencer'}</p>
                <a href={tip.influencers?.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Profile</a>
            </div>
        </div>
        <p className="text-sm text-gray-700">💡 {tip.tip}</p>
    </div>
);

const StrategySummaryCard: React.FC<{ strategy: any }> = ({ strategy }) => {
  if (!strategy) return null;
  const renderItem = (label: string, value?: string | string[]) => {
    if (!value || value.length === 0) return null;
    return (
      <div>
        <h4 className="font-semibold text-gray-700 text-sm">{label}</h4>
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-2 mt-1">{value.map(item => (<span key={item} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">{item}</span>))}</div>
        ) : (<p className="text-gray-600 text-sm">{value}</p>)}
      </div>
    );
  };
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">Strategy Summary</h3>
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        {renderItem("Theme", strategy.theme)}
        {renderItem("Brand Tone", strategy.brand_tone)}
        {renderItem("Hashtags", strategy.hashtags)}
        {renderItem("Posting Schedule", strategy.posting_schedule)}
      </div>
    </div>
  );
};

const DayContentCard: React.FC<{ dayData: DayPlan; onContentUpdate: (copyId: string, newContent: string) => Promise<void>; }> = ({ dayData, onContentUpdate }) => {
    const { day, platform, concept, content_type, assets, copies } = dayData;
    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-1"> Day {day}: <span className="capitalize">{platform}</span> </h2>
            <p className="text-md text-gray-600 mb-4 italic" dangerouslySetInnerHTML={{ __html: concept.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            {(platform === 'instagram' || (platform === 'linkedin' && content_type === 'post')) && (
                <InstagramPostCard asset={assets[0]} copy={copies.find(c => c.type === 'caption')} onUpdate={onContentUpdate} />
            )}
            {(platform === 'linkedin' && content_type === 'blog post') && (
                <LinkedInBlogCard titleCopy={copies.find(c => c.type === 'blog_title')} bodyCopy={copies.find(c => c.type === 'blog_body')} onUpdate={onContentUpdate} />
            )}
        </div>
    );
};


// --- 3. MAIN PAGE COMPONENT ---

const CampaignCanvasPage = () => {
    const { id: campaignId } = useParams<{ id: string }>();
    const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [commandInput, setCommandInput] = useState('');
    const [isCommandLoading, setIsCommandLoading] = useState(false);

    const fetchCampaignData = async () => {
        if (!campaignId) return;
        try {
        const response = await getCampaignById(campaignId);
            setCampaignData(response.data.data.campaign);
        } catch (error) {
            toast.error("Could not load campaign data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchCampaignData();

      return () => undefined;
    }, [campaignId]);

    const handleContentUpdate = async (copyId: string, newContent: string) => {
        try {
        await updateCampaignCopy(copyId, newContent);
            toast.success("Content saved!");
            setCampaignData(prev => prev ? ({ ...prev, copies: prev.copies.map(c => c.id === copyId ? { ...c, content: newContent } : c) }) : null);
        } catch (error) {
            toast.error("Failed to save content.");
            fetchCampaignData();
        }
    };

    const handleCommandSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!commandInput.trim() || !campaignId) return;
        setIsCommandLoading(true);
        try {
          await sendCampaignCommand(campaignId, commandInput);
            toast.success('Regeneration task is queued! The canvas will update automatically.');
            setCommandInput('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process command.");
        } finally {
            setIsCommandLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading Campaign Canvas...</div>;
    if (!campaignData) return <div className="p-8 text-center text-red-600">Campaign not found or access denied.</div>;

    // ✅ FIX: This logic now correctly displays the most recent regenerated image.
    const groupedContent: DayPlan[] = (campaignData.strategy?.days || []).map((dayPlan: any, index: number) => {
        const dayAssets = campaignData.assets.filter(a => a.metadata?.day === dayPlan.day && a.metadata?.platform === dayPlan.platform)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const dayCopies = campaignData.copies.filter(c => c.metadata?.day === dayPlan.day && c.metadata?.platform === dayPlan.platform)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return {
            ...dayPlan,
            key: `day-plan-${index}`,
            assets: dayAssets.length > 0 ? [dayAssets[0]] : [],
            copies: dayCopies,
        };
    });

    return (
        <div className="flex flex-col lg:flex-row p-4 md:p-8 lg:p-12 gap-10 bg-gray-50 min-h-screen font-sans pb-32">
            <div className="flex-[2.5] space-y-8">
                <h1 className="text-4xl font-bold text-gray-800">{campaignData.title}</h1>
                {groupedContent.map((dayData) => (
                    <DayContentCard key={dayData.key} dayData={dayData} onContentUpdate={handleContentUpdate} />
                ))}
            </div>
            <div className="flex-1">
                <div className="sticky top-8 space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Influencers & Tips</h3>
                        <div className="max-h-[40vh] overflow-y-auto bg-white p-4 rounded-lg shadow-sm border space-y-4">
                            {campaignData.campaign_influencer_tips.length > 0 ? (
                                campaignData.campaign_influencer_tips.map(tip => <InfluencerCard key={tip.id} tip={tip} />)
                            ) : (
                                <p className="text-gray-500 text-sm">No influencer tips yet.</p>
                            )}
                        </div>
                    </div>
                    <StrategySummaryCard strategy={campaignData.strategy} />
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 to-transparent p-4 flex justify-center">
                 <form onSubmit={handleCommandSubmit} className="relative w-full max-w-3xl">
                    <input
                        type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)}
                        placeholder="e.g., Change the image for day 2 to be more minimalist..."
                        className="w-full p-4 pr-28 rounded-full shadow-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        disabled={isCommandLoading}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white font-semibold rounded-full px-6 py-2.5 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        disabled={isCommandLoading || !commandInput.trim()}>
                        {isCommandLoading ? 'Working...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CampaignCanvasPage;
