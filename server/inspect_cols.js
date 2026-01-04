const { supabase } = require('./services/supabaseClient');

async function listColumns() {
    console.log('--- Column List for analyses ---');

    // We can't use standard SQL, but we can try to fetch a single row or use an RPC if available.
    // However, a simple way is to use a "query to non-existent column" to trigger an error that might list available columns, 
    // or just fetch one row and check keys.
    const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching columns:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Column names found in record:', Object.keys(data[0]));
        } else {
            console.log('No records found to inspect keys. Attempting to insert empty to get constraint error...');
            const { error: insError } = await supabase.from('analyses').insert({}).select();
            console.log('Insert Error (contains hints):', insError.message);
        }
    }

    process.exit();
}

listColumns();
