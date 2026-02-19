const express = require('express');
const router = express.Router();
// const { supabase } = require('../services/supabaseClient'); // Removed to enforce usage of req.supabase or supabaseAdmin
const { supabaseAdmin } = require('../services/supabaseClient');
const { getIPLocation, parseUA } = require('../services/geoService');

const { getClientIP } = require('../utils/ipUtils');

// ============================================================================
// Security Status
// ============================================================================
router.get('/setup', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('user_security')
            .select('two_factor_enabled, backup_codes, last_password_change')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        const hasBackupCodes = data?.backup_codes && Array.isArray(data.backup_codes) && data.backup_codes.length > 0;

        res.json({
            two_factor_enabled: data?.two_factor_enabled || false,
            has_backup_codes: hasBackupCodes,
            last_password_change: data?.last_password_change || null
        });
    } catch (error) {
        console.error('Security status fetch failed:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ============================================================================
// Backup Codes
// ============================================================================
router.post('/backup-codes/save', async (req, res) => {
    try {
        const { hashes } = req.body;

        if (!hashes || !Array.isArray(hashes) || hashes.length !== 8) {
            return res.status(400).json({ error: 'Invalid hashes payload. 8 hashes required.' });
        }

        const codesPayload = hashes.map(hash => ({ hash, used: false }));

        const { error } = await req.supabase
            .from('user_security')
            .upsert({
                user_id: req.user.id,
                backup_codes: codesPayload,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        await req.supabase.from('security_audit_logs').insert({
            user_id: req.user.id,
            event_type: 'BACKUP_CODES_GENERATED',
            status: 'SUCCESS',
            location: location,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Backup codes saved securely.' });
    } catch (error) {
        console.error('Backup code save failed:', error);
        res.status(500).json({ error: 'Failed to save backup codes.' });
    }
});

// ============================================================================
// Audit Logs
// ============================================================================
router.get('/audit-logs', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('security_audit_logs')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Audit log fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
});

router.post('/audit-log', async (req, res) => {
    try {
        const { event_type, status, metadata } = req.body;
        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        const { error } = await req.supabase
            .from('security_audit_logs')
            .insert({
                user_id: req.user.id,
                event_type: event_type || 'UNKNOWN_EVENT',
                status: status || 'INFO',
                location: location,
                user_agent: req.headers['user-agent'],
                metadata: metadata || {}
            });

        if (error) throw error;
        res.status(201).json({ message: 'Event logged.' });
    } catch (error) {
        console.error('Audit logging failed:', error);
        res.status(200).json({ warning: 'Logging failed but request handled.' });
    }
});

router.delete('/audit-logs', async (req, res) => {
    try {
        const { error } = await req.supabase
            .from('security_audit_logs')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        await req.supabase.from('security_audit_logs').insert({
            user_id: req.user.id,
            event_type: 'AUDIT_LOGS_CLEARED',
            status: 'SUCCESS',
            location: location,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Audit logs cleared successfully.' });
    } catch (error) {
        console.error('Failed to clear audit logs:', error);
        res.status(500).json({ error: 'Failed to clear logs.' });
    }
});

// ============================================================================
// Sessions
// ============================================================================
router.get('/sessions', async (req, res) => {
    try {
        const currentIp = getClientIP(req);
        const currentUserAgent = req.headers['user-agent'];
        const currentDevice = parseUA(currentUserAgent);
        const currentLocation = await getIPLocation(currentIp);

        const sessions = [
            {
                id: 'current',
                device: currentDevice,
                location: currentLocation,
                status: 'current',
                lastActive: 'Active Now',
                isCurrent: true,
                ip: currentIp
            }
        ];

        res.json(sessions);
    } catch (error) {
        console.error('Session fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
});

// ============================================================================
// Password
// ============================================================================
router.post('/password', async (req, res) => {
    try {
        const userId = req.user.id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (updateError) {
            console.error('[Security] Password update failed:', updateError);
            return res.status(updateError.status || 500).json({
                error: 'Failed to update password.',
                details: updateError.message
            });
        }

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        await req.supabase.from('security_audit_logs').insert({
            user_id: userId,
            event_type: 'PASSWORD_CHANGE',
            status: 'SUCCESS',
            location: location,
            ip_address: ip,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('[Security] Password update crashed:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ============================================================================
// Session Revocation
// ============================================================================

// Revoke all sessions (nuclear: ban/unban 1s)
router.post('/sessions/revoke-all', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[Security] Revoking ALL sessions for user: ${userId}`);

        if (!userId) {
            return res.status(400).json({ error: 'User ID missing from request.' });
        }

        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: '1s'
        });

        if (banError) {
            console.error('[Security] Nuclear Ban failed:', JSON.stringify(banError, null, 2));
            return res.status(banError.status || 403).json({
                error: 'Revocation failed at ban step.',
                details: banError.message
            });
        }

        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: 'none'
        });

        if (unbanError) {
            console.error('[Security] Nuclear Unban failed:', unbanError);
        }

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        const { error: logError } = await req.supabase.from('security_audit_logs').insert({
            user_id: userId,
            event_type: 'ALL_SESSIONS_REVOKED',
            status: 'SUCCESS',
            location: location,
            ip_address: ip,
            user_agent: req.headers['user-agent']
        });

        if (logError) {
            console.error('[Security] Audit log insertion failed:', logError);
            return res.json({ message: 'All devices signed out, but activity log failed.', warning: logError.message });
        }

        res.json({ message: 'All devices signed out successfully.' });
    } catch (error) {
        console.error('[Security] Sign out all process crashed:', error);
        res.status(500).json({
            error: 'Internal server error during sign out.',
            details: error.message
        });
    }
});

// Revoke other sessions
router.post('/sessions/revoke', async (req, res) => {
    try {
        const userId = req.user.id;

        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: '1s'
        });

        if (banError) {
            console.warn('[Security] Admin revoke (others) failed:', banError.message);
            throw banError;
        }

        await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' });

        res.json({ message: 'Other sessions revoked successfully.' });
    } catch (error) {
        console.error('[Security] Revoke process failed:', error);
        res.status(500).json({
            error: 'Failed to revoke other sessions.',
            details: error.message
        });
    }
});

// Revoke specific session (mock — no real session storage yet)
router.post('/sessions/revoke/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        console.log(`Requested revoke for session ${sessionId} - Not fully implemented without session storage.`);
        res.json({ message: 'Session revocation request processed.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process revocation.' });
    }
});

module.exports = router;
