const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getModelResponse } = require('../utils/modelAPI');

const router = express.Router();

function generateConversationId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `conv_${ts}_${rnd}`;
}

// Create a new conversation
router.post('/', protect, async (req, res) => {
  try {
    const conversationId = generateConversationId();
    const conversation = await Conversation.create({
      conversationId,
      userId: req.user._id,
      messages: [],
    });
    res.status(201).json({ conversationId: conversation.conversationId, createdAt: conversation.createdAt });
  } catch (error) {
    console.error('Create conversation error:', error.message);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// List user's conversations (most recent first)
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('conversationId updatedAt createdAt messages')
      .lean();

    const items = conversations.map(c => ({
      conversationId: c.conversationId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: Array.isArray(c.messages) ? c.messages.length : 0,
      lastMessage: (c.messages && c.messages.length > 0) ? c.messages[c.messages.length - 1] : null,
    }));

    res.json({ conversations: items });
  } catch (error) {
    console.error('List conversations error:', error.message);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// Create or continue a conversation and get model reply
router.post(
  '/:conversationId/messages',
  protect,
  [body('message').trim().isLength({ min: 1, max: 2000 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conversationId } = req.params;
      const { message } = req.body;

      // Ensure conversation belongs to user or create if not exists
      let conversation = await Conversation.findOne({ conversationId, userId: req.user._id });
      if (!conversation) {
        conversation = await Conversation.create({
          conversationId,
          userId: req.user._id,
          messages: [],
        });
      }

      // Append user's message
      conversation.messages.push({ role: 'user', content: message, timestamp: new Date() });

      // Prepare profile and last 20 messages
      const user = await User.findById(req.user._id).lean();
      const userProfile = { ...user };
      // Remove sensitive fields from profile before sending to model
      delete userProfile.hashedPassword;
      delete userProfile.__v;
      delete userProfile._id;
      delete userProfile.createdAt;
      delete userProfile.updatedAt;
      delete userProfile.isActive;
      delete userProfile.lastLogin;
      delete userProfile.email;
      delete userProfile.username;

      const conversationHistory = conversation.messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      // Call Python model using new contract with one retry on transient errors
      let replyText;
      try {
        replyText = await getModelResponse(
          message,
          userProfile,
          conversationHistory,
          req.user._id.toString()
        );
      } catch (modelErr) {
        const transient = /timed out|unavailable|experiencing issues/i.test(modelErr.message || '');
        if (transient) {
          // small backoff then retry once
          await new Promise(r => setTimeout(r, 1500));
          try {
            replyText = await getModelResponse(
              message,
              userProfile,
              conversationHistory,
              req.user._id.toString()
            );
          } catch (retryErr) {
            return res.status(503).json({ error: retryErr.message || 'Failed to generate response.' });
          }
        } else {
          return res.status(503).json({ error: modelErr.message || 'Failed to generate response.' });
        }
      }

      // Append bot reply
      conversation.messages.push({ role: 'bot', content: replyText, timestamp: new Date() });
      await conversation.save();

      res.json({
        reply: replyText,
        conversationId: conversation.conversationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Chat error:', error.message);
      res.status(500).json({ error: error.message || 'Chat failed' });
    }
  }
);

// Get a conversation (ownership enforced) with optional pagination
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const { limit, before } = req.query;
    const conversation = await Conversation.findOne({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    }).lean();

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    let messages = conversation.messages || [];
    // Pagination: filter messages before a timestamp and limit count
    if (before) {
      const cutoff = new Date(before);
      if (!isNaN(cutoff.getTime())) {
        messages = messages.filter(m => new Date(m.timestamp) < cutoff);
      }
    }
    const lim = Math.min(parseInt(limit || '0', 10) || messages.length, 200);
    if (lim > 0) {
      messages = messages.slice(-lim);
    }

    res.json({ conversation: { conversationId: conversation.conversationId, userId: conversation.userId, messages, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt } });
  } catch (error) {
    console.error('Get conversation error:', error.message);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

module.exports = router;

