const { supabase } = require('./services/supabaseClient');

async function fixSchema() {
    console.log('--- Attempting to add model_name column ---');

    // We can use a trick: if we have service_role key, we might be able to run some SQL 
    // but standard Supabase JS doesn't support raw SQL unless an RPC is set up.
    // However, I can check if maybe it's named 'model' instead.

    const { data: testData, error: testError } = await supabase
        .from('analysis_results')
        .insert({
            analysis_id: '8d626887-b95c-44c1-ace5-37651a141cd5',
            result_json: { test: true },
            model: 'test'
        })
        .select();

    if (testError && testError.message.includes("column \"model\" of relation \"analysis_results\" does not exist")) {
        console.log("Column 'model' also does not exist.");
    } else if (testError) {
        console.log("Insert with 'model' failed with different error:", testError.message);
    } else {
        console.log("Success! Column is named 'model'.");
        process.exit(0);
    }

    // If both 'model_name' and 'model' are missing, the worker will fail.
    // I will update the ethics worker to not send model_name if it's missing, 
    // OR try to create the column via an RPC if available (unlikely).
    // Better: I'll update the code to be defensive.

    process.exit(1);
}

fixSchema();
