const { supabase } = require('./services/supabaseClient');

async function inspectUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Users columns:', Object.keys(data[0]));
    } else {
        console.log('No users found to inspect.');
    }
    process.exit();
}

inspectUsers();
