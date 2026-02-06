import React from 'react';
import Navbar from './Navbar';

const MenuPage = ({ onPlay, onLeaderboard }) => {
    return (
        <div className="w-full h-dvh bg-[#f0f0f0] flex flex-col font-mono overflow-hidden">
            <div className="shrink-0 p-4">
                 <Navbar onHome={() => {}} />
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
                <div className="w-full max-w-6xl mx-auto flex flex-col min-h-full">
                    
                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 grow mb-8">
                        
                        {/* LEFT COLUMN - INFO */}
                        <div className="flex flex-col gap-6">
                            {/* WHAT? Card */}
                            <div className="bg-white rounded-3xl border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-all">
                                <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">WHAT IS THIS?</h2>
                                <div className="space-y-4 text-sm md:text-base font-bold text-gray-800 leading-relaxed">
                                    <p>
                                        A chaotic experiment on Ethereum. Zero IQ required, infinite Odyssey promised.
                                    </p>
                                    <p>
                                        <span className="bg-black text-white px-2 py-0.5">ROADMAP?</span> Non-existent.
                                    </p>
                                    <p>
                                        <span className="bg-black text-white px-2 py-0.5">UTILITY?</span> Still searching for it.
                                    </p>
                                </div>
                            </div>

                            {/* COLLECTIBLES Card */}
                            <div className="bg-[#e0e7ff] rounded-3xl border-4 border-black p-6 md:p-8 flex flex-col justify-center items-center text-center shadow-[8px_8px_0px_rgba(0,0,0,1)] grow">
                                <h2 className="text-2xl md:text-4xl font-black mb-4 uppercase tracking-tighter">COLLECTIBLES</h2>
                                <p className="text-base md:text-xl font-bold max-w-md">
                                    Pixelated relics for the digitally deranged.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - ACTIONS */}
                        <div className="flex flex-col gap-6">
                             {/* GUBBYBOARD Card */}
                            <div className="bg-[#dcfce7] rounded-3xl border-4 border-black p-8 flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,1)] grow min-h-[180px]">
                                <button 
                                    onClick={onLeaderboard}
                                    className="w-full max-w-xs bg-white py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50 flex flex-col items-center gap-2 group"
                                >
                                     <span className="text-2xl md:text-3xl font-black uppercase tracking-wider group-hover:scale-105 transition-transform">🏆 LEADERBOARD</span>
                                     <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">View Top Gubs</span>
                                </button>
                            </div>

                            {/* GUBBY-DASH Card */}
                            <div className="bg-[#fce7f3] rounded-3xl border-4 border-black p-8 flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,1)] grow min-h-[180px]">
                                <button 
                                     onClick={onPlay}
                                     className="w-full max-w-xs bg-white py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50 flex flex-col items-center gap-2 group"
                                >
                                    <span className="text-2xl md:text-3xl font-black uppercase tracking-wider group-hover:scale-105 transition-transform">▶ PLAY GAME</span>
                                    <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">Start Running</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Stays at bottom of flow */}
                    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mt-auto p-4 bg-white/50 rounded-2xl border-2 border-black/10">
                        <span className="text-sm md:text-lg font-black uppercase tracking-wide text-center md:text-left">
                            JOIN THE CHAOS
                        </span>
                        
                        <div className="flex items-center gap-4">
                            <button className="bg-[#ffe4e1] px-6 py-2 rounded-lg border-2 border-black font-black uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-[#ffc0cb] text-sm">
                                APPLY NOW
                            </button>

                            <a 
                                href="https://x.com/gubyverse" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl rounded-lg hover:scale-110 transition-transform cursor-pointer"
                            >
                                𝕏
                            </a>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
