const http = require('http');

/**
 * Resolves an IP address to a location string (e.g., "Manila, PH").
 * Uses ip-api.com (Free tier).
 */
async function getIPLocation(ip) {
    // Handle local development
    if (ip === '::1' || ip === '127.0.0.1' || !ip || ip.includes('localhost')) {
        return 'Local Development';
    }

    return new Promise((resolve) => {
        // We use http because the free tier of ip-api.com uses http
        http.get(`http://ip-api.com/json/${ip}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'success') {
                        resolve(`${json.city}, ${json.countryCode}`);
                    } else {
                        resolve('Unknown Location');
                    }
                } catch (e) {
                    resolve('Unknown Location');
                }
            });
        }).on('error', (err) => {
            console.error('GeoLocation lookup failed:', err);
            resolve('Unknown Location');
        });
    });
}

/**
 * Simple parser to convert User Agent string to human-readable format.
 */
function parseUA(ua) {
    if (!ua) return 'Unknown Device';

    let device = 'Unknown Device';
    if (ua.includes('Windows')) device = 'Windows PC';
    else if (ua.includes('Macintosh')) device = 'Mac';
    else if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('Android')) device = 'Android';

    let browser = '';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';

    return browser ? `${device} • ${browser}` : device;
}

module.exports = { getIPLocation, parseUA };
