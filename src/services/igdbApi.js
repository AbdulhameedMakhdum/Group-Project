import axios from 'axios';

const CLIENT_ID = import.meta.env.VITE_IGDB_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_IGDB_CLIENT_SECRET;

let accessToken = null;
let tokenExpiration = 0;

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_BASE_URL = 'https://api.igdb.com/v4';

// Get OAuth token from Twitch (used for IGDB)
const getAccessToken = async () => {
    const now = Date.now();

    // reuse token if still valid
    if (accessToken && now < tokenExpiration) {
        return accessToken;
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');

        const { data } = await axios.post(TOKEN_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        accessToken = data.access_token;
        tokenExpiration = now + data.expires_in * 1000;
        return accessToken;
    } catch (error) {
        console.error(
            'Error fetching access token:',
            error?.response?.data || error.message
        );
        throw error;
    }
};

// Axios instance that talks directly to IGDB
const api = axios.create({
    baseURL: IGDB_BASE_URL,
    headers: {
        'Client-ID': CLIENT_ID,
        'Accept': 'application/json',
    },
});

// Add token before every request
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ---- API functions ----

export const getGames = async (page = 1, limit = 20) => {
    try {
        const offset = (page - 1) * limit;
        const response = await api.post('/games', `
            fields name, cover.url, rating, first_release_date, summary, slug;
            sort first_release_date desc;
            limit ${limit};
            offset ${offset};
            where cover != null & rating != null & themes != (42);
        `);

        return {
            results: response.data.map((game) => ({
                ...game,
                image: game.cover
                    ? {
                          original_url: game.cover.url.replace(
                              't_thumb',
                              't_cover_big'
                          ),
                      }
                    : null,
                original_release_date: game.first_release_date
                    ? new Date(game.first_release_date * 1000)
                          .toISOString()
                          .split('T')[0]
                    : 'N/A',
                guid: game.id,
                name: game.name,
            })),
        };
    } catch (error) {
        console.error('Error fetching games:', error?.response?.data || error);
        throw error;
    }
};

export const searchGames = async (query, page = 1) => {
    try {
        const response = await api.post('/games', `
            fields name, cover.url, rating, first_release_date, summary, slug;
            search "${query}";
            limit 20;
            where cover != null & themes != (42);
        `);

        return {
            results: response.data.map((game) => ({
                ...game,
                image: game.cover
                    ? {
                          original_url: game.cover.url.replace(
                              't_thumb',
                              't_cover_big'
                          ),
                      }
                    : null,
                original_release_date: game.first_release_date
                    ? new Date(game.first_release_date * 1000)
                          .toISOString()
                          .split('T')[0]
                    : 'N/A',
                guid: game.id,
                name: game.name,
            })),
        };
    } catch (error) {
        console.error('Error searching games:', error?.response?.data || error);
        throw error;
    }
};

export const getGameDetails = async (id) => {
    try {
        const response = await api.post('/games', `
            fields name, cover.url, rating, first_release_date, summary, genres.name, platforms.name, screenshots.url, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
            where id = ${id};
        `);

        const game = response.data[0];
        if (!game) throw new Error('Game not found');

        return {
            ...game,
            image: game.cover
                ? {
                      original_url: game.cover.url.replace(
                          't_thumb',
                          't_1080p'
                      ),
                  }
                : null,
            original_release_date: game.first_release_date
                ? new Date(game.first_release_date * 1000)
                      .toISOString()
                      .split('T')[0]
                : 'N/A',
            guid: game.id,
            description: game.summary,
            genres: game.genres ? game.genres.map((g) => ({ name: g.name })) : [],
            platforms: game.platforms
                ? game.platforms.map((p) => ({ name: p.name }))
                : [],
            images: game.screenshots
                ? game.screenshots.map((s) => ({
                      original: s.url.replace('t_thumb', 't_1080p'),
                  }))
                : [],
            developers: game.involved_companies
                ? game.involved_companies
                      .filter((c) => c.developer)
                      .map((c) => ({ name: c.company.name }))
                : [],
            publishers: game.involved_companies
                ? game.involved_companies
                      .filter((c) => c.publisher)
                      .map((c) => ({ name: c.company.name }))
                : [],
        };
    } catch (error) {
        console.error(
            'Error fetching game details:',
            error?.response?.data || error
        );
        throw error;
    }
};

export const getHighestRatedGames = async () => {
    try {
        const response = await api.post('/games', `
            fields name, cover.url, rating, first_release_date, summary, slug;
            sort rating desc;
            limit 10;
            where rating_count > 50 & cover != null & themes != (42);
        `);

        return {
            results: response.data.map((game) => ({
                ...game,
                image: game.cover
                    ? {
                          original_url: game.cover.url.replace(
                              't_thumb',
                              't_cover_big'
                          ),
                      }
                    : null,
                original_release_date: game.first_release_date
                    ? new Date(game.first_release_date * 1000)
                          .toISOString()
                          .split('T')[0]
                    : 'N/A',
                guid: game.id,
                name: game.name,
            })),
        };
    } catch (error) {
        console.error(
            'Error fetching highest rated games:',
            error?.response?.data || error
        );
        throw error;
    }
};

export default api;
