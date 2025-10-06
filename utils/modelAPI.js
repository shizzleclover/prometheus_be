const axios = require('axios');

const PYTHON_API_URL = (process.env.PYTHON_API_URL || '').replace(/\/$/, '');
if (!PYTHON_API_URL) {
  throw new Error('PYTHON_API_URL environment variable is not set. Please configure it in your environment.');
}

function removeEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const nested = removeEmpty(v);
      if (Object.keys(nested).length === 0) continue;
      out[k] = nested;
    } else if (typeof v === 'string' && v.trim() === '') {
      continue;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function formatDemographics(userProfile) {
  if (!userProfile) return {};

  // Only include a concise, essential subset (~10 fields)
  const essentials = {
    gender: userProfile.gender || null,
    nationality: userProfile.nationality || null,
    primaryLanguage: userProfile.primaryLanguage || null,
    languagesSpoken: userProfile.languagesSpoken || [],
    politicalViews: userProfile.politicalViews || null,
    economicViews: userProfile.economicViews || null,
    socialValues: userProfile.socialValues || null,
    environmentalStance: userProfile.environmentalStance || null,
    personalityType: userProfile.personalityType || null,
    humorStyle: userProfile.humorStyle || null,
    communicationPreference: userProfile.communicationPreference || null,
    mediaConsumption: userProfile.mediaConsumption || [],
    hobbiesInterests: userProfile.hobbiesInterests || [],
  };

  // Drop keys with null/empty values so it's fine if client passes nothing
  return removeEmpty(essentials);
}

function formatPreviousChats(conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) return [];
  return conversationHistory.map((msg) => ({
    role: msg.role === 'bot' ? 'assistant' : msg.role,
    message: msg.content,
    timestamp:
      msg.timestamp instanceof Date
        ? msg.timestamp.toISOString()
        : new Date(msg.timestamp || Date.now()).toISOString(),
  }));
}

async function getModelResponse(message, userProfile, conversationHistory, userId) {
  const demographics = formatDemographics(userProfile);
  const previous_chats = formatPreviousChats((conversationHistory || []).slice(-20));

  const payload = {
    message,
    user_id: userId || 'anonymous',
    metadata: {
      demographics,
      previous_chats,
    },
  };

  try {
    const resp = await axios.post(`${PYTHON_API_URL}/chat`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    const data = resp.data;
    const reply = typeof data === 'string' ? data : data.response || data.message || data.reply;

    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('Invalid response format from model API');
    }

    return reply;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const msg =
        error.response.data?.detail ||
        error.response.data?.error ||
        error.response.data?.message ||
        error.message;
      if (status === 429) throw new Error('You are sending messages too quickly. Please wait a moment.');
      if (status >= 500) throw new Error('Model service is experiencing issues. Please try again later.');
      throw new Error(`Model API error: ${msg}`);
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Model request timed out');
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error('Model service is unavailable');
    }
    throw new Error(error.message || 'Model request failed');
  }
}

module.exports = {
  formatDemographics,
  formatPreviousChats,
  getModelResponse,
};


