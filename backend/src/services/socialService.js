import crypto from 'crypto';
import SocialAccount from '../models/SocialAccount.js';
import { AppError } from '../utils/AppError.js';

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const requireMetaConfig = () => {
  if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
    throw new AppError('Meta OAuth is not configured.', 500);
  }
};

const signState = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT secret is not configured.', 500);
  }

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const verifyState = (state) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT secret is not configured.', 500);
  }

  if (!state || typeof state !== 'string') {
    throw new AppError('Invalid OAuth state.', 400);
  }

  const [body, signature] = state.split('.');

  if (!body || !signature) {
    throw new AppError('Invalid OAuth state.', 400);
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('base64url');

  if (signature !== expectedSignature) {
    throw new AppError('OAuth state verification failed.', 400);
  }

  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

  if (parsed?.exp && Date.now() > parsed.exp) {
    throw new AppError('OAuth state expired.', 400);
  }

  return parsed;
};

const buildAuthorizeUrl = (state) => {
  requireMetaConfig();

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    response_type: 'code',
    state,
    scope: ['instagram_basic', 'pages_show_list', 'pages_read_engagement'].join(','),
  });

  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
};

const exchangeCodeForToken = async (code) => {
  requireMetaConfig();

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    redirect_uri: META_REDIRECT_URI,
    code,
  });

  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new AppError(data?.error?.message || 'Failed to exchange Instagram authorization code.', response.status || 500);
  }

  return data;
};

const exchangeForLongLivedToken = async (shortLivedToken) => {
  requireMetaConfig();

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new AppError(data?.error?.message || 'Failed to extend Instagram access token.', response.status || 500);
  }

  return data;
};

const fetchInstagramPage = async (userAccessToken) => {
  const params = new URLSearchParams({
    fields: 'id,name,access_token,instagram_business_account{id,username}',
    access_token: userAccessToken,
  });

  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new AppError(data?.error?.message || 'Failed to load Facebook Pages.', response.status || 500);
  }

  const page = Array.isArray(data?.data)
    ? data.data.find((item) => item?.instagram_business_account?.id)
    : null;

  if (!page?.instagram_business_account?.id) {
    throw new AppError('No Instagram Professional account was found on the connected Facebook Pages.', 404);
  }

  return {
    pageId: page.id,
    username: page.instagram_business_account.username || '',
    instagramAccountId: page.instagram_business_account.id,
  };
};

const buildFrontendRedirect = (campaignId, params = {}) => {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  return `${CLIENT_URL.replace(/\/$/, '')}/autopost/${campaignId}${query ? `?${query}` : ''}`;
};

const buildFallbackRedirect = (params = {}) => {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  return `${CLIENT_URL.replace(/\/$/, '')}/dashboard${query ? `?${query}` : ''}`;
};

export const createInstagramConnectUrl = ({ userId, campaignId }) => {
  if (!userId) {
    throw new AppError('User is required.', 400);
  }

  if (!campaignId) {
    throw new AppError('campaignId is required.', 400);
  }

  const state = signState({
    userId: String(userId),
    campaignId: String(campaignId),
    exp: Date.now() + 10 * 60 * 1000,
  });

  return {
    authorizationUrl: buildAuthorizeUrl(state),
    state,
  };
};

export const getInstagramConnectionForUser = async (userId) => {
  const connection = await SocialAccount.findOne({ user: userId, platform: 'instagram' }).select(
    'user platform instagramAccountId username tokenExpiresAt connectionStatus pageId createdAt updatedAt'
  );

  return connection;
};

export const disconnectInstagramAccount = async (userId) => {
  const connection = await SocialAccount.findOneAndUpdate(
    { user: userId, platform: 'instagram' },
    { connectionStatus: 'disconnected' },
    { new: true }
  ).select('user platform instagramAccountId username tokenExpiresAt connectionStatus pageId createdAt updatedAt');

  if (!connection) {
    throw new AppError('Instagram account not connected.', 404);
  }

  return connection;
};

export const handleInstagramCallback = async ({ code, state, error, errorReason, errorDescription }) => {
  try {
    const parsedState = verifyState(state);

    if (error || errorReason) {
      return {
        redirectUrl: buildFrontendRedirect(parsedState.campaignId, {
          instagram: 'error',
          message: errorDescription || error || errorReason || 'Instagram authorization was rejected.',
        }),
      };
    }

    if (!code) {
      return {
        redirectUrl: buildFrontendRedirect(parsedState.campaignId, {
          instagram: 'error',
          message: 'Missing authorization code.',
        }),
      };
    }

    const shortLivedTokenResponse = await exchangeCodeForToken(code);
    const longLivedTokenResponse = shortLivedTokenResponse?.access_token
      ? await exchangeForLongLivedToken(shortLivedTokenResponse.access_token)
      : shortLivedTokenResponse;

    const userAccessToken = longLivedTokenResponse?.access_token || shortLivedTokenResponse?.access_token;
    const expiresIn = Number(longLivedTokenResponse?.expires_in || shortLivedTokenResponse?.expires_in || 0);

    if (!userAccessToken) {
      throw new AppError('Instagram did not return an access token.', 400);
    }

    const page = await fetchInstagramPage(userAccessToken);
    const tokenExpiresAt = Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null;

    await SocialAccount.findOneAndUpdate(
      { user: parsedState.userId, platform: 'instagram' },
      {
        user: parsedState.userId,
        platform: 'instagram',
        instagramAccountId: page.instagramAccountId,
        username: page.username || page.instagramAccountId,
        accessToken: userAccessToken,
        tokenExpiresAt,
        connectionStatus: 'connected',
        pageId: page.pageId || null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      redirectUrl: buildFrontendRedirect(parsedState.campaignId, {
        instagram: 'connected',
      }),
    };
  } catch (error) {
    const parsedState = (() => {
      try {
        return verifyState(state);
      } catch (_innerError) {
        return null;
      }
    })();

    if (parsedState?.campaignId) {
      return {
        redirectUrl: buildFrontendRedirect(parsedState.campaignId, {
          instagram: 'error',
          message: error?.message || 'Instagram connection failed.',
        }),
      };
    }

    return {
      redirectUrl: buildFallbackRedirect({
        instagram: 'error',
        message: error?.message || 'Instagram connection failed.',
      }),
    };
  }
};
