const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected (must be logged in)

// Allowed demographics fields for updates
const DEMOGRAPHIC_FIELDS = [
  'gender', 'nationality', // Now in demographics, not registration
  'race','tribe','skinColor','disabilities','politicalViews','moralAlignment','historicalFigureResonates','historicalFigureLiked','historicalFigureHated','additionalInfo',
  'religion','religiousIntensity','culturalBackground','primaryLanguage','languagesSpoken',
  'economicViews','socialValues','religiousPhilosophy','environmentalStance','controversialTopicStances',
  'sexualOrientation','relationshipStatus','parentalStatus','generationalIdentity','urbanRuralSuburban',
  'personalityType','humorStyle','communicationPreference','sensitivityTopics',
  'favoriteHistoricalEra','leastFavoriteHistoricalEra','culturalIconsYouLove','culturalIconsYouHate',
  'politicalFiguresYouSupport','politicalFiguresYouOppose','mediaConsumption','hobbiesInterests'
];

// GET DEMOGRAPHICS
router.get('/demographics', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-hashedPassword');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const demo = {};
    for (const key of DEMOGRAPHIC_FIELDS) if (user[key] !== undefined) demo[key] = user[key];
    // Include gender/nationality if set (now part of demographics)
    if (user.gender) demo.gender = user.gender;
    if (user.nationality) demo.nationality = user.nationality;
    res.json({ demographics: demo });
  } catch (error) {
    console.error('Get demographics error:', error);
    res.status(500).json({ error: 'Failed to get demographics' });
  }
});

// UPDATE DEMOGRAPHICS
router.put('/demographics', protect, async (req, res) => {
  try {
    // Whitelist only demographics fields
    const updateSet = {};
    for (const key of DEMOGRAPHIC_FIELDS) if (key in req.body) updateSet[key] = req.body[key];

    // Gender and nationality are now part of demographics
    if ('gender' in req.body) updateSet.gender = req.body.gender;
    if ('nationality' in req.body) updateSet.nationality = req.body.nationality;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateSet },
      { new: true, runValidators: true }
    ).select('-hashedPassword');

    const demo = {};
    for (const key of DEMOGRAPHIC_FIELDS) if (user[key] !== undefined) demo[key] = user[key];
    if (user.gender) demo.gender = user.gender;
    if (user.nationality) demo.nationality = user.nationality;

    res.json({ message: 'Demographics updated successfully', demographics: demo });
  } catch (error) {
    console.error('Update demographics error:', error);
    res.status(500).json({ error: 'Failed to update demographics' });
  }
});

// CREATE DEMOGRAPHICS (initial profile details)
router.post('/demographics', protect, async (req, res) => {
  try {
    const updateSet = {};
    for (const key of DEMOGRAPHIC_FIELDS) if (key in req.body) updateSet[key] = req.body[key];

    // If user doesn't have required fields yet, allow setting them here
    if ('gender' in req.body) updateSet.gender = req.body.gender;
    if ('nationality' in req.body) updateSet.nationality = req.body.nationality;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateSet },
      { new: true, runValidators: true }
    ).select('-hashedPassword');

    const demo = {};
    for (const key of DEMOGRAPHIC_FIELDS) if (user[key] !== undefined) demo[key] = user[key];
    if (user.gender) demo.gender = user.gender;
    if (user.nationality) demo.nationality = user.nationality;

    res.status(201).json({ message: 'Demographics created', demographics: demo });
  } catch (error) {
    console.error('Create demographics error:', error);
    res.status(500).json({ error: 'Failed to create demographics' });
  }
});

// GET USER PROFILE
router.get('/profile', protect, async (req, res) => {
  try {
    // req.user already has the user data from protect middleware
    res.json({ profile: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// UPDATE USER PROFILE
router.put('/profile', protect, async (req, res) => {
  try {
    const {
      // Don't allow updating these fields - explicitly remove them
      username, email, hashedPassword, _id, createdAt, updatedAt, __v,
      ...allowedUpdates
    } = req.body;
    
    // Check if user tried to update protected fields
    const protectedFields = ['username', 'email', 'hashedPassword', '_id', 'createdAt', 'updatedAt', '__v'];
    const attemptedProtectedUpdates = protectedFields.filter(field => req.body.hasOwnProperty(field));
    
    if (attemptedProtectedUpdates.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot update protected fields',
        protectedFields: attemptedProtectedUpdates
      });
    }
    
    // Update user with allowed fields only
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true } // Return updated doc, validate fields
    ).select('-hashedPassword');
    
    res.json({
      message: 'Profile updated successfully',
      profile: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// DELETE ACCOUNT (soft delete)
router.delete('/profile', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
