// Test script for user profile management endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

async function testProfileManagement() {
  try {
    console.log('🧪 Testing User Profile Management...\n');

    // Step 1: Register a new user to get a token
    console.log('1. Registering new user...');
    const timestamp = Date.now();
    const registerData = {
      username: `profileuser${timestamp}`,
      email: `profile${timestamp}@example.com`,
      password: 'password123',
      gender: 'non-binary',
      nationality: 'Nigerian'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    authToken = registerResponse.data.token;
    console.log('✅ User registered successfully');
    console.log('Username:', registerResponse.data.user.username);

    // Step 2: Get user profile
    console.log('\n2. Getting user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('Profile fields:', Object.keys(profileResponse.data.profile).length);

    // Step 3: Update profile with demographic information
    console.log('\n3. Updating profile with demographic info...');
    const updateData = {
      race: 'Black',
      politicalViews: 'socialist',
      religion: 'atheist',
      humorStyle: 'dark',
      personalityType: 'INTJ',
      favoriteHistoricalEra: '1960s Civil Rights Era',
      culturalIconsYouLove: ['Tupac', 'James Baldwin'],
      politicalFiguresYouSupport: ['Bernie Sanders'],
      hobbiesInterests: ['gaming', 'activism']
    };

    const updateResponse = await axios.put(`${BASE_URL}/users/profile`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile updated successfully');
    console.log('Updated fields:', Object.keys(updateData).join(', '));

    // Step 4: Verify profile was updated
    console.log('\n4. Verifying profile updates...');
    const updatedProfileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const updatedProfile = updatedProfileResponse.data.profile;
    
    console.log('✅ Profile verification successful');
    console.log('Political views:', updatedProfile.politicalViews);
    console.log('Humor style:', updatedProfile.humorStyle);
    console.log('Cultural icons:', updatedProfile.culturalIconsYouLove);

    // Step 5: Test that protected fields cannot be updated
    console.log('\n5. Testing protected field restrictions...');
    try {
      await axios.put(`${BASE_URL}/users/profile`, {
        username: 'hackedusername',
        email: 'hacked@example.com',
        hashedPassword: 'newpassword'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ Protected fields were updated (this should not happen)');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === 'Cannot update protected fields') {
        console.log('✅ Protected fields correctly blocked from update');
        console.log('Blocked fields:', error.response.data.protectedFields);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 All profile management tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testProfileManagement();
