require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

// Cluster Mode: Only for Production to utilize multiple cores
const isProduction = process.env.NODE_ENV === 'production';

if (cluster.isMaster && isProduction) {
    console.log(`[Master] running on PID ${process.pid}`);
    console.log(`[Master] Forking ${numCPUs} workers for production cluster...`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.warn(`[Master] Worker ${worker.process.pid} died. Forking a new one...`);
        cluster.fork();
    });
} else {
    // Single process for Development or Worker processes in Production
    if (cluster.isMaster && !isProduction) {
        console.log(`[Dev] Running in single-process mode (PID ${process.pid})`);
    } else {
        console.log(`[Worker] Starting worker process (PID ${process.pid})`);
    }

    console.log('[Diagnostic] Initializing Express Application...');
    // Worker process runs the Express app
    const PORT = process.env.PORT || 3000;
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const { authMiddleware } = require('./middleware/authMiddleware');
    const { getKeyStatus } = require('./services/ethicsService');
    const compression = require('compression');
    require('./services/analysisProcessor'); // Start the Worker/Processor

    const app = express();
    const rateLimit = require('express-rate-limit');

    // Essential for correct IP detection behind proxies (Zeabur, Railway, Nginx, Ngrok)
    app.set('trust proxy', 1);

    // ============================================================================
    // 0. Diagnostic Logger (Very First)
    // ============================================================================
    app.use((req, res, next) => {
        if (!isProduction) {
            console.log(`[Diagnostic] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'None'}`);
            // Prevent caching in development to ensure diagnostic accuracy
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
        next();
    });

    // ============================================================================
    // 1. CORS Configuration
    // ============================================================================
    const corsOptions = {
        origin: isProduction ? (process.env.CLIENT_URL || '*') : true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-public-ip', 'x-filename', 'Cache-Control', 'X-Requested-With', 'ngrok-skip-browser-warning'],
        credentials: true,
        optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));


    // ============================================================================
    // 2. Security & Performance Headers
    // ============================================================================
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(compression());

    // ============================================================================
    // 3. Rate Limiting (DDoS Protection)
    // ============================================================================
    const getRateLimitStore = () => {
        // Skip Redis Store in development or if Redis is not ready
        if (!isProduction || redisClient.status !== 'ready') {
            return undefined; // Falls back to express-rate-limit internal memory store
        }
        try {
            return new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
            });
        } catch (err) {
            console.warn('[RateLimit] RedisStore failed, falling back to Memory:', err.message);
            return undefined;
        }
    };

    if (isProduction) {
        const globalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 5000,
            standardHeaders: true,
            legacyHeaders: false,
            store: getRateLimitStore(),
            skip: (req) => req.method === 'OPTIONS',
            message: { error: 'Too many requests, please try again later.' }
        });
        app.use(globalLimiter);
    } else {
        console.log('[Diagnostic] Rate Limiter DISABLED (Development Mode)');
    }

    // Skip body parsing for binary upload routes to prevent Express from
    // consuming the raw stream before busboy/manual handlers can read it.
    const jsonParser = express.json({ limit: '10mb' });
    const urlencodedParser = express.urlencoded({ extended: true, limit: '10mb' });
    app.use((req, res, next) => {
        if (req.path.endsWith('/upload-binary')) {
            return next();
        }
        jsonParser(req, res, (err) => {
            if (err) return next(err);
            urlencodedParser(req, res, next);
        });
    });


    // ============================================================================
    // Route Mounts
    // ============================================================================
    const analysisRoutes = require('./routes/analysisRoutes');
    const billingRoutes = require('./routes/billingRoutes');
    const chatRoutes = require('./routes/chatRoutes');
    const userRoutes = require('./routes/userRoutes');
    const securityRoutes = require('./routes/securityRoutes');

    // Public Webhooks (No Auth)
    const publicRoutes = require('./routes/publicRoutes');
    app.use('/webhooks', publicRoutes);

    // Auth gate for all /api paths
    app.use('/api', authMiddleware);

    // Analysis routes (note: original used both /api/analysis and /api/analyses)
    app.use('/api/analysis', analysisRoutes);    // POST /api/analysis (init)
    app.use('/api/analyses', analysisRoutes);    // GET/PUT/DELETE /api/analyses/:id, GET /api/analyses

    // Domain routes
    app.use('/api/billing', billingRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/security', securityRoutes);

    // ============================================================================
    // Debug & Health
    // ============================================================================
    app.get('/api/debug/key-status', async (req, res) => {
        try {
            const status = getKeyStatus();
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ============================================================================
    // Global Error Handler (Express)
    // ============================================================================
    app.use((err, req, res, next) => {
        console.error('[Express Error]', err);
        if (res.headersSent) {
            return next(err);
        }
        res.status(err.status || 500).json({
            error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
            code: err.code || 'INTERNAL_ERROR'
        });
    });

    // ============================================================================
    // Server Start
    // ============================================================================
    app.listen(PORT, async () => {
        console.log(`Server running on http://localhost:${PORT}`);

        // Start ngrok tunnel in development if token is present
        if (!isProduction && process.env.NGROK_AUTHTOKEN) {
            try {
                const ngrok = require('@ngrok/ngrok');
                const listener = await ngrok.connect({
                    addr: PORT,
                    authtoken: process.env.NGROK_AUTHTOKEN
                });
                console.log('========================================================');
                console.log(`[ngrok] TUNNEL ACTIVE: ${listener.url()}`);
                console.log(`[ngrok] Use this URL in your frontend .env (VITE_API_BASE_URL)`);
                console.log('========================================================');
            } catch (err) {
                console.error('[ngrok] Failed to start tunnel:', err.message);
            }
        }
    });

    // ============================================================================
    // Global Error Handlers
    // ============================================================================
    process.on('uncaughtException', (error) => {
        console.error('CRITICAL: Uncaught Exception detected!');
        console.error(error.stack || error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('CRITICAL: Unhandled Rejection at path:', promise);
        console.error('Reason:', reason);
    });

    // Heartbeat (conditional on non-production for reduced noise)
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Diagnostic] Heartbeat started (dev mode).');
        setInterval(() => {
            console.log(`[Heartbeat] Alive at ${new Date().toLocaleTimeString()} | Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
        }, 30000); // 30s in dev, disabled in prod
    }

    process.on('exit', (code) => {
        console.log(`[Diagnostic] Process exiting with code: ${code}`);
    });
}
