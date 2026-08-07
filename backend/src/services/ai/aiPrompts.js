const stringifyValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join(', ');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const appendDetails = (lines, details) => {
  const fields = [
    ['Title', details.title],
    ['Company Name', details.companyName],
    ['Industry', details.industry],
    ['Description', details.description],
    ['Target Audience', details.targetAudience],
    ['Campaign Goal', details.campaignGoal],
    ['Budget', details.budget],
    ['Platforms', details.platforms],
    ['Tone', details.tone],
    ['Key Message', details.keyMessage],
    ['CTA', details.cta],
    ['Duration', details.duration],
    ['Brand Values', details.brandValues],
    ['Competitors', details.competitors],
    ['Additional Notes', details.additionalNotes],
  ];

  fields.forEach(([label, value]) => {
    const normalizedValue = stringifyValue(value);

    if (normalizedValue) {
      lines.push(`${label}: ${normalizedValue}`);
    }
  });
};

const buildBasePrompt = (details, title, outputInstructions) => {
  const lines = [
    'You are a senior marketing strategist.',
    title,
    'Return a single JSON object only. Do not wrap the response in markdown, code fences, or commentary.',
    outputInstructions,
    'If a detail is missing, infer it reasonably from context instead of inventing conflicting facts.',
    'Campaign details:',
  ];

  appendDetails(lines, details);
  lines.push('Remember: output valid JSON only.');

  return lines.join('\n');
};

export const buildCampaignPrompt = (details) =>
  buildBasePrompt(
    details,
    'Create a complete campaign plan based on the provided details.',
    [
      'Use these exact top-level keys: campaignName, campaignSummary, targetAudience, marketingGoals, brandTone, contentCalendar, captions, hashtags, imagePrompts.',
      'Value requirements:',
      '- campaignName: string',
      '- campaignSummary: string',
      '- targetAudience: string',
      '- marketingGoals: array of strings',
      '- brandTone: string',
      '- contentCalendar: array of objects with day, platform, contentType, focus, and goal',
      '- captions: array of objects with platform, contentType, and caption',
      '- hashtags: array of strings',
      '- imagePrompts: array of strings',
    ].join('\n')
  );

export const buildStrategyPrompt = (details) =>
  buildBasePrompt(
    details,
    'Create a strategy summary for the provided campaign details.',
    [
      'Use these exact top-level keys: strategyName, strategySummary, targetAudience, keyMessages, channelFocus, priorities, nextSteps.',
      'Value requirements:',
      '- strategyName: string',
      '- strategySummary: string',
      '- targetAudience: string',
      '- keyMessages: array of strings',
      '- channelFocus: array of strings',
      '- priorities: array of strings',
      '- nextSteps: array of strings',
    ].join('\n')
  );

export const buildContentPrompt = (details) =>
  buildBasePrompt(
    details,
    'Create a content plan for the provided campaign details.',
    [
      'Use these exact top-level keys: contentTheme, contentIdeas, captions, hashtags, callToActions.',
      'Value requirements:',
      '- contentTheme: string',
      '- contentIdeas: array of strings',
      '- captions: array of strings',
      '- hashtags: array of strings',
      '- callToActions: array of strings',
    ].join('\n')
  );

export const buildImagePromptsPrompt = (details) =>
  buildBasePrompt(
    details,
    'Create image prompts for the provided campaign details.',
    [
      'Use these exact top-level keys: imagePrompts.',
      'Value requirements:',
      '- imagePrompts: array of strings',
    ].join('\n')
  );

export const buildRefineCampaignPrompt = (campaign, instructions) => {
  const lines = [
    'You are a senior marketing strategist refining an existing campaign plan.',
    'Update only the parts affected by the user instructions and preserve the rest of the campaign as much as possible.',
    'Return a single JSON object only. Do not wrap the response in markdown, code fences, or commentary.',
    'Use these exact top-level keys: campaignName, campaignSummary, targetAudience, marketingGoals, brandTone, contentCalendar, captions, hashtags, imagePrompts.',
    'Value requirements:',
    '- campaignName: string',
    '- campaignSummary: string',
    '- targetAudience: string',
    '- marketingGoals: array of strings',
    '- brandTone: string',
    '- contentCalendar: array of objects with day, platform, contentType, focus, and goal',
    '- captions: array of objects with platform, contentType, and caption',
    '- hashtags: array of strings',
    '- imagePrompts: array of strings',
    'User instructions:',
    stringifyValue(instructions),
    'Current campaign JSON:',
    JSON.stringify(campaign || {}, null, 2),
    'Remember: output valid JSON only.',
  ];

  return lines.join('\n');
};
