// Simple API end-to-end tests using axios
const axios = require('axios');

const BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function testAuth() {
  const ts = Date.now();
  const register = await axios.post(`${BASE}/auth/register`, {
    username: `user${ts}`,
    email: `user${ts}@example.com`,
    password: 'password123',
  });
  const token = register.data.token;

  const me = await axios.get(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  return { token, username: me.data.user.username };
}

async function testProfile(token) {
  const update = await axios.put(
    `${BASE}/users/profile`,
    { politicalViews: 'socialist', humorStyle: 'dark' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return update.data.profile;
}

async function testDemographics(token) {
  // Create demographics
  const create = await axios.post(
    `${BASE}/users/demographics`,
    {
      gender: 'non-binary',
      nationality: 'Nigerian',
      race: 'Black',
      tribe: 'Yoruba',
      economicViews: 'socialism',
      politicalFiguresYouSupport: ['Bernie Sanders'],
      languagesSpoken: ['English'],
      sensitivityTopics: [],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Get demographics
  const get = await axios.get(`${BASE}/users/demographics`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Update demographics
  const update = await axios.put(
    `${BASE}/users/demographics`,
    { humorStyle: 'dark', communicationPreference: 'confrontational' },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return { created: create.data.demographics, fetched: get.data.demographics, updated: update.data.demographics };
}

async function testChat(token) {
  const conversationId = `conv_${Date.now()}`;
  const msg1 = await axios.post(
    `${BASE}/chat/${conversationId}/messages`,
    { message: 'What do you think about capitalism?' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return { conversationId, reply: msg1.data.reply };
}

async function run() {
  try {
    console.log('🧪 Running API tests against', BASE);
    const { token, username } = await testAuth();
    console.log('✅ Auth OK:', username);
    const profile = await testProfile(token);
    console.log('✅ Profile OK:', profile.politicalViews, profile.humorStyle);
    const demo = await testDemographics(token);
    console.log('✅ Demographics OK:', demo.updated.humorStyle, demo.updated.communicationPreference);
    const chat = await testChat(token);
    console.log('✅ Chat OK:', chat.conversationId);
    console.log('🎉 All tests passed');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();


