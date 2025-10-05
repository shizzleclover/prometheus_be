const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // REQUIRED FIELDS
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  acceptedTermsAndConditions: {
    type: Boolean,
    required: true,
    default: false
  },
  gender: String,
  nationality: String,
  
  // OPTIONAL DEMOGRAPHICS
  race: String,
  tribe: String,
  skinColor: String,
  disabilities: [String],
  politicalViews: String,
  moralAlignment: String,
  historicalFigureResonates: String,
  historicalFigureLiked: String,
  historicalFigureHated: String,
  additionalInfo: String,
  
  // CULTURAL/RELIGIOUS
  religion: String,
  religiousIntensity: String,
  culturalBackground: String,
  primaryLanguage: String,
  languagesSpoken: [String],
  
  // IDEOLOGICAL
  economicViews: String,
  socialValues: String,
  religiousPhilosophy: String,
  environmentalStance: String,
  controversialTopicStances: {
    abortion: String,
    guns: String,
    immigration: String
  },
  
  // PERSONAL IDENTITY
  sexualOrientation: String,
  relationshipStatus: String,
  parentalStatus: String,
  generationalIdentity: String,
  urbanRuralSuburban: String,
  
  // PERSONALITY
  personalityType: String,
  humorStyle: String,
  communicationPreference: String,
  sensitivityTopics: [String],
  
  // HISTORICAL/CULTURAL
  favoriteHistoricalEra: String,
  leastFavoriteHistoricalEra: String,
  culturalIconsYouLove: [String],
  culturalIconsYouHate: [String],
  
  // MEDIA/INTERESTS
  politicalFiguresYouSupport: [String],
  politicalFiguresYouOppose: [String],
  mediaConsumption: [String],
  hobbiesInterests: [String],
  
  // METADATA
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);
