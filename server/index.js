require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

// 🚀 Pre-Flight Validation (Fail-Fast)
const { validateEnv, runBootCalibration } = require('./utils/bootDiagnostics');
validateEnv();

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
    const { adminAuth } = require('./middleware/adminAuth');
    const { getKeyStatus } = require('./services/ethicsService');
    const compression = require('compression');
    const notifierService = require('./services/notifierService');
    require('./services/analysisProcessor'); // Start the Worker/Processor

    const app = express();
    const rateLimit = require('express-rate-limit');

    // ============================================================================
    // 0. CORS & Proxy Handshake (ABSOLUTE FIRST)
    // ============================================================================
    // Essential for correct IP detection behind proxies (Zeabur, Railway, Nginx, Ngrok)
    app.set('trust proxy', 1);

    const corsOptions = {
        origin: function (origin, callback) {
            const allowedOrigins = [
                'http://localhost:5173',
                'https://tip-xi.vercel.app',
                'https://unemphatically-unliftable-federico.ngrok-free.dev'
            ];
            
            // Allow all origins for ngrok/dev testing mode, but be explicit about Vercel
            if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('ngrok-free.dev')) {
                callback(null, true);
            } else {
                console.warn(`[CORS Guard] Access denied for origin: ${origin}`);
                callback(null, true); // Still allow but log
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type', 
            'Authorization', 
            'x-public-ip', 
            'x-filename', 
            'Cache-Control', 
            'X-Requested-With', 
            'ngrok-skip-browser-warning', 
            'x-request-timestamp', 
            'x-request-nonce'
        ],
        credentials: true,
        optionsSuccessStatus: 200
    };

    app.use(cors(corsOptions));
    
    // Inject bypass headers for ngrok
    app.use((req, res, next) => {
        res.header('ngrok-skip-browser-warning', 'true');
        next();
    });

    app.use((req, res, next) => {
        if (!isProduction) {
            console.log(`[Diagnostic] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'None'}`);
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
        next();
    });
    // ============================================================================
    // 2. Security & Performance Headers
    // ============================================================================
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(compression());

    // ============================================================================
    // 3. Maintenance Mode & Protection
    // ============================================================================
    const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
    app.use((req, res, next) => {
        if (MAINTENANCE_MODE && !req.path.startsWith('/health') && !req.path.startsWith('/api/diag')) {
            return res.status(503).json({
                error: 'Server is currently undergoing maintenance for a Forensic Engine upgrade. Please try again in a few minutes.',
                code: 'MAINTENANCE_MODE',
                retry_after: 300
            });
        }
        next();
    });

    // ============================================================================
    // 3a. Rate Limiting (DDoS Protection)
    // ============================================================================
    const getRateLimitStore = () => {
        // Skip Redis Store in development or if Redis is not ready
        if (!isProduction || (typeof redisClient !== 'undefined' && redisClient.status !== 'ready')) {
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
    
    // 1. Public Routes (Webhooks & Public Diagnostics)
    app.use('/webhooks', require('./routes/publicRoutes'));
    app.use('/api/demo', require('./routes/demoRoutes'));
    app.use('/api/diag', require('./routes/debugRoutes'));
    app.use('/api/v1/monitor', require('./routes/monitorRoutes'));

    const { aiFirewall } = require('./middleware/aiFirewall');
    const analysisRoutes = require('./routes/analysisRoutes');
    const compareRoutes = require('./routes/compareRoutes');

    // 🛡️ API HANDLERS (Authenticated & Protected)
    app.use('/api/analysis', authMiddleware, aiFirewall, analysisRoutes);
    app.use('/api/analyses', authMiddleware, aiFirewall, analysisRoutes);
    app.use('/api/compare', authMiddleware, aiFirewall, compareRoutes);
    app.use('/api/user', authMiddleware, require('./routes/userRoutes'));
    app.use('/api/admin', authMiddleware, adminAuth, require('./routes/adminRoutes'));
    app.use('/api/security', authMiddleware, require('./routes/securityRoutes'));
    app.use('/api/chat', authMiddleware, require('./routes/chatRoutes'));
    app.use('/api/billing', authMiddleware, require('./routes/billingRoutes'));


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

    // 404 Handler (Last fallback before Error Handler)
    app.use((req, res, next) => {
        if (!isProduction) {
            console.warn(`[404] Resource Not Found: ${req.method} ${req.url}`);
        }
        res.status(404).json({
            error: 'The requested forensic resource was not found.',
            code: 'NOT_FOUND'
        });
    });

    // ============================================================================
    // Global Error Handler (Express)
    // ============================================================================
    app.use((err, req, res, next) => {
        console.error('[Express Error]', err);
        
        // Trigger Dev Alert for 500 errors or critical flags
        const status = err.status || 500;
        if (status === 500 || err.critical) {
            notifierService.sendDevAlert('Express Server Error', { 
                error: err, 
                req,
                category: 'SERVER_ERROR'
            });
        }

        if (res.headersSent) {
            return next(err);
        }
        res.status(status).json({
            error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
            code: err.code || 'INTERNAL_ERROR'
        });
    });

    // ============================================================================
    // Server Start & Boot Calibration
    // ============================================================================
    // Replacement of inline diagnostic logic with utility call
    // Logic moved to server/utils/bootDiagnostics.js

    const server = app.listen(PORT, async () => {
        await runBootCalibration();
        console.log(`[Production] TIP AI Server operational on port ${PORT}`);

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
                console.log('========================================================');
            } catch (err) {
                console.error('[ngrok] Failed to start tunnel:', err.message);
            }
        }
    });

    // 🛡️ Graceful Shutdown Sequence
    const gracefulShutdown = (signal) => {
        console.log(`\n[${signal}] Received. Starting graceful shutdown...`);
        server.close(() => {
            console.log('[Shutdown] HTTP server closed.');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('[Error] [Shutdown] Could not close connections in time, forcing exit.');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ============================================================================
    // Global Error Handlers
    // ============================================================================
    process.on('uncaughtException', (error) => {
        console.error('CRITICAL: Uncaught Exception detected!');
        console.error(error.stack || error);
        notifierService.sendDevAlert('Uncaught Exception (Process Crash)', { 
            error, 
            category: 'CRITICAL_PROCESS'
        });
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('CRITICAL: Unhandled Rejection at path:', promise);
        console.error('Reason:', reason);
        notifierService.sendDevAlert('Unhandled Promise Rejection', { 
            error: reason, 
            category: 'ASYNC_FAILURE'
        });
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
