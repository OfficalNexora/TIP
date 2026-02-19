const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../services/supabaseClient');
const { getIPLocation, parseUA } = require('../services/geoService');

const { getClientIP } = require('../utils/ipUtils');

// Avatar upload config
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
}).single('avatar');

// ============================================================================
// Profile
// ============================================================================

// GET profile
router.get('/profile', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Institutional profile not found.' });
        }

        res.json({
            id: data.id,
            email: data.email,
            firstName: data.full_name?.split(' ')[0] || "",
            lastName: data.full_name?.split(' ').slice(1).join(' ') || "",
            full_name: data.full_name,
            role: data.role || "Auditor",
            organization: data.organization_id || "UNESCO",
            institutional_id: data.institutional_id || data.id.slice(0, 8),
            settings: data.settings || {},
            subscription_status: data.subscription_status,
            avatarUrl: data.avatar_url || null
        });
    } catch (error) {
        console.error('Profile fetch failed:', error);
        res.status(500).json({ error: 'Internal server error during profile retrieval.' });
    }
});

// UPDATE profile
router.post('/profile', async (req, res) => {
    try {
        const { firstName, lastName, roleDescription } = req.body;

        // Strict allowlist: Only these fields can be updated by the user
        const updateData = {};

        // Handle name if provided
        if (firstName !== undefined || lastName !== undefined) {
            // Fetch current name to preserve parts if only one is updated (optional, but safer to just update what is sent)
            // Ideally client sends both, but let's be robust.
            // Actually, strictly constructing full_name from inputs:
            // Note: If client sends only firstName, lastName might be lost if we overwrite full_name.
            // Better: Retrieve current profile first if we want partial updates, OR assume client sends full state.
            // Let's assume client sends what they want to change.
            // But full_name is a single field. We need to prompt user or just update full_name if both are present?
            // Existing code: const fullName = `${firstName || ''} ${lastName || ''}`.trim(); 
            // This existing logic implies if lastName is missing, it becomes empty string.
            // Let's keep existing logic for name construction but ONLY if triggered.

            // However, to avoid clearing last name if not sent, we should probably check what was sent.
            // Let's stick to the existing behavior for name construction to avoid regression, 
            // but CRITICALLY: DO NOT assign `role` or `organization` from req.body to updateData.

            const fullName = `${firstName || ''} ${lastName || ''}`.trim();
            if (fullName) updateData.full_name = fullName;
        }

        // Settings update (roleDescription)
        if (roleDescription !== undefined) {
            const { data: current } = await req.supabase.from('users').select('settings').eq('id', req.user.id).single();
            const existingSettings = current?.settings || {};
            updateData.settings = { ...existingSettings, roleDescription };
        }

        // Perform Update
        // Note: We use req.user.id which comes from the auth middleware (safe).
        const { data, error } = await req.supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        // Audit log
        const ip = getClientIP(req);
        const location = await getIPLocation(ip);
        await supabase.from('security_audit_logs').insert({
            user_id: req.user.id,
            event_type: 'PROFILE_UPDATED',
            status: 'SUCCESS',
            location: location,
            user_agent: req.headers['user-agent'],
            metadata: { fields: Object.keys(updateData) }
        });

        res.json({
            message: 'Profile updated successfully.',
            profile: {
                firstName: data.full_name?.split(' ')[0] || "",
                lastName: data.full_name?.split(' ').slice(1).join(' ') || "",
                // Role and Org return from DB (unchanged), not from input
                role: data.role,
                organization: data.organization_id,
                settings: data.settings
            }
        });
    } catch (error) {
        console.error('Profile update failed:', error);
        res.status(500).json({ error: 'Failed to update institutional profile.' });
    }
});

// ============================================================================
// Avatar
// ============================================================================
router.post('/avatar', (req, res) => {
    avatarUpload(req, res, async (err) => {
        if (err) {
            console.error('[Avatar] Upload error:', err);
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        try {
            const userId = req.user.id;
            const file = req.file;
            const ext = file.originalname.split('.').pop() || 'jpg';
            const storagePath = `${userId}/profile.${ext}`;

            const { error: uploadError } = await req.supabase.storage
                .from('avatars')
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = req.supabase.storage
                .from('avatars')
                .getPublicUrl(storagePath);

            const avatarUrl = urlData.publicUrl;

            const { error: dbError } = await req.supabase
                .from('users')
                .update({ avatar_url: avatarUrl })
                .eq('id', userId);

            if (dbError) throw dbError;

            console.log(`[Avatar] Upload complete: ${avatarUrl}`);
            res.json({ avatarUrl });

        } catch (error) {
            console.error('[Avatar] Upload failed:', error);
            res.status(500).json({ error: 'Failed to upload avatar' });
        }
    });
});

// ============================================================================
// Settings
// ============================================================================
router.post('/settings', async (req, res) => {
    try {
        const { settings } = req.body;

        const { data: current } = await req.supabase
            .from('users')
            .select('settings')
            .eq('id', req.user.id)
            .single();

        const mergedSettings = { ...(current?.settings || {}), ...(settings || {}) };

        const { data, error } = await req.supabase
            .from('users')
            .update({ settings: mergedSettings })
            .eq('id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Settings updated successfully.', data });
    } catch (error) {
        console.error('Settings update failed:', error);
        res.status(500).json({ error: 'Failed to persist settings.' });
    }
});

module.exports = router;
