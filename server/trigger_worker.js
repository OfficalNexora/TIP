const analysisWorker = require('./services/analysisWorker');

async function manualTrigger() {
    const analysisId = '8d626887-b95c-44c1-ace5-37651a141cd5';
    const storagePath = '1766726186489-TEAM TALA FINAL NA FINAL NA.docx';
    const mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log(`--- Manually Triggering Analysis for ${analysisId} ---`);
    await analysisWorker.process(analysisId, storagePath, mimetype);
    console.log('--- Manual Trigger Complete ---');
    process.exit();
}

manualTrigger();
