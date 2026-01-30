import React from 'react';

const MenuPage = ({ onPlay, onLeaderboard }) => {
    return (
        <div className="w-full h-dvh bg-white flex flex-col items-center justify-between p-4 md:p-8 font-mono overflow-auto">
            
            {/* Main Grid */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 grow mb-8">
                
                {/* WHAT? Card */}
                <div className="bg-[#dcdcdc] rounded-[30px] border-[5px] border-black p-8 flex flex-col justify-center items-start shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tight">WHAT?</h2>
                    <p className="text-sm md:text-base font-bold mb-4">
                        Bunch of pixelated retards curating more than chaos on Eth, with zero iq and lots of Odyssey.
                    </p>
                    <p className="text-sm md:text-base font-bold mb-4">
                        ROADMAP? I don't know too.
                    </p>
                    <p className="text-sm md:text-base font-bold">
                        UTILITY? Nah too retarded to think of that.
                    </p>
                </div>

                {/* COLLECTIBLES Card */}
                <div className="bg-[#dcdcdc] rounded-[30px] border-[5px] border-black p-8 flex flex-col justify-center items-center text-center shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-3xl md:text-4xl font-black mb-8 uppercase tracking-tight">COLLECTIBLES</h2>
                    <p className="text-lg md:text-xl font-bold">
                        Retarded ugly looking retros
                    </p>
                </div>

                {/* GUBBYBOARD Card */}
                <div className="bg-[#dcdcdc] rounded-[30px] border-[5px] border-black p-8 flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,1)] min-h-[200px]">
                    <button 
                        onClick={onLeaderboard}
                        className="bg-white px-8 py-3 rounded-xl border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                    >
                         <span className="text-xl md:text-2xl font-black uppercase tracking-wider">GUBBYBOARD</span>
                    </button>
                </div>

                {/* GUBBY-DASH Card */}
                <div className="bg-[#dcdcdc] rounded-[30px] border-[5px] border-black p-8 flex items-center justify-center shadow-[8px_8px_0px_rgba(0,0,0,1)] min-h-[200px]">
                    <button 
                         onClick={onPlay}
                         className="bg-white px-8 py-3 rounded-xl border-[4px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                    >
                        <span className="text-xl md:text-2xl font-black uppercase tracking-wider">GUBBY-DASH</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-4 relative">
                <span className="text-lg md:text-xl font-black uppercase tracking-wide text-center">
                    APPLY TO BECOME A RETARDED GUB
                </span>
                
                <button className="bg-[#ffe4e1] px-6 py-2 rounded-lg border-[3px] border-black font-black uppercase shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-[#ffc0cb]">
                    APPLY
                </button>

                {/* X Logo / Links - Placeholder positioning */}
                <div className="md:absolute right-0 flex gap-2">
                    <div className="w-10 h-10 bg-[#dcdcdc] border-[3px] border-black flex items-center justify-center font-black text-xl rounded shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        X
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
