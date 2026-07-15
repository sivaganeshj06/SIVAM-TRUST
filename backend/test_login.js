const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login Functionality...\n');
  
  const API_URL = 'http://localhost:5000';
  
  // Test 1: Check if backend is running
  console.log('1️⃣ Testing Backend Health...');
  try {
    const healthCheck = await axios.get(`${API_URL}/`);
    console.log('   ✅ Backend is running:', healthCheck.data);
  } catch (err) {
    console.log('   ❌ Backend is NOT running!');
    console.log('   Error:', err.message);
    console.log('\n   ⚠️  START THE BACKEND FIRST:');
    console.log('   cd trust-website/backend');
    console.log('   npm start\n');
    return;
  }
  
  // Test 2: Try to login with founder credentials
  console.log('\n2️⃣ Testing Login with Founder Credentials...');
  try {
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      reference_number: 'STF/2026/FOU',
      password: 'your_password_here' // Replace with actual password
    });
    
    console.log('   ✅ Login successful!');
    console.log('   User:', loginResponse.data.user.name);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
    
  } catch (err) {
    if (err.response) {
      console.log('   ❌ Login failed!');
      console.log('   Status:', err.response.status);
      console.log('   Error:', err.response.data.error);
      
      if (err.response.status === 401) {
        console.log('\n   💡 This means:');
        console.log('   - Reference number or password is incorrect');
        console.log('   - User account might be inactive');
        console.log('   - Password hash might not match');
      } else if (err.response.status === 400) {
        console.log('\n   💡 This means:');
        console.log('   - Missing reference number or password');
        console.log('   - Invalid request format');
      }
    } else {
      console.log('   ❌ Network error!');
      console.log('   Error:', err.message);
    }
  }
  
  // Test 3: Check CORS
  console.log('\n3️⃣ Testing CORS Configuration...');
  try {
    const response = await axios.options(`${API_URL}/api/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    });
    console.log('   ✅ CORS is configured correctly');
  } catch (err) {
    console.log('   ⚠️  CORS might have issues');
    console.log('   Error:', err.message);
  }
  
  // Test 4: List available members
  console.log('\n4️⃣ Checking Available Members...');
  const supabase = require('./src/config/supabase');
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('reference_number, name, role, status')
      .eq('status', 'active');
    
    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ Found ${members.length} active members:`);
      members.forEach(m => {
        console.log(`      - ${m.reference_number} → ${m.name} (${m.role})`);
      });
      
      console.log('\n   💡 Use these reference numbers to login');
    }
  } catch (err) {
    console.log('   ❌ Database error:', err.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 TROUBLESHOOTING GUIDE:');
  console.log('='.repeat(50));
  console.log('1. Make sure backend is running: npm start');
  console.log('2. Check .env file has correct credentials');
  console.log('3. Verify database connection is working');
  console.log('4. Use correct reference number from list above');
  console.log('5. Make sure password is correct');
  console.log('6. Check frontend is connecting to http://localhost:5000');
  console.log('='.repeat(50));
}

testLogin();
