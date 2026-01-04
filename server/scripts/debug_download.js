
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Loads from .env in CWD (server/)

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ANALYSIS_ID = 'c725d8a1-57b0-49fc-9657-b953499fb841';

async function debugDownload() {
    console.log(`Checking analysis: ${ANALYSIS_ID}`);

    // 1. Get Metadata
    const { data: analysis, error: dbError } = await supabase
        .from('analyses')
        .select(`
            id, 
            status,
            uploaded_documents (
                filename,
                storage_path,
                file_type
            )
        `)
        .eq('id', ANALYSIS_ID)
        .single();

    if (dbError) {
        console.error("Database Error:", dbError);
        return;
    }

    if (!analysis) {
        console.error("Analysis not found.");
        return;
    }

    console.log("Analysis Record:", JSON.stringify(analysis, null, 2));

    const doc = analysis.uploaded_documents[0];
    if (!doc || !doc.storage_path) {
        console.error("No document found linked to analysis.");
        return;
    }

    console.log(`Attempting download for path: "${doc.storage_path}"`);

    // 2. Attempt Download
    const { data, error: storageError } = await supabase.storage
        .from('audit-uploads')
        .download(doc.storage_path);

    if (storageError) {
        console.error("Storage Download Failed:", storageError);
        console.error("Message:", storageError.message);
    } else {
        console.log("Download Successful!");
        console.log("Size:", data.size, "bytes");
        console.log("Type:", data.type);
    }
}

debugDownload();
