const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/auth';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

async function testAuth() {
  try {
    console.log('🧪 Testing EventHub Authentication API...\n');

    // Test 1: Register
    console.log('1️⃣ Testing Registration...');
    const registerResponse = await axios.post(`${API_BASE}/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);
    const { token } = registerResponse.data.data;

    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    const loginToken = loginResponse.data.data.token;

    // Test 3: Verify Token
    console.log('\n3️⃣ Testing Token Verification...');
    const verifyResponse = await axios.get(`${API_BASE}/verify`, {
      headers: { Authorization: `Bearer ${loginToken}` }
    });
    console.log('✅ Token verification successful:', verifyResponse.data.message);

    // Test 4: Get Current User
    console.log('\n4️⃣ Testing Get Current User...');
    const meResponse = await axios.get(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${loginToken}` }
    });
    console.log('✅ Get current user successful:', meResponse.data.data.user.username);

    // Test 5: Logout
    console.log('\n5️⃣ Testing Logout...');
    const logoutResponse = await axios.post(`${API_BASE}/logout`, {}, {
      headers: { Authorization: `Bearer ${loginToken}` }
    });
    console.log('✅ Logout successful:', logoutResponse.data.message);

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAuth();