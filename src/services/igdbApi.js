import axios from 'axios';

// We point to our local Vercel function.
// In development, if not running 'vercel dev', you might need to configure a proxy in vite.config.js
// or just run 'vercel dev'.
const IGDB_PROXY_URL = '/api/igdb';

// Create api instance
const api = axios.create({
    baseURL: IGDB_PROXY_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Helper to make the request to our proxy
// The proxy expects { query: "..." }
const fetchFromProxy = async (query) => {
    try {
        const response = await api.post('', { query });
        return response;
    } catch (error) {
        // If 404/500, log it
        console.error('Proxy request failed:', error);
        throw error;
    }
};

// ---- API functions ----

export const getGames = async (page = 1, limit = 20) => {
    try {
        const offset = (page - 1) * limit;
        const query = `
            fields name, cover.url, rating, first_release_date, summary, slug;
            sort first_release_date desc;
            limit ${limit};
            offset ${offset};
            where cover != null & rating != null & themes != (42);
        `;

        const response = await fetchFromProxy(query);

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

export const searchGames = async (queryText, page = 1) => {
    try {
        const query = `
            fields name, cover.url, rating, first_release_date, summary, slug;
            search "${queryText}";
            limit 20;
            where cover != null & themes != (42);
        `;

        const response = await fetchFromProxy(query);

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
        const query = `
            fields name, cover.url, rating, first_release_date, summary, genres.name, platforms.name, screenshots.url, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
            where id = ${id};
        `;

        const response = await fetchFromProxy(query);

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
        const query = `
            fields name, cover.url, rating, first_release_date, summary, slug;
            sort rating desc;
            limit 10;
            where rating_count > 50 & cover != null & themes != (42);
        `;

        const response = await fetchFromProxy(query);

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

