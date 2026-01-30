import React from 'react';
import Navbar from './Navbar';

const LeaderboardPage = ({ onBack }) => {
    // Data cleared for real integration later
    const scores = [];

    return (
        <div className="w-full h-dvh bg-white flex flex-col items-center justify-start font-mono relative">
            <Navbar onHome={onBack} />
            
            <div className="h-4"></div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black uppercase mb-4 md:mb-6 tracking-wider">GUBBOARD</h1>

            {/* Board Container */}
            <div className="w-full max-w-2xl border-[6px] border-black rounded-[40px] overflow-hidden bg-[#e5e5e5] shadow-[0_0_0_0] flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="flex border-b-[6px] border-black text-xs md:text-lg shrink-0 bg-[#e5e5e5] z-10 relative">
                    <div className="flex-1 py-4 text-center font-black border-r-[6px] border-black uppercase tracking-wider">
                        GUBBIES
                    </div>
                    <div className="flex-1 py-4 text-center font-black uppercase tracking-wider">
                        GUB SCORE
                    </div>
                </div>

                {/* List Container - Scrollable */}
                <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                    {scores.map((player) => (
                        <div 
                            key={player.rank}
                            className="bg-white rounded-xl border-[3px] border-black px-4 py-3 flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0"
                        >
                            <div className="font-black text-lg md:text-xl flex items-center gap-4">
                                <span className="opacity-100">#{player.rank}</span>
                                <span className="uppercase">{player.name}</span>
                            </div>
                            <div className="font-black text-lg md:text-xl">
                                {player.score}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Bottom Padding for visual balance */}
                <div className="h-2"></div>
            </div>

            {/* Bottom Right Logo */}
            <div className="absolute bottom-8 right-8">
                 <div className="w-12 h-12 bg-[#dcdcdc] border-[3px] border-black flex items-center justify-center font-black text-2xl rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform">
                    X
                </div>
            </div>
            
            {/* Temporary Back Button for Usability */}
            <button onClick={onBack} className="absolute top-8 left-8 font-bold underline hover:no-underline">
                &lt; BACK
            </button>
        </div>
    );
};

export default LeaderboardPage;
