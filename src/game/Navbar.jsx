import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = ({ onHome, onProfile }) => {
    return (
        <nav className="w-full bg-white border-4 border-black rounded-2xl py-4 px-6 md:px-8 flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)] h-[80px] md:hidden">
            {/* Left: Logo */}
            <div 
                onClick={onHome}
                className="cursor-pointer select-none transition-transform active:scale-95"
            >
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest italic" style={{ fontFamily: 'monospace' }}>
                    GUBBY
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Profile Button (Only show if onProfile is provided) */}
                {onProfile && (
                    <button 
                        onClick={onProfile}
                        className="bg-[#535353] text-white w-10 h-10 rounded flex items-center justify-center font-bold hover:bg-[#333] border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all"
                    >
                        👤
                    </button>
                )}
                
                {/* Wallet Button */}
                <div className="border-2 border-black rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                    <ConnectButton 
                        showBalance={false} 
                        chainStatus="none" 
                        accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} 
                    />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
