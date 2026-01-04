
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
    retryStrategy: (times) => {
        // Stop retrying after 3 attempts if this is just a quick dev check
        // In production, you might want to retry forever (or alert).
        const maxRetries = 3;
        if (times > maxRetries) {
            console.error('[Redis] Could not connect after', times, 'attempts. Disabling Queue.');
            return null; // Stop retrying, emit 'error'
        }
        return Math.min(times * 50, 2000);
    }
});

connection.on('connect', () => console.log('[Redis] Connected to Redis.'));
connection.on('error', (err) => {
    // Suppress crash, just log. This allows index.js to fallback to memory.
    // console.error('[Redis] Connection Error:', err.message);
});

module.exports = connection;
