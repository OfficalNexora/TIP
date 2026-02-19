
const { Worker } = require('bullmq');
const connection = require('../redisClient');
const analysisWorker = require('./analysisWorker');
const analysisQueue = require('./analysisQueue'); // The Facade

// Processor Function: This runs inside the worker
const jobHandler = async (job) => {
    const { analysisId, filePath, mimetype, requestedAt } = job.data;

    console.log(`[Processor] Processing Analysis ${analysisId}`);

    // Call the original worker logic
    await analysisWorker.process(analysisId, filePath, mimetype);

    console.log(`[Processor] Job for ${analysisId} Completed.`);
    return { status: 'success', analysisId };
};

// Initialization Logic
const initProcessor = async () => {
    // Deterministic init: Wait for Redis connection to stabilize or timeout
    const mode = await analysisQueue.init();

    if (mode === 'REDIS') {
        console.log('[Processor] Initializing BullMQ Worker (Redis Mode)...');
        const worker = new Worker('analysis-scan', jobHandler, {
            connection,
            concurrency: 5,
            lockDuration: 60000,
            limiter: { max: 10, duration: 1000 }
        });

        worker.on('completed', job => console.log(`[Worker:Redis] Job ${job.id} OK`));
        worker.on('failed', (job, err) => console.error(`[Worker:Redis] Job ${job.id} Failed: ${err.message}`));

    } else {
        console.log('[Processor] Initializing In-Memory Handler (Memory Mode)...');
        // Register execution logic with the memory queue
        analysisQueue.setHandler(jobHandler, 5);
    }
};

initProcessor();

module.exports = { jobHandler };
