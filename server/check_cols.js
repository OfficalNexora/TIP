const { supabase } = require('./services/supabaseClient');

async function checkColumns() {
    console.log('--- Checking analysis_results columns ---');

    // Attempt to fetch a single row to see keys
    const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching record:', error.message);
        // Try to get columns via an insert error (often reveals schema)
        const { error: insError } = await supabase.from('analysis_results').insert({}).select();
        console.log('Insert Error Hint:', insError);
    } else {
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No data. Attempting to get column list via raw SQL check if possible, or just trying to insert with model_name to see failure.');
            const { error: modelError } = await supabase.from('analysis_results').insert({ model_name: 'test' }).select();
            console.log('Model Name Insert Error:', modelError);
        }
    }
    process.exit();
}

checkColumns();
