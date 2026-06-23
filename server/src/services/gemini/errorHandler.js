import logger from '../../utils/logger.js';

export const handleGeminiError = (err, fallbackMessage) => {
  logger.error(`Gemini API Error: ${err.message || err}`, { stack: err.stack });
  const msg = err?.message || '';
  if (
    msg.includes('503') || 
    msg.includes('Service Unavailable') || 
    msg.includes('high demand') || 
    msg.includes('overloaded')
  ) {
    return new Error('The AI service is currently experiencing heavy traffic. Please wait a few seconds and try again.');
  }
  if (
    msg.includes('429') || 
    msg.includes('Quota') || 
    msg.includes('Rate limit') || 
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    return new Error('AI request rate limit reached. Please wait a moment and try again.');
  }
  if (msg.includes('API key') || msg.includes('API_KEY_INVALID')) {
    return new Error('AI configuration error. Please verify the server environment key settings.');
  }

  let cleanMsg = msg;
  if (cleanMsg.includes('Error fetching from')) {
    const match = cleanMsg.match(/\[(\d+) [^\]]+\]/);
    if (match) {
      cleanMsg = `AI service returned status code ${match[1]}`;
    } else {
      cleanMsg = 'AI service request failed. Please try again.';
    }
  }

  return new Error(`${fallbackMessage}: ${cleanMsg || 'Unknown error'}`);
};
