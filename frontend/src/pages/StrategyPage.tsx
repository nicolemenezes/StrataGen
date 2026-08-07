import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCampaignById, updateCampaignById } from '../services/api/campaignApi';
import { generateCampaign, refineCampaignPlan } from '../services/api/aiApi';

interface CampaignPlan {
  campaignName?: string;
  campaignSummary?: string;
  targetAudience?: string;
  brandTone?: string;
  marketingGoals?: string[];
  contentCalendar?: Array<Record<string, unknown>>;
  captions?: Array<Record<string, unknown>>;
  hashtags?: string[];
  imagePrompts?: string[];
}

interface CampaignRecord {
  _id: string;
  title: string;
  companyName: string;
  industry?: string;
  description?: string;
  targetAudience: string;
  campaignGoal?: string;
  platforms?: string[];
  budget?: number;
  status: 'Draft' | 'Generating' | 'Ready' | 'Scheduled' | 'Published';
  createdAt: string;
  sourcePrompt?: string;
  aiOutput?: CampaignPlan;
}

interface WorkspaceDraft {
  campaignName: string;
  summary: string;
  targetAudience: string;
  brandTone: string;
  marketingGoals: string[];
  contentCalendar: Array<{ day: string; platform: string; contentType: string; focus: string; goal: string }>;
  captions: Array<{ platform: string; contentType: string; caption: string }>;
  hashtags: string[];
}

const emptyDraft = (): WorkspaceDraft => ({
  campaignName: '',
  summary: '',
  targetAudience: '',
  brandTone: '',
  marketingGoals: [],
  contentCalendar: [],
  captions: [],
  hashtags: [],
});

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

const asObjectArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return 'n/a';
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const normalizeCampaignPlan = (campaign: CampaignRecord | null): WorkspaceDraft => {
  if (!campaign) {
    return emptyDraft();
  }

  const plan = campaign.aiOutput ?? {};

  return {
    campaignName: asString(plan.campaignName) || campaign.title || '',
    summary: asString(plan.campaignSummary) || campaign.description || '',
    targetAudience: asString(plan.targetAudience) || campaign.targetAudience || '',
    brandTone: asString(plan.brandTone),
    marketingGoals: asStringArray(plan.marketingGoals),
    contentCalendar: asObjectArray(plan.contentCalendar).map((item) => ({
      day: asString(item.day),
      platform: asString(item.platform),
      contentType: asString(item.contentType),
      focus: asString(item.focus),
      goal: asString(item.goal),
    })),
    captions: asObjectArray(plan.captions).map((item) => ({
      platform: asString(item.platform),
      contentType: asString(item.contentType),
      caption: asString(item.caption),
    })),
    hashtags: asStringArray(plan.hashtags),
  };
};

const normalizeCampaignSnapshot = (campaign: CampaignRecord, draft: WorkspaceDraft) => ({
  ...campaign,
  aiOutput: {
    campaignName: draft.campaignName || campaign.title,
    campaignSummary: draft.summary || campaign.description || campaign.sourcePrompt || 'Generated campaign',
    targetAudience: draft.targetAudience || campaign.targetAudience,
    brandTone: draft.brandTone || '',
    marketingGoals: draft.marketingGoals,
    contentCalendar: draft.contentCalendar,
    captions: draft.captions,
    hashtags: draft.hashtags,
    imagePrompts: asStringArray(campaign.aiOutput?.imagePrompts),
  },
});

const buildUpdatePayload = (campaign: CampaignRecord, draft: WorkspaceDraft) => ({
  title: draft.campaignName || campaign.title,
  companyName: campaign.companyName,
  industry: campaign.industry || 'General',
  description: draft.summary || campaign.description || campaign.sourcePrompt || 'Generated campaign',
  targetAudience: draft.targetAudience || campaign.targetAudience,
  campaignGoal: campaign.campaignGoal || draft.summary || campaign.description || 'Generate awareness',
  platforms: campaign.platforms && campaign.platforms.length > 0 ? campaign.platforms : ['General'],
  budget: typeof campaign.budget === 'number' ? campaign.budget : 0,
  status: campaign.status,
  sourcePrompt: campaign.sourcePrompt || draft.summary || campaign.description || '',
  aiOutput: {
    campaignName: draft.campaignName || campaign.title,
    campaignSummary: draft.summary || campaign.description || campaign.sourcePrompt || 'Generated campaign',
    targetAudience: draft.targetAudience || campaign.targetAudience,
    brandTone: draft.brandTone || '',
    marketingGoals: draft.marketingGoals,
    contentCalendar: draft.contentCalendar,
    captions: draft.captions,
    hashtags: draft.hashtags,
    imagePrompts: asStringArray(campaign.aiOutput?.imagePrompts),
  },
});

const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {children}
  </section>
);

const CampaignStatusPill = ({ status }: { status: CampaignRecord['status'] }) => {
  const styles: Record<CampaignRecord['status'], string> = {
    Draft: 'bg-gray-200 text-gray-800',
    Generating: 'bg-amber-200 text-amber-800',
    Ready: 'bg-blue-200 text-blue-800',
    Scheduled: 'bg-green-200 text-green-800',
    Published: 'bg-purple-200 text-purple-800',
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
};

const StrategyPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [draft, setDraft] = useState<WorkspaceDraft>(emptyDraft());
  const [instructions, setInstructions] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(Boolean(campaignId));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [brief, setBrief] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) {
        setIsLoadingCampaign(false);
        return;
      }

      try {
        const response = await getCampaignById(campaignId);
        if (!response.data) {
          throw new Error('Campaign not found.');
        }

        setCampaign(response.data);
        setDraft(normalizeCampaignPlan(response.data));
      } catch (_error) {
        toast.error('Could not load the campaign.');
        navigate('/dashboard');
      } finally {
        setIsLoadingCampaign(false);
      }
    };

    fetchCampaign();
  }, [campaignId, navigate]);

  const resetWorkspace = () => {
    setDraft(normalizeCampaignPlan(campaign));
    setInstructions('');
    setIsEditing(false);
  };

  const handleGenerateNew = async (event: FormEvent) => {
    event.preventDefault();

    if (!brief.trim()) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generateCampaign(brief);
      const savedCampaign = response.data?.campaign ?? response.data;

      if (!savedCampaign?._id) {
        throw new Error('Campaign was not saved.');
      }

      navigate(`/strategy/${savedCampaign._id}`);
    } catch (_error) {
      toast.error('Failed to generate campaign. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPlan = () => {
    setIsEditing(true);
    setInstructions('');
  };

  const handleCancel = () => {
    resetWorkspace();
  };

  const handleSaveChanges = async () => {
    if (!campaignId || !campaign) {
      return;
    }

    setIsSaving(true);

    try {
      let nextDraft = { ...draft };
      const trimmedInstructions = instructions.trim();

      if (trimmedInstructions) {
        const refinementResponse = await refineCampaignPlan({
          campaign: normalizeCampaignSnapshot(campaign, draft),
          instructions: trimmedInstructions,
        });

        const refined = refinementResponse.data;

        nextDraft = {
          campaignName: asString(refined?.campaignName) || nextDraft.campaignName,
          summary: asString(refined?.campaignSummary) || nextDraft.summary,
          targetAudience: asString(refined?.targetAudience) || nextDraft.targetAudience,
          brandTone: asString(refined?.brandTone) || nextDraft.brandTone,
          marketingGoals: asStringArray(refined?.marketingGoals).length ? asStringArray(refined?.marketingGoals) : nextDraft.marketingGoals,
          contentCalendar: asObjectArray(refined?.contentCalendar).length
            ? asObjectArray(refined?.contentCalendar).map((item) => ({
                day: asString(item.day),
                platform: asString(item.platform),
                contentType: asString(item.contentType),
                focus: asString(item.focus),
                goal: asString(item.goal),
              }))
            : nextDraft.contentCalendar,
          captions: asObjectArray(refined?.captions).length
            ? asObjectArray(refined?.captions).map((item) => ({
                platform: asString(item.platform),
                contentType: asString(item.contentType),
                caption: asString(item.caption),
              }))
            : nextDraft.captions,
          hashtags: asStringArray(refined?.hashtags).length ? asStringArray(refined?.hashtags) : nextDraft.hashtags,
        };
      }

      const updatedCampaign = await updateCampaignById(campaignId, buildUpdatePayload(campaign, nextDraft));
      setCampaign(updatedCampaign);
      setDraft(normalizeCampaignPlan(updatedCampaign));
      setInstructions('');
      setIsEditing(false);
      toast.success('Campaign saved successfully.');
    } catch (_error) {
      toast.error('Failed to save campaign changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateGoal = (index: number, value: string) => {
    setDraft((prev) => {
      const next = [...prev.marketingGoals];
      next[index] = value;
      return { ...prev, marketingGoals: next };
    });
  };

  const updateHashtag = (index: number, value: string) => {
    setDraft((prev) => {
      const next = [...prev.hashtags];
      next[index] = value;
      return { ...prev, hashtags: next };
    });
  };

  const addGoal = () => {
    setDraft((prev) => ({
      ...prev,
      marketingGoals: [...prev.marketingGoals, ''],
    }));
  };

  const addHashtag = () => {
    setDraft((prev) => ({
      ...prev,
      hashtags: [...prev.hashtags, ''],
    }));
  };

  const updateCalendarItem = (index: number, field: keyof WorkspaceDraft['contentCalendar'][number], value: string) => {
    setDraft((prev) => {
      const next = [...prev.contentCalendar];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, contentCalendar: next };
    });
  };

  const updateCaptionItem = (index: number, field: keyof WorkspaceDraft['captions'][number], value: string) => {
    setDraft((prev) => {
      const next = [...prev.captions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, captions: next };
    });
  };

  const addCalendarRow = () => {
    setDraft((prev) => ({
      ...prev,
      contentCalendar: [...prev.contentCalendar, { day: '', platform: '', contentType: '', focus: '', goal: '' }],
    }));
  };

  const addCaptionRow = () => {
    setDraft((prev) => ({
      ...prev,
      captions: [...prev.captions, { platform: '', contentType: '', caption: '' }],
    }));
  };

  if (isLoadingCampaign) {
    return <div className="p-8 text-center">Loading campaign...</div>;
  }

  if (!campaignId || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            &larr; Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Create a new campaign</h1>
          <p className="mt-2 text-sm text-gray-600">
            Describe the campaign you want to build and StrataGen will generate and save it.
          </p>

          <form onSubmit={handleGenerateNew} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Campaign brief</span>
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                rows={6}
                placeholder="Example: Launch a spring product campaign for a sustainable skincare brand targeting Gen Z..."
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={isGenerating}
              />
            </label>
            <button
              type="submit"
              disabled={isGenerating}
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isGenerating ? 'Generating...' : 'Generate Campaign'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            &larr; Back to Dashboard
          </button>

          <CampaignStatusPill status={campaign.status} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Campaign Workspace</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{draft.campaignName || campaign.title}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {campaign.companyName} - Created {formatDate(campaign.createdAt)}
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:p-8 lg:grid-cols-2">
            <SectionCard title="Campaign Name">
              {isEditing ? (
                <input
                  value={draft.campaignName}
                  onChange={(event) => setDraft((prev) => ({ ...prev, campaignName: event.target.value }))}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              ) : (
                <p className="mt-3 text-sm text-gray-700">{draft.campaignName || campaign.title || 'n/a'}</p>
              )}
            </SectionCard>

            <SectionCard title="Summary">
              {isEditing ? (
                <textarea
                  value={draft.summary}
                  onChange={(event) => setDraft((prev) => ({ ...prev, summary: event.target.value }))}
                  rows={5}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              ) : (
                <p className="mt-3 text-sm leading-6 text-gray-700">{draft.summary || campaign.description || 'n/a'}</p>
              )}
            </SectionCard>

            <SectionCard title="Target Audience">
              {isEditing ? (
                <textarea
                  value={draft.targetAudience}
                  onChange={(event) => setDraft((prev) => ({ ...prev, targetAudience: event.target.value }))}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              ) : (
                <p className="mt-3 text-sm text-gray-700">{draft.targetAudience || campaign.targetAudience || 'n/a'}</p>
              )}
            </SectionCard>

            <SectionCard title="Brand Tone">
              {isEditing ? (
                <textarea
                  value={draft.brandTone}
                  onChange={(event) => setDraft((prev) => ({ ...prev, brandTone: event.target.value }))}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              ) : (
                <p className="mt-3 text-sm text-gray-700">{draft.brandTone || 'n/a'}</p>
              )}
            </SectionCard>

            <SectionCard title="Marketing Goals">
              {isEditing ? (
                <div className="mt-3 space-y-3">
                  {draft.marketingGoals.map((goal, index) => (
                    <input
                      key={`${index}-${goal}`}
                      value={goal}
                      onChange={(event) => updateGoal(index, event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                  {draft.marketingGoals.length === 0 && <p className="text-sm text-gray-500">No goals yet.</p>}
                  <button
                    type="button"
                    onClick={addGoal}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Add Goal
                  </button>
                </div>
              ) : (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                  {draft.marketingGoals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                  {draft.marketingGoals.length === 0 && <li className="list-none text-gray-500">n/a</li>}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Content Calendar">
              {isEditing ? (
                <div className="mt-3 space-y-3">
                  {draft.contentCalendar.map((item, index) => (
                    <div key={`${index}-${item.day}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={item.day}
                          onChange={(event) => updateCalendarItem(index, 'day', event.target.value)}
                          placeholder="Day"
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          value={item.platform}
                          onChange={(event) => updateCalendarItem(index, 'platform', event.target.value)}
                          placeholder="Platform"
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          value={item.contentType}
                          onChange={(event) => updateCalendarItem(index, 'contentType', event.target.value)}
                          placeholder="Content type"
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          value={item.goal}
                          onChange={(event) => updateCalendarItem(index, 'goal', event.target.value)}
                          placeholder="Goal"
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <textarea
                          value={item.focus}
                          onChange={(event) => updateCalendarItem(index, 'focus', event.target.value)}
                          placeholder="Focus"
                          rows={3}
                          className="md:col-span-2 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCalendarRow}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Add Item
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {draft.contentCalendar.map((item, index) => (
                    <div key={`${index}-${item.day}`} className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">
                        Day {item.day || '?'} - {item.platform || 'Platform'}
                      </p>
                      <p className="mt-1">Content: {item.contentType || 'n/a'}</p>
                      <p>Focus: {item.focus || 'n/a'}</p>
                      <p>Goal: {item.goal || 'n/a'}</p>
                    </div>
                  ))}
                  {draft.contentCalendar.length === 0 && <p className="text-sm text-gray-500">n/a</p>}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Captions">
              {isEditing ? (
                <div className="mt-3 space-y-3">
                  {draft.captions.map((item, index) => (
                    <div key={`${index}-${item.platform}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={item.platform}
                          onChange={(event) => updateCaptionItem(index, 'platform', event.target.value)}
                          placeholder="Platform"
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          value={item.contentType}
                          onChange={(event) => updateCaptionItem(index, 'contentType', event.target.value)}
                          placeholder="Content type"
                          className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <textarea
                          value={item.caption}
                          onChange={(event) => updateCaptionItem(index, 'caption', event.target.value)}
                          placeholder="Caption"
                          rows={4}
                          className="md:col-span-2 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCaptionRow}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Add Item
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {draft.captions.map((item, index) => (
                    <div key={`${index}-${item.platform}`} className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">
                        {item.platform || 'Platform'} - {item.contentType || 'Content'}
                      </p>
                      <p className="mt-1 leading-6">{item.caption || 'n/a'}</p>
                    </div>
                  ))}
                  {draft.captions.length === 0 && <p className="text-sm text-gray-500">n/a</p>}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Hashtags">
              {isEditing ? (
                <div className="mt-3 space-y-3">
                  {draft.hashtags.map((tag, index) => (
                    <input
                      key={`${index}-${tag}`}
                      value={tag}
                      onChange={(event) => updateHashtag(index, event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                  {draft.hashtags.length === 0 && <p className="text-sm text-gray-500">No hashtags yet.</p>}
                  <button
                    type="button"
                    onClick={addHashtag}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Add Hashtag
                  </button>
                </div>
              ) : (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                  {draft.hashtags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                  {draft.hashtags.length === 0 && <li className="list-none text-gray-500">n/a</li>}
                </ul>
              )}
            </SectionCard>
          </div>

          {isEditing && (
            <div className="border-t border-gray-100 p-6 sm:p-8">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Describe the changes you want...</span>
                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  rows={4}
                  placeholder="Make it more premium. Target Gen Z. Focus on short-form content."
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-100 p-6 sm:flex-row sm:justify-end sm:p-8">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleEditPlan}
                  className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Edit Plan
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/images/${campaign._id}`)}
                  className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Proceed with Plan
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPage;
