import { body } from 'express-validator';

export const generateImageValidator = [
  body('campaignId')
    .notEmpty()
    .withMessage('campaignId is required.')
    .isMongoId()
    .withMessage('campaignId must be a valid MongoDB ObjectId.'),
  body('imagePrompt')
    .optional()
    .isString()
    .withMessage('imagePrompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('imagePrompt cannot be empty.'),
  body('prompt')
    .optional()
    .isString()
    .withMessage('prompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('prompt cannot be empty.'),
];

export const regenerateImageValidator = [
  body('campaignId')
    .notEmpty()
    .withMessage('campaignId is required.')
    .isMongoId()
    .withMessage('campaignId must be a valid MongoDB ObjectId.'),
  body('prompt')
    .notEmpty()
    .withMessage('prompt is required.')
    .isString()
    .withMessage('prompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('prompt cannot be empty.'),
  body('platform')
    .notEmpty()
    .withMessage('platform is required.')
    .isString()
    .withMessage('platform must be a string.')
    .trim()
    .notEmpty()
    .withMessage('platform cannot be empty.'),
  body('contentType')
    .notEmpty()
    .withMessage('contentType is required.')
    .isString()
    .withMessage('contentType must be a string.')
    .trim()
    .notEmpty()
    .withMessage('contentType cannot be empty.'),
];

export const acceptImageValidator = [
  body('campaignId')
    .notEmpty()
    .withMessage('campaignId is required.')
    .isMongoId()
    .withMessage('campaignId must be a valid MongoDB ObjectId.'),
  body('prompt')
    .notEmpty()
    .withMessage('prompt is required.')
    .isString()
    .withMessage('prompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('prompt cannot be empty.'),
  body('platform')
    .notEmpty()
    .withMessage('platform is required.')
    .isString()
    .withMessage('platform must be a string.')
    .trim()
    .notEmpty()
    .withMessage('platform cannot be empty.'),
  body('contentType')
    .notEmpty()
    .withMessage('contentType is required.')
    .isString()
    .withMessage('contentType must be a string.')
    .trim()
    .notEmpty()
    .withMessage('contentType cannot be empty.'),
];

export const rejectImageValidator = [
  body('campaignId')
    .notEmpty()
    .withMessage('campaignId is required.')
    .isMongoId()
    .withMessage('campaignId must be a valid MongoDB ObjectId.'),
  body('prompt')
    .notEmpty()
    .withMessage('prompt is required.')
    .isString()
    .withMessage('prompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('prompt cannot be empty.'),
  body('platform')
    .notEmpty()
    .withMessage('platform is required.')
    .isString()
    .withMessage('platform must be a string.')
    .trim()
    .notEmpty()
    .withMessage('platform cannot be empty.'),
  body('contentType')
    .notEmpty()
    .withMessage('contentType is required.')
    .isString()
    .withMessage('contentType must be a string.')
    .trim()
    .notEmpty()
    .withMessage('contentType cannot be empty.'),
];
