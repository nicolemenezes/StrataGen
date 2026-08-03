const BACKEND_NOT_IMPLEMENTED_ERROR = 'Backend not implemented.';

const mockCampaignSummary = {
  id: 'campaign-1',
  title: 'Sustainable Coffee - Gen Z Mumbai',
  status: 'review',
  created_at: '2026-08-01T10:00:00.000Z',
};

const mockCampaignData = {
  id: 'campaign-1',
  title: 'Sustainable Coffee - Gen Z Mumbai',
  strategy: {
    theme: 'Eco-friendly launch for Gen Z coffee lovers',
    brand_tone: ['Friendly', 'Modern', 'Purpose-driven'],
    hashtags: ['#GenZForGreen', '#SustainableCoffee', '#MumbaiMornings'],
    posting_schedule: ['Day 1 - Instagram', 'Day 2 - LinkedIn'],
    days: [
      {
        day: 1,
        platform: 'instagram',
        content_type: 'post',
        concept: 'Launch the coffee with a calm, earthy visual.',
        key: 'day-plan-1',
      },
      {
        day: 2,
        platform: 'linkedin',
        content_type: 'blog post',
        concept: 'Share the sustainability story and product mission.',
        key: 'day-plan-2',
      },
    ],
  },
  assets: [
    {
      id: 'asset-1',
      storage_path: 'campaigns/coffee-1.jpg',
      metadata: { day: 1, platform: 'instagram' },
      created_at: '2026-08-01T11:00:00.000Z',
    },
    {
      id: 'asset-2',
      storage_path: 'campaigns/coffee-2.jpg',
      metadata: { day: 2, platform: 'linkedin' },
      created_at: '2026-08-01T11:30:00.000Z',
    },
  ],
  copies: [
    {
      id: 'copy-1',
      type: 'caption',
      content: 'Sip sustainably this season. #GenZForGreen',
      metadata: { day: 1, platform: 'instagram' },
      created_at: '2026-08-01T11:15:00.000Z',
    },
    {
      id: 'copy-2',
      type: 'blog_title',
      content: 'Why Sustainable Coffee Matters for Modern Teams',
      metadata: { day: 2, platform: 'linkedin' },
      created_at: '2026-08-01T11:45:00.000Z',
    },
    {
      id: 'copy-3',
      type: 'blog_body',
      content: '### Building a better morning ritual\nCoffee can be both energizing and responsible.',
      metadata: { day: 2, platform: 'linkedin' },
      created_at: '2026-08-01T11:50:00.000Z',
    },
  ],
  campaign_influencer_tips: [
    {
      id: 'tip-1',
      tip: 'Pair product shots with founder-led sustainability messaging.',
      influencers: {
        id: 'influencer-1',
        name: 'Priya Sharma',
        profile_url: '#',
        platform: 'linkedin',
      },
    },
  ],
};

function notImplemented(payload) {
  return { error: null, data: payload ?? null };
}

export async function getCampaigns() {
  return { data: [mockCampaignSummary] };
}

export async function getCampaignById() {
  return { data: mockCampaignData };
}

export async function createCampaign() {
  return { data: mockCampaignData };
}

export async function updateCampaign() {
  return { data: mockCampaignData };
}

export async function runCampaign() {
  return notImplemented({ ok: true });
}

export async function approveCampaign() {
  return notImplemented({ ok: true });
}

export async function sendCampaignCommand() {
  return notImplemented({ ok: true });
}

export async function updateCampaignCopy(copyId, content) {
  return { data: { id: copyId, content } };
}

export async function getCampaignChat() {
  return { data: [{ role: 'assistant', content: 'Mock strategy history is ready.' }] };
}

export async function strategizeAndChat() {
  return { data: { campaign_id: mockCampaignData.id, initial_reply: 'Mock strategy draft created.' } };
}

export async function continueCampaignChat() {
  return { data: { reply: 'Mock follow-up response.' } };
}

const campaignApi = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  runCampaign,
  approveCampaign,
  sendCampaignCommand,
  updateCampaignCopy,
  getCampaignChat,
  strategizeAndChat,
  continueCampaignChat,
};

export default campaignApi;
