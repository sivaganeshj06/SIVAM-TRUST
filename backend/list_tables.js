const supabase = require('./src/config/supabase');

async function listTables() {
  console.log('🔍 Checking what tables exist in your database...\n');
  
  // Try different possible table names
  const possibleTables = [
    'donations', 'events', 'members', 
    'contact_messages', 'contact', 'contacts',
    'photos', 'media', 'gallery',
    'notifications'
  ];
  
  const existingTables = [];
  
  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        existingTables.push(table);
        console.log(`✅ Table exists: ${table}`);
      }
    } catch (err) {
      // Table doesn't exist, skip
    }
  }
  
  console.log('\n📋 Your database has these tables:');
  console.log(existingTables.join(', '));
}

listTables();
