import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { supabase, debugConnection } from '../supabaseClient';

const LeaderboardPage = ({ onBack }) => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugError, setDebugError] = useState(null);
    const [connectionResult, setConnectionResult] = useState(null);
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [showConnectionDetails, setShowConnectionDetails] = useState(false);

    const runConnectionDebug = async () => {
        setConnectionLoading(true);
        setConnectionResult(null);
        try {
            const result = await debugConnection();
            setConnectionResult(result);
            console.log('Supabase debug:', result);
        } finally {
            setConnectionLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        setDebugError(null);
        
        if (!supabase) {
            setDebugError("Supabase client not initialized. Check .env variables.");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('username, high_score')
                .gt('high_score', 0)
                .order('high_score', { ascending: false })
                .limit(50);

            if (error) throw error;

            const formattedScores = (data || []).map((user, index) => ({
                rank: index + 1,
                name: user.username || `GUB #${index + 420}`,
                score: Number(user.high_score) || 0
            }));

            setScores(formattedScores);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            const msg = err.message || "Unknown error";
            const code = err.code ? ` (${err.code})` : "";
            setDebugError(msg + code + ". Run supabase-schema.sql in Supabase SQL Editor if the table or RLS is missing.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const delayedRefetch = setTimeout(() => fetchLeaderboard(), 2500);
        return () => clearTimeout(delayedRefetch);
    }, []);

    useEffect(() => {
        runConnectionDebug();
    }, []);

    useEffect(() => {
        const onFocus = () => fetchLeaderboard();
        const onInvalidated = () => fetchLeaderboard();
        window.addEventListener('focus', onFocus);
        window.addEventListener('gubby-leaderboard-invalidated', onInvalidated);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('gubby-leaderboard-invalidated', onInvalidated);
        };
    }, []);

    return (
        <div className="w-full h-dvh bg-[#f0f0f0] flex flex-col font-mono overflow-hidden">
             <div className="shrink-0 p-4">
                 <Navbar onHome={onBack} />
            </div>

            {/* Main Content - Flex Grow to fill space but not overflow */}
            <div className="flex-1 min-h-0 flex flex-col items-center px-4 pb-6">
                
                <div className="w-full max-w-2xl flex items-center justify-between mb-4">
                    <button 
                        onClick={onBack}
                        className="flex w-10 h-10 bg-white border-2 border-black rounded-lg items-center justify-center font-bold hover:bg-gray-100 shadow-[2px_2px_0px_black] active:translate-y-[1px] active:shadow-none transition-all mr-4"
                        title="Back to Menu"
                    >
                        ✕
                    </button>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic flex-1 text-center md:text-left">GUBBOARD</h1>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fetchLeaderboard()}
                            disabled={loading}
                            className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center font-bold hover:bg-gray-100 shadow-[2px_2px_0px_black] disabled:opacity-50"
                            title="Refresh"
                        >
                            ↻
                        </button>
                        <a 
                            href="https://x.com/gubyverse" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-lg rounded-lg hover:rotate-12 transition-transform"
                        >
                            𝕏
                        </a>
                    </div>
                </div>

                {/* Board Container - Flex Column to handle internal scroll */}
                <div className="w-full max-w-2xl flex-1 flex flex-col border-4 border-black rounded-3xl overflow-hidden bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] min-h-0">
                    
                    {/* Header */}
                    <div className="flex border-b-4 border-black text-xs md:text-base bg-black text-white z-10 shrink-0">
                        <div className="flex-1 py-3 text-center font-black uppercase tracking-wider border-r-2 border-white/20">
                            Rank & GUB
                        </div>
                        <div className="flex-1 py-3 text-center font-black uppercase tracking-wider">
                            Score
                        </div>
                    </div>

                    {/* List Container - Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-gray-50">
                        {loading ? (
                             <div className="flex-1 flex items-center justify-center font-bold text-gray-400 animate-pulse">LOADING DATA...</div>
                        ) : debugError ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                                <p className="text-red-500 font-bold mb-2">ERROR LOADING DATA</p>
                                <p className="text-xs text-gray-500 font-mono mb-4">{debugError}</p>
                                <button onClick={fetchLeaderboard} className="bg-black text-white px-4 py-2 rounded font-bold text-xs hover:bg-gray-800">RETRY</button>
                            </div>
                        ) : scores.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center font-bold text-gray-400 text-center px-4">
                                <span>NO SCORES YET</span>
                                <p className="text-[10px] font-normal text-gray-400 mt-2 max-w-xs">Play a game to save. If you ran a game and still see this, run <code className="bg-gray-200 px-1 rounded">supabase-schema.sql</code> in Supabase → SQL Editor.</p>
                                <button onClick={fetchLeaderboard} className="mt-4 text-xs underline text-black hover:no-underline">REFRESH</button>
                            </div>
                        ) : (
                            scores.map((player) => (
                            <div 
                                key={player.rank}
                                className={`
                                    rounded-xl border-2 border-black px-4 py-3 flex items-center justify-between shrink-0 transition-transform hover:scale-[1.01]
                                    ${player.rank === 1 ? 'bg-[#fef9c3] shadow-[4px_4px_0px_#ca8a04]' : 
                                      player.rank === 2 ? 'bg-[#f3f4f6] shadow-[4px_4px_0px_#9ca3af]' :
                                      player.rank === 3 ? 'bg-[#ffedd5] shadow-[4px_4px_0px_#fdba74]' : 'bg-white shadow-[2px_2px_0px_black]'}
                                `}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                     <div className={`
                                        w-8 h-8 flex items-center justify-center rounded-full font-black text-sm border-2 border-black
                                        ${player.rank <= 3 ? 'bg-white text-black' : 'bg-black text-white'}
                                     `}>
                                        {player.rank}
                                     </div>
                                    <span className="font-bold uppercase truncate text-sm md:text-base">{player.name}</span>
                                </div>
                                <div className="font-black text-lg md:text-xl font-mono text-[#9333ea]">
                                    {player.score.toLocaleString()}
                                </div>
                            </div>
                        )))}
                    </div>
                </div>
                
                {/* Back Button for mobile clarity */}
                 <button 
                    onClick={onBack} 
                    className="md:hidden mt-4 text-sm font-bold underline text-gray-500 hover:text-black"
                >
                    Return to Menu
                </button>
            </div>
        </div>
    );
};

export default LeaderboardPage;
