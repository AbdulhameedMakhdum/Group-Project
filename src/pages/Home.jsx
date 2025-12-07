import React, { useEffect, useState } from 'react';
import { getHighestRatedGames, searchGames } from '../services/igdbApi';
import GameCard from '../components/game/GameCard';
import { Loader2 } from 'lucide-react';

const Home = () => {
    const [popularGames, setPopularGames] = useState([]);
    const [devChoiceGames, setDevChoiceGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const popularData = await getHighestRatedGames();
                setPopularGames(popularData.results || []);

                const eldenRingReq = await searchGames('Elden Ring');
                const cyberpunkReq = await searchGames('Cyberpunk 2077');

                const eldenRing = eldenRingReq.results.find(g => g.name === 'Elden Ring');
                const cyberpunk = cyberpunkReq.results.find(g => g.name === 'Cyberpunk 2077');

                setDevChoiceGames([eldenRing, cyberpunk].filter(Boolean));

            } catch (err) {
                setError('Failed to load games. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 py-10">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-3xl font-bold mb-6 text-white border-l-4 border-primary pl-4">Developers Choice of All Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {devChoiceGames.map(game => (
                        <div key={game.guid} className="relative group rounded-2xl overflow-hidden aspect-video shadow-2xl">
                            <img
                                src={game.image?.original_url || game.image?.medium_url || 'https://placehold.co/600x400?text=No+Image'}
                                alt={game.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-4xl font-black text-white mb-2">{game.name}</h3>
                                <p className="text-gray-300 line-clamp-2 mb-4">{game.deck}</p>
                                <a href={`/game/${game.guid}`} className="inline-block bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition-colors w-max">
                                    View Game
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-3xl font-bold mb-6 text-white border-l-4 border-primary pl-4">Highest Rated Games</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {popularGames.map(game => (
                        <GameCard key={game.guid} game={game} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
