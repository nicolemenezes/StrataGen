import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCampaignById } from '../services/api/campaignApi';
import {
  acceptCampaignImage,
  generateCampaignImage,
  regenerateCampaignImage,
} from '../services/api/imageApi';

interface CampaignImageRecord {
  secure_url: string;
  publicId: string;
  platform: string;
  contentType: string;
  prompt: string;
  status: 'accepted';
  sourceHash: string;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ImagePromptRecord {
  platform: string;
  contentType: string;
  prompt: string;
}

interface CampaignRecord {
  _id: string;
  title: string;
  companyName: string;
  campaignSummary?: string;
  description?: string;
  imagePrompts?: string[];
  images?: CampaignImageRecord[];
  aiOutput?: {
    imagePrompts?: ImagePromptRecord[];
  };
}

interface ImagePreview {
  kind: 'generated' | 'accepted';
  dataUrl?: string;
  mimeType?: string;
  base64?: string;
  model?: string;
  secure_url?: string;
  publicId?: string;
}

interface ReviewCardState {
  id: string;
  platform: string;
  contentType: string;
  prompt: string;
  preview: ImagePreview | null;
  isAccepted: boolean;
  isGenerating: boolean;
  isAccepting: boolean;
  error: string;
}

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];

const asObjectArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];

const toGeneratedPreview = (image: { base64: string; dataUrl?: string; mimeType?: string; model?: string }): ImagePreview => ({
  kind: 'generated',
  base64: image.base64,
  dataUrl: image.dataUrl || `data:${image.mimeType || 'image/png'};base64,${image.base64}`,
  mimeType: image.mimeType || 'image/png',
  model: image.model,
});

const toAcceptedPreview = (image: CampaignImageRecord): ImagePreview => ({
  kind: 'accepted',
  secure_url: image.secure_url,
  publicId: image.publicId,
  mimeType: image.mimeType || 'image/png',
});

const buildPromptList = (campaign: CampaignRecord | null): ImagePromptRecord[] => {
  if (!campaign) {
    return [];
  }

  const aiPrompts = asObjectArray(campaign.aiOutput?.imagePrompts).map((item, index) => ({
    platform: asString(item.platform) || `Prompt ${index + 1}`,
    contentType: asString(item.contentType) || 'image',
    prompt: asString(item.prompt),
  }));

  if (aiPrompts.length > 0) {
    return aiPrompts.filter((item) => item.prompt);
  }

  return asStringArray(campaign.imagePrompts).map((prompt, index) => ({
    platform: `Prompt ${index + 1}`,
    contentType: 'image',
    prompt,
  }));
};

const getLatestAcceptedImage = (campaign: CampaignRecord | null, promptMeta: ImagePromptRecord) => {
  if (!campaign?.images?.length) {
    return null;
  }

  const normalizedPrompt = asString(promptMeta.prompt);
  const normalizedPlatform = asString(promptMeta.platform);
  const normalizedContentType = asString(promptMeta.contentType);

  const matches = campaign.images
    .filter((image) => {
      if (!image || image.status !== 'accepted') {
        return false;
      }

      return (
        asString(image.prompt) === normalizedPrompt &&
        asString(image.platform) === normalizedPlatform &&
        asString(image.contentType) === normalizedContentType
      );
    })
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());

  return matches[0] || null;
};

const buildReviewCards = (campaign: CampaignRecord | null): ReviewCardState[] =>
  buildPromptList(campaign).map((promptMeta, index) => {
    const acceptedImage = getLatestAcceptedImage(campaign, promptMeta);

    return {
      id: `${promptMeta.platform}-${promptMeta.contentType}-${index}`,
      platform: promptMeta.platform,
      contentType: promptMeta.contentType,
      prompt: promptMeta.prompt,
      preview: acceptedImage ? toAcceptedPreview(acceptedImage) : null,
      isAccepted: Boolean(acceptedImage),
      isGenerating: false,
      isAccepting: false,
      error: '',
    };
  });

const buildDataUrl = (preview?: ImagePreview | null) => {
  if (!preview) {
    return '';
  }

  if (preview.kind === 'accepted') {
    return preview.secure_url || '';
  }

  return preview.dataUrl || '';
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

  const handleGenerateOrRegenerate = async (index: number) => {
    if (!campaignId) {
      return;
    }

    const card = cards[index];

    if (!card) {
      return;
    }

    updateCard(index, (current) => ({ ...current, isGenerating: true, error: '' }));

    try {
      const action = card.preview ? regenerateCampaignImage : generateCampaignImage;
      const response = await action({
        campaignId,
        prompt: card.prompt,
        platform: card.platform,
        contentType: card.contentType,
      });

      const image = response.data?.image;

      if (!image?.base64) {
        throw new Error('Image generation failed.');
      }

      updateCard(index, (current) => ({
        ...current,
        preview: toGeneratedPreview(image),
        isAccepted: false,
        isGenerating: false,
        error: '',
      }));

      toast.success(card.preview ? 'Image regenerated successfully.' : 'Image generated successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to generate image.';
      updateCard(index, (current) => ({
        ...current,
        isGenerating: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  const handleAccept = async (index: number) => {
    if (!campaignId) {
      return;
    }

    const card = cards[index];

    if (!card?.preview || card.preview.kind !== 'generated') {
      return;
    }

    if (card.isAccepted) {
      toast.error('This image has already been accepted.');
      return;
    }

    const imageDataUrl = card.preview.dataUrl;

    if (!imageDataUrl) {
      toast.error('No generated image is available to accept.');
      return;
    }

    updateCard(index, (current) => ({ ...current, isAccepting: true, error: '' }));

    try {
      const response = await acceptCampaignImage({
        campaignId,
        prompt: card.prompt,
        platform: card.platform,
        contentType: card.contentType,
        imageDataUrl,
      });

      const savedImage = response.data?.image as CampaignImageRecord | undefined;

      if (!savedImage?.secure_url) {
        throw new Error('Cloudinary upload failed.');
      }

      setCampaign((currentCampaign) =>
        currentCampaign
          ? {
              ...currentCampaign,
              images: [...(currentCampaign.images || []), savedImage],
            }
          : currentCampaign
      );

      updateCard(index, (current) => ({
        ...current,
        preview: toAcceptedPreview(savedImage),
        isAccepted: true,
        isAccepting: false,
        error: '',
      }));

      toast.success('Image accepted successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to accept image.';
      updateCard(index, (current) => ({
        ...current,
        isAccepting: false,
        error: message,
      }));
      toast.error(message);
    }
  };

  if (isLoadingCampaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Image Generation</p>
          <p className="mt-3 text-gray-700">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaignId || campaignError || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mb-6 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            &larr; Back to Dashboard
          </button>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Image Generation</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Campaign not available</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">{campaignError || 'Unable to load this campaign.'}</p>
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
            onClick={() => navigate(`/strategy/${campaignId}`)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            &larr; Back to Strategy
          </button>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Image Generation</span>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Campaign Images</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{campaign.title || 'Untitled campaign'}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {campaign.companyName || 'Unknown Company'}
              {campaign.campaignSummary ? ` - ${campaign.campaignSummary}` : ''}
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:p-8">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-lg font-semibold text-gray-900">Review Image Prompts</h2>
              <p className="mt-1 text-sm text-gray-600">
                Generate a preview, then accept the one you want to store in Cloudinary and MongoDB.
              </p>
            </div>

            {cards.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {cards.map((card, index) => {
                  const hasPreview = Boolean(card.preview);
                  const previewSrc = buildDataUrl(card.preview);

                  return (
                    <section key={card.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {card.platform} - {card.contentType}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-gray-800">{card.prompt}</p>
                        </div>
                        {card.isAccepted && (
                          <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                            Accepted
                          </span>
                        )}
                      </div>

                      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                        {hasPreview ? (
                          <img
                            src={previewSrc}
                            alt={`Generated image for ${card.platform}`}
                            className="h-auto w-full object-cover"
                          />
                        ) : (
                          <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
                            <p className="text-sm text-gray-500">No image generated yet.</p>
                          </div>
                        )}
                      </div>

                      {card.preview?.kind === 'generated' && (
                        <p className="mt-3 text-xs text-gray-500">Generated with {card.preview.model || 'Stable Diffusion'}</p>
                      )}

                      {card.error && <p className="mt-3 text-sm text-red-600">{card.error}</p>}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {!hasPreview ? (
                          <button
                            type="button"
                            onClick={() => handleGenerateOrRegenerate(index)}
                            disabled={card.isGenerating}
                            className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                          >
                            {card.isGenerating ? 'Generating...' : 'Generate'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAccept(index)}
                              disabled={card.isAccepting || card.isAccepted || card.preview?.kind !== 'generated'}
                              className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                            >
                              {card.isAccepting ? 'Accepting...' : card.isAccepted ? 'Accepted' : 'ACCEPT'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateOrRegenerate(index)}
                              disabled={card.isGenerating}
                              className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                            >
                              {card.isGenerating ? 'Regenerating...' : 'REGENERATE'}
                            </button>
                          </>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-900">No image prompts yet.</h3>
                <p className="mt-2 text-sm text-gray-600">
                  This campaign does not have any image prompts to generate from.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagesPage;
