const supabase = require('./src/config/supabase');
const bcrypt = require('bcryptjs');

async function testLoginComponents() {
  console.log('🔍 Testing Login Components...\n');
  
  // Test 1: Database connection
  console.log('1️⃣ Testing Database Connection...');
  try {
    const { data, error } = await supabase
      .from('members')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Database connection failed!');
      console.log('   Error:', error.message);
      return;
    }
    console.log('   ✅ Database connected successfully');
  } catch (err) {
    console.log('   ❌ Database error:', err.message);
    return;
  }
  
  // Test 2: List active members
  console.log('\n2️⃣ Checking Active Members...');
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('reference_number, name, role, status, email')
      .eq('status', 'active');
    
    if (error) {
      console.log('   ❌ Error:', error.message);
    } else if (members.length === 0) {
      console.log('   ⚠️  No active members found!');
      console.log('   You need to create admin accounts first.');
    } else {
      console.log(`   ✅ Found ${members.length} active members:\n`);
      members.forEach((m, i) => {
        console.log(`   ${i + 1}. Reference: ${m.reference_number}`);
        console.log(`      Name: ${m.name}`);
        console.log(`      Role: ${m.role}`);
        console.log(`      Email: ${m.email || 'N/A'}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test 3: JWT Secret
  console.log('3️⃣ Checking JWT Secret...');
  if (process.env.JWT_SECRET) {
    console.log('   ✅ JWT_SECRET is configured');
    console.log('   Value:', process.env.JWT_SECRET.substring(0, 20) + '...');
  } else {
    console.log('   ❌ JWT_SECRET is NOT configured!');
    console.log('   Add JWT_SECRET to .env file');
  }
  
  // Test 4: Frontend URL
  console.log('\n4️⃣ Checking Frontend URL...');
  if (process.env.FRONTEND_URL) {
    console.log('   ✅ FRONTEND_URL is configured');
    console.log('   Value:', process.env.FRONTEND_URL);
  } else {
    console.log('   ⚠️  FRONTEND_URL is not set');
    console.log('   Add FRONTEND_URL=http://localhost:3000 to .env');
  }
  
  // Test 5: Try to verify a password hash
  console.log('\n5️⃣ Testing Password Hashing...');
  try {
    const testPassword = 'test123';
    const hash = await bcrypt.hash(testPassword, 10);
    const isMatch = await bcrypt.compare(testPassword, hash);
    console.log('   ✅ Password hashing works:', isMatch ? 'Yes' : 'No');
  } catch (err) {
    console.log('   ❌ Password hashing error:', err.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 LOGIN TROUBLESHOOTING:');
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ If database connected and members exist:');
  console.log('   - Use one of the reference numbers above');
  console.log('   - Enter the correct password');
  console.log('   - Make sure backend is running (npm start)');
  console.log('   - Frontend should connect to http://localhost:5000');
  console.log('');
  console.log('❌ If you see "Invalid credentials" error:');
  console.log('   - Password might be incorrect');
  console.log('   - Reference number might be wrong');
  console.log('   - Account might be inactive (status != "active")');
  console.log('');
  console.log('⚙️  Common Issues:');
  console.log('   1. Backend not running → Start with: npm start');
  console.log('   2. Wrong URL → Frontend should use http://localhost:5000');
  console.log('   3. CORS error → Check browser console for details');
  console.log('   4. Database error → Check Supabase credentials in .env');
  console.log('');
  console.log('🔐 To reset a password:');
  console.log('   - Contact database admin');
  console.log('   - Or update password_hash directly in database');
  console.log('='.repeat(60));
}

testLoginComponents();
