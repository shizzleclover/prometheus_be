const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { generateResponse } = require('../utils/modelAPI');

const router = express.Router();

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
      conversation.messages.push({ role: 'user', content: message });

      // Prepare profile and last 20 messages
      const user = await User.findById(req.user._id).lean();
      const userProfile = { ...user };
      delete userProfile.hashedPassword;

      const conversationHistory = conversation.messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      // Call Python model
      const model = await generateResponse({ message, userProfile, conversationHistory });

      // Append bot reply
      conversation.messages.push({ role: 'bot', content: model.reply });
      await conversation.save();

      res.json({
        reply: model.reply,
        confidence: model.confidence,
        processingTime: model.processingTime,
        conversationId: conversation.conversationId,
      });
    } catch (error) {
      console.error('Chat error:', error.message);
      res.status(500).json({ error: error.message || 'Chat failed' });
    }
  }
);

// Get a conversation (ownership enforced)
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error.message);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

module.exports = router;

