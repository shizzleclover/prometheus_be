const axios = require('axios');

const PYTHON_API_URL = (process.env.PYTHON_API_URL || 'https://santacl-prometheus.hf.space').replace(/\/$/, '');

function formatDemographics(userProfile) {
  if (!userProfile) return {};
  return {
    // Basic demographics
    gender: userProfile.gender || null,
    nationality: userProfile.nationality || null,
    race: userProfile.race || null,
    tribe: userProfile.tribe || null,
    skinColor: userProfile.skinColor || null,
    disabilities: userProfile.disabilities || [],
    politicalViews: userProfile.politicalViews || null,
    moralAlignment: userProfile.moralAlignment || null,
    historicalFigureResonates: userProfile.historicalFigureResonates || null,
    historicalFigureLiked: userProfile.historicalFigureLiked || null,
    historicalFigureHated: userProfile.historicalFigureHated || null,
    additionalInfo: userProfile.additionalInfo || null,

    // Cultural/Religious
    religion: userProfile.religion || null,
    religiousIntensity: userProfile.religiousIntensity || null,
    culturalBackground: userProfile.culturalBackground || null,
    primaryLanguage: userProfile.primaryLanguage || null,
    languagesSpoken: userProfile.languagesSpoken || [],

    // Ideological
    economicViews: userProfile.economicViews || null,
    socialValues: userProfile.socialValues || null,
    religiousPhilosophy: userProfile.religiousPhilosophy || null,
    environmentalStance: userProfile.environmentalStance || null,
    controversialTopicStances: userProfile.controversialTopicStances || {},

    // Personal Identity
    sexualOrientation: userProfile.sexualOrientation || null,
    relationshipStatus: userProfile.relationshipStatus || null,
    parentalStatus: userProfile.parentalStatus || null,
    generationalIdentity: userProfile.generationalIdentity || null,
    urbanRuralSuburban: userProfile.urbanRuralSuburban || null,

    // Personality
    personalityType: userProfile.personalityType || null,
    humorStyle: userProfile.humorStyle || null,
    communicationPreference: userProfile.communicationPreference || null,
    sensitivityTopics: userProfile.sensitivityTopics || [],

    // Historical/Cultural
    favoriteHistoricalEra: userProfile.favoriteHistoricalEra || null,
    leastFavoriteHistoricalEra: userProfile.leastFavoriteHistoricalEra || null,
    culturalIconsYouLove: userProfile.culturalIconsYouLove || [],
    culturalIconsYouHate: userProfile.culturalIconsYouHate || [],

    // Media/Interests
    politicalFiguresYouSupport: userProfile.politicalFiguresYouSupport || [],
    politicalFiguresYouOppose: userProfile.politicalFiguresYouOppose || [],
    mediaConsumption: userProfile.mediaConsumption || [],
    hobbiesInterests: userProfile.hobbiesInterests || [],
  };
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
  // Mock mode for development or when API URL missing
  if (process.env.MOCK_MODEL === 'true' || !process.env.PYTHON_API_URL) {
    return `Mock reply to: ${message}`;
  }

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
    const reply =
      (typeof data === 'string' ? data : (data.response || data.message || data.reply));

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
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      if (process.env.MOCK_MODEL !== 'false') return `Mock reply to: ${message}`;
      throw new Error('Model service is unavailable');
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Model request timed out');
    }
    throw new Error(error.message || 'Model request failed');
  }
}

module.exports = {
  formatDemographics,
  formatPreviousChats,
  getModelResponse,
};


