import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  createInstagramConnectUrl,
  disconnectInstagramAccount,
  getInstagramConnectionForUser,
  handleInstagramCallback,
} from '../services/socialService.js';

export const getInstagramConnection = asyncHandler(async (req, res) => {
  const campaignId = req.query.campaignId || req.query.campaign_id;

  const { authorizationUrl } = createInstagramConnectUrl({
    userId: req.user._id,
    campaignId,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Instagram authorization URL created.',
    data: { authorizationUrl },
  });
});

export const readInstagramConnection = asyncHandler(async (req, res) => {
  const connection = await getInstagramConnectionForUser(req.user._id);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Instagram connection fetched successfully.',
    data: {
      connection: connection
        ? {
            platform: connection.platform,
            instagramAccountId: connection.instagramAccountId,
            username: connection.username,
            tokenExpiresAt: connection.tokenExpiresAt,
            connectionStatus: connection.connectionStatus,
            pageId: connection.pageId,
            createdAt: connection.createdAt,
            updatedAt: connection.updatedAt,
          }
        : null,
    },
  });
});

export const disconnectInstagram = asyncHandler(async (req, res) => {
  const connection = await disconnectInstagramAccount(req.user._id);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Instagram account disconnected successfully.',
    data: {
      connection: {
        platform: connection.platform,
        instagramAccountId: connection.instagramAccountId,
        username: connection.username,
        tokenExpiresAt: connection.tokenExpiresAt,
        connectionStatus: connection.connectionStatus,
        pageId: connection.pageId,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      },
    },
  });
});

export const instagramCallback = asyncHandler(async (req, res) => {
  const result = await handleInstagramCallback({
    code: req.query.code,
    state: req.query.state,
    error: req.query.error,
    errorReason: req.query.error_reason,
    errorDescription: req.query.error_description,
  });

  return res.redirect(result.redirectUrl);
});
