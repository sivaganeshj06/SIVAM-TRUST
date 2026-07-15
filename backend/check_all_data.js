const supabase = require('./src/config/supabase');

async function checkAllData() {
  console.log('🔍 Checking all database tables...\n');
  
  const tables = ['donations', 'events', 'members', 'contact_messages', 'photos', 'notifications'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${data.length} rows`);
        if (data.length > 0) {
          console.log(`   Sample:`, JSON.stringify(data[0], null, 2).substring(0, 200));
        }
      }
    } catch (err) {
      console.error(`❌ ${table}: Exception -`, err.message);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('If all tables show 0 rows, your database is empty (which is normal for a new system).');
  console.log('Data will appear once you add donations, events, members, etc.');
}

checkAllData();
