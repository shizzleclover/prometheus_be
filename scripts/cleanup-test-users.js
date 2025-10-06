require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set. Please check your .env file.');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

const cleanupTestUsers = async () => {
  try {
    console.log('🧹 Starting cleanup of test users...');
    
    // Find test users (those with timestamp usernames like "user1759702946410")
    const testUserPattern = /^user\d{13}$/;
    const testUsers = await User.find({
      $or: [
        { username: { $regex: testUserPattern } },
        { email: { $regex: /user\d{13}@example\.com$/ } }
      ]
    });
    
    console.log(`📊 Found ${testUsers.length} test users to delete`);
    
    if (testUsers.length === 0) {
      console.log('✅ No test users found. Database is clean!');
      return;
    }
    
    // Show what we're about to delete
    console.log('\n🗑️  Test users to be deleted:');
    testUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email})`);
    });
    
    // Get user IDs for conversation cleanup
    const testUserIds = testUsers.map(user => user._id);
    
    // Delete conversations for test users
    const deletedConversations = await Conversation.deleteMany({
      userId: { $in: testUserIds }
    });
    console.log(`🗑️  Deleted ${deletedConversations.deletedCount} test conversations`);
    
    // Delete test users
    const deletedUsers = await User.deleteMany({
      _id: { $in: testUserIds }
    });
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} test users`);
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
};

const cleanupAllUsers = async () => {
  try {
    console.log('⚠️  WARNING: This will delete ALL users and conversations!');
    console.log('Are you sure you want to continue? (This is irreversible)');
    
    // In a real script, you might want to add a confirmation prompt
    // For now, we'll add a safety check
    const userCount = await User.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    
    console.log(`📊 Current database state:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Conversations: ${conversationCount}`);
    
    if (userCount === 0) {
      console.log('✅ Database is already empty!');
      return;
    }
    
    // Delete all conversations first
    const deletedConversations = await Conversation.deleteMany({});
    console.log(`🗑️  Deleted ${deletedConversations.deletedCount} conversations`);
    
    // Delete all users
    const deletedUsers = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} users`);
    
    console.log('\n✅ Complete database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Complete cleanup failed:', error.message);
    throw error;
  }
};

const showStats = async () => {
  try {
    const userCount = await User.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    
    console.log('\n📊 Current database statistics:');
    console.log(`   - Total Users: ${userCount}`);
    console.log(`   - Total Conversations: ${conversationCount}`);
    
    // Show recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt');
    
    if (recentUsers.length > 0) {
      console.log('\n👥 Recent users:');
      recentUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - ${user.createdAt.toISOString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to get statistics:', error.message);
  }
};

const main = async () => {
  const command = process.argv[2];
  
  await connectDB();
  
  try {
    switch (command) {
      case 'test':
        await cleanupTestUsers();
        break;
      case 'all':
        await cleanupAllUsers();
        break;
      case 'stats':
        await showStats();
        break;
      default:
        console.log('🧹 Database Cleanup Script');
        console.log('\nUsage:');
        console.log('  node scripts/cleanup-test-users.js test    - Delete only test users (user1234567890@example.com)');
        console.log('  node scripts/cleanup-test-users.js all     - Delete ALL users and conversations (DANGEROUS)');
        console.log('  node scripts/cleanup-test-users.js stats   - Show database statistics');
        console.log('\nExamples:');
        console.log('  npm run cleanup:test   - Clean test users only');
        console.log('  npm run cleanup:all    - Clean everything (dangerous)');
        console.log('  npm run cleanup:stats  - Show stats');
    }
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Script interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

main();
