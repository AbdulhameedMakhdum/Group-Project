import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';

// Cache token in memory for local dev
let accessToken = null;
let tokenExpiration = 0;

async function getTwitchToken(clientId, clientSecret) {
  const now = Date.now();
  if (accessToken && now < tokenExpiration) {
    return accessToken;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', params);
    accessToken = tokenRes.data.access_token;
    tokenExpiration = now + tokenRes.data.expires_in * 1000;
    return accessToken;
  } catch (err) {
    console.error('Local Token fetch error:', err.response?.data || err.message);
    throw new Error('Failed to authenticate with Twitch locally');
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {
          server.middlewares.use('/api/igdb', async (req, res, next) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            const client_id = env.IGDB_CLIENT_ID || env.VITE_IGDB_CLIENT_ID;
            const client_secret = env.IGDB_CLIENT_SECRET || env.VITE_IGDB_CLIENT_SECRET;

            if (!client_id || !client_secret) {
              console.error('Missing env vars for IGDB proxy');
              res.statusCode = 500;
              res.end('Server configuration error: Missing IGDB credentials');
              return;
            }

            // Read body
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                let parsedBody = {};
                try {
                  parsedBody = typeof body === 'string' && body ? JSON.parse(body) : body;
                } catch (e) {
                  // ignore json parse error if it's already object or empty
                }

                const { query } = parsedBody;

                if (!query) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Missing query in body' }));
                  return;
                }

                const token = await getTwitchToken(client_id, client_secret);

                const igdbRes = await axios.post('https://api.igdb.com/v4/games', query, {
                  headers: {
                    'Client-ID': client_id,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain'
                  }
                });

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(igdbRes.data));

              } catch (error) {
                console.error('Local IGDB Proxy Error:', error.response?.data || error.message);
                res.statusCode = 500;
                res.end(JSON.stringify({
                  error: 'Failed to fetch from IGDB locally',
                  details: error.response?.data || error.message
                }));
              }
            });
          });
        }
      }
    ],
  };
});
