import axios from 'axios';

// Cache token in memory
let accessToken = null;
let tokenExpiration = 0;

export default async function handler(request, response) {
    // CORS headers
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const client_id = process.env.IGDB_CLIENT_ID || process.env.VITE_IGDB_CLIENT_ID;
        const client_secret = process.env.IGDB_CLIENT_SECRET || process.env.VITE_IGDB_CLIENT_SECRET;

        if (!client_id || !client_secret) {
            console.error('Missing env vars');
            return response.status(500).json({ error: 'Server configuration error' });
        }

        // 1. Get Access Token
        const now = Date.now();
        if (!accessToken || now >= tokenExpiration) {
            try {
                const params = new URLSearchParams();
                params.append('client_id', client_id);
                params.append('client_secret', client_secret);
                params.append('grant_type', 'client_credentials');

                const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', params);
                accessToken = tokenRes.data.access_token;
                tokenExpiration = now + tokenRes.data.expires_in * 1000;
            } catch (err) {
                console.error('Token fetch error:', err.response?.data || err.message);
                throw new Error('Failed to authenticate with Twitch');
            }
        }

        // 2. Extract Query
        // We expect the frontend to send strict JSON: { query: "..." }
        // Vercel parses JSON body automatically if Content-Type is application/json
        const { query } = request.body;

        if (!query) {
            return response.status(400).json({ error: 'Missing query in body' });
        }

        // 3. Forward to IGDB
        const igdbRes = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': client_id,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain' // IGDB query language is plain text
            }
        });

        return response.status(200).json(igdbRes.data);

    } catch (error) {
        console.error('IGDB Proxy Error:', error.response?.data || error.message);
        return response.status(500).json({
            error: 'Failed to fetch from IGDB',
            details: error.response?.data || error.message
        });
    }
}
