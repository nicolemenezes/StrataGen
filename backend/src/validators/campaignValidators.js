import { body, param, query } from 'express-validator';

const statusValues = ['Draft', 'Generating', 'Ready', 'Scheduled', 'Published'];

const stringField = (fieldName) =>
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required.`);

const optionalStringField = (fieldName) =>
  body(fieldName)
    .optional()
    .isString()
    .withMessage(`${fieldName} must be a string.`)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} cannot be empty.`);

export const campaignIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Campaign id must be a valid MongoDB ObjectId.'),
];

export const listCampaignsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100.')
    .toInt(),
  query('search')
    .optional()
    .isString()
    .trim(),
];

export const createCampaignValidator = [
  stringField('title').isLength({ min: 2 }).withMessage('title must be at least 2 characters long.'),
  stringField('companyName').isLength({ min: 2 }).withMessage('companyName must be at least 2 characters long.'),
  stringField('industry').isLength({ min: 2 }).withMessage('industry must be at least 2 characters long.'),
  stringField('description').isLength({ min: 10 }).withMessage('description must be at least 10 characters long.'),
  body('campaignSummary')
    .optional()
    .isString()
    .withMessage('campaignSummary must be a string.')
    .trim(),
  stringField('targetAudience').isLength({ min: 2 }).withMessage('targetAudience must be at least 2 characters long.'),
  stringField('campaignGoal').isLength({ min: 2 }).withMessage('campaignGoal must be at least 2 characters long.'),
  body('brandTone')
    .optional()
    .isString()
    .withMessage('brandTone must be a string.')
    .trim(),
  body('marketingGoals')
    .optional()
    .isArray()
    .withMessage('marketingGoals must be an array.'),
  body('marketingGoals.*')
    .optional()
    .isString()
    .withMessage('Each marketing goal must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Marketing goal entries cannot be empty.'),
  body('contentCalendar')
    .optional()
    .isArray()
    .withMessage('contentCalendar must be an array.'),
  body('captions')
    .optional()
    .isArray()
    .withMessage('captions must be an array.'),
  body('hashtags')
    .optional()
    .isArray()
    .withMessage('hashtags must be an array.'),
  body('hashtags.*')
    .optional()
    .isString()
    .withMessage('Each hashtag must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Hashtag entries cannot be empty.'),
  body('imagePrompts')
    .optional()
    .isArray()
    .withMessage('imagePrompts must be an array.'),
  body('imagePrompts.*')
    .optional()
    .isString()
    .withMessage('Each image prompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Image prompt entries cannot be empty.'),
  body('platforms')
    .isArray({ min: 1 })
    .withMessage('platforms must be a non-empty array.'),
  body('platforms.*')
    .isString()
    .withMessage('Each platform must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Platform entries cannot be empty.'),
  body('budget')
    .notEmpty()
    .withMessage('budget is required.')
    .isFloat({ min: 0 })
    .withMessage('budget must be a number greater than or equal to 0.')
    .toFloat(),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage(`status must be one of: ${statusValues.join(', ')}`),
];

export const updateCampaignValidator = [
  optionalStringField('title').isLength({ min: 2 }).withMessage('title must be at least 2 characters long.'),
  optionalStringField('companyName').isLength({ min: 2 }).withMessage('companyName must be at least 2 characters long.'),
  optionalStringField('industry').isLength({ min: 2 }).withMessage('industry must be at least 2 characters long.'),
  optionalStringField('description').isLength({ min: 10 }).withMessage('description must be at least 10 characters long.'),
  body('campaignSummary')
    .optional()
    .isString()
    .withMessage('campaignSummary must be a string.')
    .trim(),
  optionalStringField('targetAudience').isLength({ min: 2 }).withMessage('targetAudience must be at least 2 characters long.'),
  optionalStringField('campaignGoal').isLength({ min: 2 }).withMessage('campaignGoal must be at least 2 characters long.'),
  body('brandTone')
    .optional()
    .isString()
    .withMessage('brandTone must be a string.')
    .trim(),
  body('marketingGoals')
    .optional()
    .isArray()
    .withMessage('marketingGoals must be an array.'),
  body('marketingGoals.*')
    .optional()
    .isString()
    .withMessage('Each marketing goal must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Marketing goal entries cannot be empty.'),
  body('contentCalendar')
    .optional()
    .isArray()
    .withMessage('contentCalendar must be an array.'),
  body('captions')
    .optional()
    .isArray()
    .withMessage('captions must be an array.'),
  body('hashtags')
    .optional()
    .isArray()
    .withMessage('hashtags must be an array.'),
  body('hashtags.*')
    .optional()
    .isString()
    .withMessage('Each hashtag must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Hashtag entries cannot be empty.'),
  body('imagePrompts')
    .optional()
    .isArray()
    .withMessage('imagePrompts must be an array.'),
  body('imagePrompts.*')
    .optional()
    .isString()
    .withMessage('Each image prompt must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Image prompt entries cannot be empty.'),
  body('sourcePrompt')
    .optional()
    .isString()
    .withMessage('sourcePrompt must be a string.')
    .trim(),
  body('aiOutput')
    .optional()
    .custom((value) => value && typeof value === 'object' && !Array.isArray(value))
    .withMessage('aiOutput must be an object.'),
  body('platforms')
    .optional()
    .isArray({ min: 1 })
    .withMessage('platforms must be a non-empty array.'),
  body('platforms.*')
    .optional()
    .isString()
    .withMessage('Each platform must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Platform entries cannot be empty.'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('budget must be a number greater than or equal to 0.')
    .toFloat(),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage(`status must be one of: ${statusValues.join(', ')}`),
];

export const saveGeneratedCampaignValidator = [
  body().custom((value) => {
    const bodyValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const hasCampaignPlan = bodyValue.campaignPlan && typeof bodyValue.campaignPlan === 'object' && !Array.isArray(bodyValue.campaignPlan);
    const hasCampaignDetails = bodyValue.campaignDetails && typeof bodyValue.campaignDetails === 'object' && !Array.isArray(bodyValue.campaignDetails);
    const hasTopLevelCampaignFields =
      typeof bodyValue.title === 'string' ||
      typeof bodyValue.companyName === 'string' ||
      typeof bodyValue.description === 'string';

    if (!hasCampaignPlan && !hasCampaignDetails && !hasTopLevelCampaignFields) {
      throw new Error('campaignPlan or campaignDetails must be provided.');
    }

    return true;
  }),
];
