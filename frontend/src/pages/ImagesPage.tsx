import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCampaignById } from '../services/api/campaignApi';
import { generateCampaignImage } from '../services/api/imageApi';

interface CampaignRecord {
  _id: string;
  title: string;
  companyName: string;
  description?: string;
  campaignSummary?: string;
  imagePrompts?: string[];
}

interface GeneratedImageRecord {
  base64: string;
  dataUrl: string;
  mimeType: string;
  model?: string;
}

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];

const buildDataUrl = (image?: GeneratedImageRecord | null) => image?.dataUrl || (image ? `data:${image.mimeType};base64,${image.base64}` : '');

const ImagesPage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(Boolean(campaignId));
  const [campaignError, setCampaignError] = useState('');
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [promptErrors, setPromptErrors] = useState<Record<number, string>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<number, GeneratedImageRecord>>({});
  const [promptStatuses, setPromptStatuses] = useState<Record<number, string>>({});

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
      } catch (_error) {
        setCampaign(null);
        setCampaignError('Could not load the campaign.');
        toast.error('Could not load the campaign.');
      } finally {
        setIsLoadingCampaign(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const imagePrompts = useMemo(() => asStringArray(campaign?.imagePrompts), [campaign?.imagePrompts]);

  const handleGenerateImage = async (index: number, prompt: string) => {
    if (!campaignId) {
      return;
    }

    const normalizedPrompt = asString(prompt);

    if (!normalizedPrompt) {
      setPromptErrors((prev) => ({ ...prev, [index]: 'This prompt is empty.' }));
      return;
    }

    setGeneratingIndex(index);
    setPromptErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setPromptStatuses((prev) => ({ ...prev, [index]: 'Generating image...' }));

    try {
      const response = await generateCampaignImage({
        campaignId,
        imagePrompt: normalizedPrompt,
      });

      const image = response.data?.image;

      if (!image?.base64) {
        throw new Error('Image generation failed.');
      }

      setGeneratedImages((prev) => ({
        ...prev,
        [index]: {
          base64: image.base64,
          dataUrl: image.dataUrl || `data:${image.mimeType};base64,${image.base64}`,
          mimeType: image.mimeType || 'image/png',
          model: image.model,
        },
      }));
      setPromptStatuses((prev) => ({ ...prev, [index]: 'Image generated successfully.' }));
      toast.success('Image generated successfully.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to generate image.';
      setPromptErrors((prev) => ({ ...prev, [index]: message }));
      setPromptStatuses((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      toast.error(message);
    } finally {
      setGeneratingIndex(null);
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
              <h2 className="text-lg font-semibold text-gray-900">Image Prompts</h2>
              <p className="mt-1 text-sm text-gray-600">
                Generate individual campaign images from the prompts created in the strategy stage.
              </p>
            </div>

            {imagePrompts.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {imagePrompts.map((prompt, index) => {
                  const image = generatedImages[index];
                  const isGenerating = generatingIndex === index;
                  const promptStatus = promptStatuses[index];
                  const promptError = promptErrors[index];

                  return (
                    <section key={`${index}-${prompt}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prompt {index + 1}</p>
                          <p className="mt-2 text-sm leading-6 text-gray-800">{prompt}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateImage(index, prompt)}
                          disabled={isGenerating}
                          className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                        >
                          {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                      </div>

                      {promptStatus && <p className="mt-4 text-sm text-blue-700">{promptStatus}</p>}
                      {promptError && <p className="mt-4 text-sm text-red-600">{promptError}</p>}

                      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                        {image ? (
                          <img
                            src={buildDataUrl(image)}
                            alt={`Generated image for prompt ${index + 1}`}
                            className="h-auto w-full object-cover"
                          />
                        ) : (
                          <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
                            <p className="text-sm text-gray-500">No image generated yet.</p>
                          </div>
                        )}
                      </div>

                      {image?.model && (
                        <p className="mt-3 text-xs text-gray-500">
                          Generated with {image.model}
                        </p>
                      )}
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
