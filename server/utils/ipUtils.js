/**
 * Utility to extract the clean client IP address, handling proxy headers correctly.
 */
const getClientIP = (req) => {
    // 1. DigitalOcean / Cloudflare / Custom Proxies
    const publicIp = req.headers['x-public-ip'];
    if (publicIp && publicIp !== 'undefined') return publicIp;

    // 2. Standard Forwarded For (can be a comma-separated list: client, proxy1, proxy2)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // 3. Fallback to socket address
    const ip = req.socket.remoteAddress;
    return ip === '::1' ? '127.0.0.1' : ip;
};

module.exports = { getClientIP };
