const { supabase } = require('../services/supabaseClient');

const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // console.warn('[Auth] No token provided'); // Reduce log spam
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET; // Must be in .env

    try {
        let user;

        if (jwtSecret) {
            // FAST PATH: Local Verification
            // Note: Supabase tokens are signed with HS256 and the project specific JWT Secret.
            const decoded = jwt.verify(token, jwtSecret);

            // Map Supabase JWT structure to req.user
            user = {
                id: decoded.sub,
                email: decoded.email,
                role: decoded.role || 'user', // 'authenticated' usually
                user_metadata: decoded.user_metadata
            };

            // console.log(`[Auth-Local] ✓ ${user.email}`);

        } else {
            // SLOW PATH: Remote Verification (Fallback)
            console.warn('[Auth] SUPABASE_JWT_SECRET missing. Falling back to remote auth (SLOW).');
            const { data: { user: remoteUser }, error } = await supabase.auth.getUser(token);

            if (error || !remoteUser) throw new Error(error?.message || 'Invalid Token');

            user = {
                id: remoteUser.id,
                email: remoteUser.email,
                role: remoteUser.role
            };
        }

        req.user = user;
        next();

    } catch (error) {
        // console.error('[Auth] Validation failed:', error.message);
        return res.status(401).json({
            error: 'Unauthorized: Invalid or expired token.',
            details: error.message
        });
    }
};


module.exports = { authMiddleware };
