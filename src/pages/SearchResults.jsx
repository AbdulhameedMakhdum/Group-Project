import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchGames } from '../services/igdbApi';
import GameCard from '../components/game/GameCard';
import { Loader2 } from 'lucide-react';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchResults = async (pageToLoad, shouldAppend) => {
        if (!query) return;

        setLoading(true);
        setError(null);
        try {
            const data = await searchGames(query, pageToLoad);
            const newGames = data.results || [];

            if (shouldAppend) {
                setGames(prev => [...prev, ...newGames]);
            } else {
                setGames(newGames);
            }

            // If we got fewer than 20 results, we've reached the end
            setHasMore(newGames.length === 20);
        } catch (err) {
            setError('Failed to search games. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Reset and fetch initial results when query changes
    useEffect(() => {
        window.scrollTo(0, 0);
        setPage(1);
        setHasMore(true);
        fetchResults(1, false);
    }, [query]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchResults(nextPage, true);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">
                Search Results for <span className="text-primary">"{query}"</span>
            </h2>

            {!loading && !error && games.length === 0 && (
                <div className="text-gray-400 text-center py-20">No games found.</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {games.map((game, index) => (
                    // specific key using index as fallback if guid has duplicates (rare but possible)
                    <GameCard key={`${game.guid}-${index}`} game={game} />
                ))}
            </div>

            {error && (
                <div className="text-red-500 text-center py-10">{error}</div>
            )}

            {loading && (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            )}

            {!loading && hasMore && games.length > 0 && (
                <div className="flex justify-center py-8">
                    <button
                        onClick={handleLoadMore}
                        className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-white rounded-full font-medium transition-colors shadow-lg hover:shadow-primary/20 backdrop-blur-sm active:scale-95"
                    >
                        Load More Results
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
