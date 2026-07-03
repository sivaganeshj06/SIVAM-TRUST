const supabase = require('./src/config/supabase');

async function inspectRpcs() {
  try {
    // Try to run a simple pg query through an RPC or query schemas
    const { data, error } = await supabase.rpc('get_rpcs'); // just a guess
    if (error) {
      console.log('get_rpcs RPC error:', error.message);
    } else {
      console.log('get_rpcs RPC succeeded:', data);
    }
  } catch (err) {
    console.error('Execution error:', err);
  }
}

inspectRpcs();
