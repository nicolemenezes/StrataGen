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
  body().custom((value) => {
    const imagePrompt = value?.imagePrompt ?? value?.prompt;

    if (typeof imagePrompt !== 'string' || !imagePrompt.trim()) {
      throw new Error('imagePrompt is required.');
    }

    return true;
  }),
];
