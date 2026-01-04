const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    console.log("Checking columns for 'analyses'...");
    const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .limit(1);

    if (analysesError) {
        console.error("Error fetching analyses:", analysesError);
    } else {
        console.log("Columns in 'analyses' table:", Object.keys(analysesData[0] || {}).join(', '));
    }

    console.log("\nChecking columns for 'analysis_results'...");
    const { data: resultsData, error: resultsError } = await supabase
        .from('analysis_results')
        .select('*')
        .limit(1);

    if (resultsError) {
        console.error("Error fetching analysis_results:", resultsError);
    } else {
        console.log("Columns in 'analysis_results' table:", Object.keys(resultsData[0] || {}).join(', '));
    }
}

checkColumns();
