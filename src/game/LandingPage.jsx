import React from 'react';
import landingBg from '../assets/IMG_8614.jpg';

const LandingPage = ({ onUncover }) => {
    return (
        <div className="relative w-full h-dvh overflow-hidden flex flex-col items-center justify-center bg-black">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img 
                    src={landingBg} 
                    alt="Landing Background" 
                    className="w-full h-full object-cover object-[50%_65%]"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-start pt-24">
                <button
                    onClick={onUncover}
                    className="
                        group relative
                        bg-gradient-to-b from-[#e5e5e5] to-[#d4d4d4]
                        text-black font-[900] text-xl tracking-widest uppercase
                        px-12 py-3
                        rounded-lg
                        border-2 border-black border-b-[4px]
                        active:border-b-2 active:translate-y-[2px]
                        shadow-[0_10px_20px_rgba(0,0,0,0.3)]
                        transition-all duration-100
                        hover:brightness-105
                    "
                    style={{
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em'
                    }}
                >
                    UNCOVER
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
