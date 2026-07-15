const supabase = require('./src/config/supabase');

async function testAPIData() {
  console.log('🧪 Testing API Data Fetching...\n');
  
  try {
    // Test 1: Donations
    console.log('1️⃣ Testing Donations...');
    const { data: donations, error: donError } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (donError) {
      console.log('   ❌ Error:', donError.message);
    } else {
      console.log(`   ✅ Found ${donations.length} donations`);
      if (donations.length > 0) {
        const total = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        console.log(`   💰 Total amount: ₹${total}`);
        console.log(`   📊 Sample: ${donations[0].donor_name} - ₹${donations[0].amount}`);
      }
    }
    
    // Test 2: Events
    console.log('\n2️⃣ Testing Events...');
    const { data: events, error: evtError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (evtError) {
      console.log('   ❌ Error:', evtError.message);
    } else {
      console.log(`   ✅ Found ${events.length} events`);
      if (events.length > 0) {
        console.log(`   📅 Sample: ${events[0].title} - ${events[0].event_date}`);
      }
    }
    
    // Test 3: Members
    console.log('\n3️⃣ Testing Members...');
    const { data: members, error: memError } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (memError) {
      console.log('   ❌ Error:', memError.message);
    } else {
      console.log(`   ✅ Found ${members.length} members`);
      if (members.length > 0) {
        console.log(`   👤 Sample: ${members[0].name} - ${members[0].role}`);
        console.log(`   📋 Roles:`, members.map(m => m.role).join(', '));
      }
    }
    
    // Test 4: Contacts
    console.log('\n4️⃣ Testing Contacts...');
    const { data: contacts, error: conError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (conError) {
      console.log('   ❌ Error:', conError.message);
    } else {
      console.log(`   ✅ Found ${contacts.length} contacts`);
      if (contacts.length > 0) {
        console.log(`   📧 Sample: ${contacts[0].name} - ${contacts[0].email}`);
      }
    }
    
    // Test 5: Notifications
    console.log('\n5️⃣ Testing Notifications...');
    const { data: notifications, error: notError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notError) {
      console.log('   ❌ Error:', notError.message);
    } else {
      console.log(`   ✅ Found ${notifications.length} notifications`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Donations: ${donations?.length || 0}`);
    console.log(`Events: ${events?.length || 0}`);
    console.log(`Members: ${members?.length || 0}`);
    console.log(`Contacts: ${contacts?.length || 0}`);
    console.log(`Notifications: ${notifications?.length || 0}`);
    
    if (donations?.length > 0 || events?.length > 0 || members?.length > 0) {
      console.log('\n✅ DATABASE HAS DATA!');
      console.log('If dashboards show no data, the issue is:');
      console.log('1. Frontend not connecting to backend');
      console.log('2. Backend not running');
      console.log('3. CORS blocking requests');
      console.log('4. Authentication failing');
    } else {
      console.log('\n⚠️  Database is empty. Add some data first.');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAPIData();
