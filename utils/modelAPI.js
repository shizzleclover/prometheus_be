const axios = require('axios');

// Build the payload contract expected by the Python API
function buildGeneratePayload({ message, userProfile, conversationHistory }) {
  return {
    message,
    userProfile,
    conversationHistory,
  };
}

// Call Python API /generate with timeout and error handling
async function generateResponse({ message, userProfile, conversationHistory }) {
  // Mock mode for local testing without Python API
  if (process.env.MOCK_MODEL === 'true' || !process.env.PYTHON_API_URL) {
    return {
      reply: `Mock reply to: ${message}`,
      confidence: 0.99,
      processingTime: 0.01,
    };
  }

  const url = process.env.PYTHON_API_URL?.replace(/\/$/, '') + '/generate';
  const payload = buildGeneratePayload({ message, userProfile, conversationHistory });

  try {
    const { data } = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    if (!data || typeof data.reply !== 'string') {
      throw new Error('Invalid response format from model');
    }

    return {
      reply: data.reply,
      confidence: data.confidence,
      processingTime: data.processingTime,
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      // timeout
      if (process.env.MOCK_MODEL === 'true') {
        return { reply: `Mock reply to: ${message}`, confidence: 0.5, processingTime: 30 };
      }
      throw new Error('Request timed out');
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      // allow fallback to mock to keep app responsive in dev
      if (process.env.MOCK_MODEL !== 'false') {
        return { reply: `Mock reply to: ${message}`, confidence: 0.5, processingTime: 0.02 };
      }
      throw new Error('Model service is unavailable');
    }
    // Pass through meaningful server errors when available
    const serverMessage = error.response?.data?.error || error.response?.data?.message;
    throw new Error(serverMessage || error.message || 'Model request failed');
  }
}

module.exports = {
  buildGeneratePayload,
  generateResponse,
};

