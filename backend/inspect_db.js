const supabase = require('./src/config/supabase');

async function inspectDb() {
  try {
    // Try to fetch one row from a 'notifications' table to see if it exists
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error querying notifications table:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('Notifications table exists! Sample data:', data);
    }
  } catch (err) {
    console.error('Execution error:', err);
  }
}

inspectDb();
