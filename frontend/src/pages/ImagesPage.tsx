import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCampaignById } from '../services/api/campaignApi';
import { acceptCampaignImage, rejectCampaignImage } from '../services/api/imageApi';

interface CreativeApprovalRecord {
  platform: string;
  contentType: string;
  prompt: string;
  status: 'accepted' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
}

interface CampaignRecord {
  _id: string;
  title: string;
  companyName: string;
  campaignSummary?: string;
  description?: string;
  imagePrompts?: string[];
  imageApprovals?: CreativeApprovalRecord[];
}

interface ReviewCardState {
  id: string;
  platform: string;
  contentType: string;
  prompt: string;
  status: 'pending' | 'accepted' | 'rejected';
  isSaving: boolean;
  error: string;
}

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];

const buildCreativeKey = (platform: string, contentType: string, prompt: string) =>
  `${asString(platform)}::${asString(contentType)}::${asString(prompt)}`;

const buildApprovalMap = (approvals: CreativeApprovalRecord[] | undefined) => {
  const map = new Map<string, CreativeApprovalRecord>();

  (approvals || []).forEach((approval) => {
    if (!approval) {
      return;
    }

    map.set(buildCreativeKey(approval.platform, approval.contentType, approval.prompt), approval);
  });

  return map;
};

const buildReviewCards = (campaign: CampaignRecord | null): ReviewCardState[] => {
  if (!campaign) {
    return [];
  }

  const prompts = asStringArray(campaign.imagePrompts);
  const approvalMap = buildApprovalMap(campaign.imageApprovals);

  return prompts.map((prompt, index) => {
    const platform = `Prompt ${index + 1}`;
    const contentType = 'image';
    const existingApproval = approvalMap.get(buildCreativeKey(platform, contentType, prompt));

    return {
      id: buildCreativeKey(platform, contentType, prompt),
      platform,
      contentType,
      prompt,
      status: existingApproval?.status ?? 'pending',
      isSaving: false,
      error: '',
    };
  });
};

const upsertApproval = (approvals: CreativeApprovalRecord[] | undefined, nextApproval: CreativeApprovalRecord) => {
  const current = Array.isArray(approvals) ? [...approvals] : [];
  const nextKey = buildCreativeKey(nextApproval.platform, nextApproval.contentType, nextApproval.prompt);
  const existingIndex = current.findIndex(
    (item) => buildCreativeKey(item.platform, item.contentType, item.prompt) === nextKey
  );

  if (existingIndex >= 0) {
    current[existingIndex] = nextApproval;
  } else {
    current.push(nextApproval);
  }

  return current;
};

const ImagesPage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [cards, setCards] = useState<ReviewCardState[]>([]);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(Boolean(campaignId));
  const [campaignError, setCampaignError] = useState('');

  useEffect(() => {
    const loadCampaign = async () => {
      if (!campaignId) {
        setCampaignError('Missing campaign id.');
        setIsLoadingCampaign(false);
        return;
      }

      try {
        setCampaignError('');
        const response = await getCampaignById(campaignId);
        const loadedCampaign = response.data ?? null;

        if (!loadedCampaign?._id) {
          throw new Error('Campaign not found.');
        }

        setCampaign(loadedCampaign);
        setCards(buildReviewCards(loadedCampaign));
      } catch (_error) {
        setCampaign(null);
        setCards([]);
        setCampaignError('Could not load the campaign.');
        toast.error('Could not load the campaign.');
      } finally {
        setIsLoadingCampaign(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const updateCard = (index: number, updater: (card: ReviewCardState) => ReviewCardState) => {
    setCards((current) => current.map((card, currentIndex) => (currentIndex === index ? updater(card) : card)));
  };

  const syncApprovalToState = (approval: CreativeApprovalRecord) => {
    setCampaign((currentCampaign) =>
      currentCampaign
        ? {
            ...currentCampaign,
            imageApprovals: upsertApproval(currentCampaign.imageApprovals, approval),
          }
        : currentCampaign
    );
  };

  const handleReview = async (index: number, nextStatus: 'accepted' | 'rejected') => {
    if (!campaignId) {
      return;
    }

    const card = cards[index];

    if (!card) {
      return;
    }

    updateCard(index, (current) => ({ ...current, isSaving: true, error: '' }));

    try {
      const action = nextStatus === 'accepted' ? acceptCampaignImage : rejectCampaignImage;
      const response = await action({
        campaignId,
        prompt: card.prompt,
        platform: card.platform,
        contentType: card.contentType,
      });

      const approval = response.data?.approval as CreativeApprovalRecord | undefined;

      if (!approval) {
        throw new Error('Approval could not be saved.');
      }

      syncApprovalToState(approval);

      updateCard(index, (current) => ({
        ...current,
        status: approval.status,
        isSaving: false,
        error: '',
      }));

      toast.success(nextStatus === 'accepted' ? 'Creative accepted successfully.' : 'Creative rejected successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save creative approval.';

      updateCard(index, (current) => ({
        ...current,
        isSaving: false,
        error: message,
      }));

      toast.error(message);
    }
  };

  const hasAcceptedCreative = cards.some((card) => card.status === 'accepted');

  if (isLoadingCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Image Approval</p>
          <p className="mt-3 text-slate-700">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaignId || campaignError || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-6 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            &larr; Back to Dashboard
          </button>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Image Approval</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Campaign not available</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{campaignError || 'Unable to load this campaign.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 font-sans sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(`/strategy/${campaignId}`)}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            &larr; Back to Strategy
          </button>
          {hasAcceptedCreative && (
            <button
              type="button"
              onClick={() => navigate(`/autopost/${campaignId}`)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Continue to Autoposting
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Creative Review</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{campaign.title || 'Untitled campaign'}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {campaign.companyName || 'Unknown Company'}
              {campaign.campaignSummary ? ` - ${campaign.campaignSummary}` : ''}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Image generation is paused. Review the saved Gemini creatives below.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:p-8">
            {cards.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {cards.map((card, index) => {
                  const isAccepted = card.status === 'accepted';
                  const isRejected = card.status === 'rejected';

                  return (
                    <section
                      key={card.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {card.platform} - {card.contentType}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-800">{card.prompt}</p>
                        </div>
                        {isAccepted && (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            Accepted
                          </span>
                        )}
                        {isRejected && (
                          <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                            Rejected
                          </span>
                        )}
                        {!isAccepted && !isRejected && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Pending
                          </span>
                        )}
                      </div>

                      {card.error && <p className="mt-3 text-sm text-rose-600">{card.error}</p>}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleReview(index, 'accepted')}
                          disabled={card.isSaving}
                          className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {card.isSaving && !isRejected ? 'Saving...' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(index, 'rejected')}
                          disabled={card.isSaving}
                          className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          {card.isSaving && !isAccepted ? 'Saving...' : 'Reject'}
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No creatives yet.</h3>
                <p className="mt-2 text-sm text-slate-600">This campaign does not have any image prompts to review.</p>
              </div>
            )}

            {hasAcceptedCreative && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-900">At least one creative has been accepted.</p>
                <p className="mt-1 text-sm text-emerald-800">
                  You can move on to autoposting when you are ready.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/autopost/${campaignId}`)}
                  className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Continue to Autoposting
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagesPage;
