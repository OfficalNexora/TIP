const { supabase } = require('./services/supabaseClient');

async function debugAnalysis() {
    const id = '93b33b85-365a-42be-ac7d-0adea1f06138';
    console.log(`--- Debugging Analysis ${id} ---`);

    const { data: analysis, error: aError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();

    console.log('Analysis Record:', analysis || aError);

    const { data: docs, error: dError } = await supabase
        .from('uploaded_documents')
        .select('*')
        .eq('analysis_id', id);

    console.log('Uploaded Documents:', docs || dError);

    process.exit();
}

debugAnalysis();
