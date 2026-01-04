const { supabase } = require('../services/supabaseClient');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Initialize JWKS Client (Keys are cached)
const client = jwksClient({
    jwksUri: process.env.SUPABASE_JWT_URL || `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
});

// Helper to get signing key from JWKS
function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            console.error('[Auth] JWKS Error:', err.message);
            return callback(err, null);
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    try {
        let user;

        // 1. Decode Header to check Algorithm
        const decodedToken = jwt.decode(token, { complete: true });
        if (!decodedToken) throw new Error('Malformed token');

        const { alg } = decodedToken.header;
        // console.log(`[Auth] Verifying Token Alg: ${alg}`);

        // 2. Choose Verification Strategy
        if (alg === 'HS256' && jwtSecret) {
            // STRATEGY A: Symmetric Secret (Fastest Local)
            const decoded = jwt.verify(token, jwtSecret);
            user = mapJwtToUser(decoded);

        } else if (alg === 'RS256' || alg === 'ES256') {
            // STRATEGY B: Asymmetric JWKS (Cached Public Key)
            const decoded = await new Promise((resolve, reject) => {
                jwt.verify(token, getKey, { algorithms: ['RS256', 'ES256'] }, (err, decoded) => {
                    if (err) return reject(err);
                    resolve(decoded);
                });
            });
            user = mapJwtToUser(decoded);

        } else {
            // STRATEGY C: Remote Fallback (Slowest but safest fallback)
            console.warn(`[Auth] Fallback for alg '${alg}'. Checking remote Supabase...`);
            const { data: { user: remoteUser }, error } = await supabase.auth.getUser(token);
            if (error || !remoteUser) throw new Error(error?.message || 'Invalid Token');
            user = {
                id: remoteUser.id,
                email: remoteUser.email,
                role: remoteUser.role,
                app_metadata: remoteUser.app_metadata,
                user_metadata: remoteUser.user_metadata
            };
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('[Auth] Verification failed:', error.message);
        return res.status(401).json({
            error: 'Unauthorized: Invalid or expired token.',
            details: error.message
        });
    }
};

// Helper: Standardize User structure
function mapJwtToUser(decoded) {
    return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || decoded.app_metadata?.role || 'user',
        app_metadata: decoded.app_metadata,
        user_metadata: decoded.user_metadata
    };
}

module.exports = { authMiddleware };
