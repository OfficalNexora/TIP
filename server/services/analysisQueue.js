
const { Queue } = require('bullmq');
const connection = require('../redisClient');

// ============================================================================
// IN-MEMORY QUEUE IMPLEMENTATION (Production-Grade Fallback)
// ============================================================================
// This is used when Redis is unavailable. It mimics BullMQ's API
// but enforces concurrency limits within the Node process.
// It is SAFE for single-instance deployments.

class MemoryQueue {
    constructor(queueName, options = {}) {
        this.name = queueName;
        this.jobs = []; // Queue buffer
        this.activeCount = 0;
        this.concurrency = 5; // Default concurrency
        this.handler = null;  // The worker function
        this.isPaused = false;

        console.log(`[Queue] Initialized In-Memory Queue "${queueName}" (Redis Unavailable)`);
    }

    // Producer Method
    async add(name, data, opts) {
        const job = {
            id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            data,
            timestamp: Date.now(),
            opts
        };

        console.log(`[MemoryQueue] Job ${job.id} added to buffer.`);
        this.jobs.push(job);
        this._processNext(); // Try to process immediately
        return job;
    }

    // Consumer Method (Registration)
    setHandler(handler, concurrency = 5) {
        this.handler = handler;
        this.concurrency = concurrency;
        console.log(`[MemoryQueue] Handler registered with concurrency: ${concurrency}`);
        this._processNext(); // Start processing if jobs exist
    }

    // Internal Loop
    async _processNext() {
        if (this.isPaused || !this.handler || this.jobs.length === 0) return;
        if (this.activeCount >= this.concurrency) return;

        // Take job
        const job = this.jobs.shift();
        this.activeCount++;

        // Process async
        try {
            console.log(`[MemoryQueue] Processing Job ${job.id}... (Active: ${this.activeCount})`);
            await this.handler(job); // jobHandler expects { data }
            console.log(`[MemoryQueue] Job ${job.id} COMPLETED.`);
        } catch (error) {
            console.error(`[MemoryQueue] Job ${job.id} FAILED:`, error);
        } finally {
            this.activeCount--;
            this._processNext(); // Trigger next
        }
    }
}

// ============================================================================
// INFRASTRUCTURE SELECTION
// ============================================================================

let analysisQueue;
let isRedisAvailable = false;

// We check if IORedis successfully connected or if we should fallback.
// Since redisClient suppresses errors, we rely on a quick check or default behavior.
// Ideally, we'd wait for 'ready' event, but for sync export we use a Proxy or lazy load?
// Simpler strategy: Exports a facade.

const queueFacade = {
    _redisQueue: null,
    _memoryQueue: null,
    _mode: 'PENDING',

    async init() {
        // Wait 100ms to see if Redis connects or fails
        if (connection.status === 'ready' || connection.status === 'connecting') {
            try {
                this._redisQueue = new Queue('analysis-scan', {
                    connection,
                    defaultJobOptions: {
                        attempts: 3,
                        removeOnComplete: 1000,
                        removeOnFail: 5000
                    }
                });
                await this._redisQueue.waitUntilReady(); // Waits for Redis to actually be ready
                this._mode = 'REDIS';
                console.log('[Queue] BullMQ (Redis) is ACTIVE.');
            } catch (err) {
                console.warn('[Queue] Redis connection failed during init. Switching to Memory.');
                this._mode = 'MEMORY';
                this._memoryQueue = new MemoryQueue('analysis-scan-mem');
            }
        } else {
            this._mode = 'MEMORY';
            this._memoryQueue = new MemoryQueue('analysis-scan-mem');
        }
    },

    async add(name, data, opts) {
        if (this._mode === 'PENDING') {
            // Lazy init if not ready (or just default/race)
            // For now, assume Memory if Redis isn't explicit
            if (connection.status === 'ready') {
                // Late bind Redis
                if (!this._redisQueue) {
                    this._redisQueue = new Queue('analysis-scan', { connection });
                    this._mode = 'REDIS';
                }
            } else {
                if (!this._memoryQueue) {
                    this._memoryQueue = new MemoryQueue('analysis-scan-mem');
                    this._mode = 'MEMORY';
                }
            }
        }

        if (this._mode === 'REDIS') {
            return this._redisQueue.add(name, data, opts);
        } else {
            return this._memoryQueue.add(name, data, opts);
        }
    },

    setHandler(handler, concurrency) {
        // Called by analysisProcessor.js
        if (this._mode === 'PENDING') {
            // Force init based on current connection status
            if (connection.status === 'ready') this._mode = 'REDIS'; // Worker will use separate Worker class
            else {
                this._mode = 'MEMORY';
                this._memoryQueue = new MemoryQueue('analysis-scan-mem');
            }
        }

        if (this._mode === 'MEMORY') {
            this._memoryQueue.setHandler(handler, concurrency);
        }
        // If REDIS, the Worker class (bullmq) handles it separately in analysisProcessor.js
        // But we can expose a hook if needed.
    },

    getMode() { return this._mode; }
};

module.exports = queueFacade;
