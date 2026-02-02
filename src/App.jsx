import { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { Web3Provider } from './context/Web3Provider'
import GameEngine from './game/GameEngine'
import './index.css'

// Images
import player1Src from './assets/player.png'
import player2Src from './assets/player2.png'

import Navbar from './game/Navbar'

const GameContent = ({ onHome }) => {
    const [score, setScore] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [selectedChar, setSelectedChar] = useState(player1Src)
    const [showProfile, setShowProfile] = useState(false)
    const [highScores, setHighScores] = useState(() => {
        try { return JSON.parse(localStorage.getItem('gubby_highscores')) || [] } catch { return [] }
    })
    const [totalGUBS, setTotalGUBS] = useState(() => {
        try { return parseInt(localStorage.getItem('gubby_total_gubs') || '0') } catch { return 0 }
    })
    
    // Web3 (Wagmi)
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    // Stats Logic
    const getRank = (points) => {
        if (points >= 1000000) return { title: 'WARLORD', next: null, min: 1000000 };
        if (points >= 150000) return { title: 'ELITE', next: 1000000, min: 150000 };
        if (points >= 50000) return { title: 'RUNNER', next: 150000, min: 50000 };
        if (points >= 10000) return { title: 'SCOUT', next: 50000, min: 10000 };
        return { title: 'NEWBIE', next: 10000, min: 0 };
    };

    const currentRank = getRank(totalGUBS);
    const progress = currentRank.next 
        ? ((totalGUBS - currentRank.min) / (currentRank.next - currentRank.min)) * 100 
        : 100;

    useEffect(() => {
        if (isGameOver && isActive) {
            setIsActive(false)
            
            // Save run score
            const newScores = [...highScores, { score, date: new Date().toLocaleDateString() }]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
            setHighScores(newScores)
            localStorage.setItem('gubby_highscores', JSON.stringify(newScores))
            
            // Update Total Stats
            const newTotal = totalGUBS + score;
            setTotalGUBS(newTotal);
            localStorage.setItem('gubby_total_gubs', newTotal.toString());
        }
    }, [isGameOver, isActive, score])

    const startGame = () => {
        setIsActive(true)
        setIsGameOver(false)
        setScore(0)
        setShowProfile(false)
    }
    
    const handleSignAndSubmit = useCallback(async () => {
        if (!isConnected) return;
        try {
            const message = `Claim Reward for Score: ${score} GUBS`;
            const signature = await signMessageAsync({ message });
            console.log('Signed score payload:', signature);
            alert('Score Signed! (Check Console for Signature)');
        } catch (error) {
            console.error(error);
            alert('Signing Failed');
        }
    }, [isConnected, signMessageAsync, score]);

    return (
        <div className="h-dvh w-full bg-[#f7f7f7] flex flex-col items-center md:items-end justify-start font-mono text-[#535353] select-none overflow-hidden touch-none landscape:p-0 landscape:m-0">
            {/* Navbar - Mobile Only */}
            <Navbar 
                onHome={onHome} 
                onProfile={() => setShowProfile(!showProfile)} 
            />

            {/* Desktop Header / Wallet (Restored for PC since Navbar is hidden) */}
            <div className="hidden md:flex absolute top-4 right-4 z-50 gap-2">
               {!isActive && (
                   <button 
                     onClick={() => setShowProfile(!showProfile)}
                     className="bg-[#535353] text-white px-3 py-1 rounded font-bold hover:bg-[#333]"
                   >
                     👤
                   </button>
               )}
               <ConnectButton showBalance={false} chainStatus="none" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
            </div>

            {/* Centered wrapper for game content on mobile */}
            <div className="flex-1 w-full flex flex-col items-center justify-center md:justify-center md:mt-12">

            {/* Profile Modal - Modern Glassmorphism */}
            {showProfile && !isActive && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-200 text-center relative">
                        <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
                        <h2 className="text-2xl font-bold mb-4 uppercase border-b border-gray-200 pb-2">Profile</h2>
                        
                        <div className="mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Total Earnings</p>
                            <p className="text-4xl font-black text-[#9333ea]">{totalGUBS.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">GUBS</p>
                        </div>

                        <div className="mb-6 bg-gray-100 p-4 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase mb-1">Rank</p>
                            <p className="text-xl font-bold text-[#10b981] mb-2">{currentRank.title}</p>
                            
                            {/* Progress Bar */}
                            {currentRank.next ? (
                                <div>
                                    <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
                                        <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>{totalGUBS.toLocaleString()}</span>
                                        <span>{currentRank.next.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] mt-1 text-gray-400">{(currentRank.next - totalGUBS).toLocaleString()} GUBS to next rank</p>
                                </div>
                            ) : (
                                <p className="text-xs text-yellow-600 font-bold">MAX RANK ACHIEVED</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modern Title */}
            {!isGameOver && !isActive && (
                <h1 className="text-5xl md:text-6xl font-black mb-6 md:mb-10 tracking-wider bg-gradient-to-r from-[#10b981] to-[#06b6d4] bg-clip-text text-transparent mt-8 md:mt-0 landscape:hidden drop-shadow-sm">GUBBY</h1>
            )}
            
            <div className="relative w-full max-w-[1200px] landscape:max-w-full px-2 md:px-0 landscape:px-0">
                <GameEngine 
                    isActive={isActive} 
                    score={score} 
                    setScore={setScore} 
                    setGameOver={setIsGameOver}
                    charSrc={selectedChar}
                />
                
                {(!isActive || isGameOver) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/80 backdrop-blur-md rounded-2xl">
                        {isGameOver && (
                              <div className="text-center mb-6">
                                 <h2 className="text-gray-800 text-3xl font-black mb-3 tracking-wide">GAME OVER</h2>
                                 <p className="text-2xl mb-4 font-black bg-gradient-to-r from-[#10b981] to-[#06b6d4] bg-clip-text text-transparent">{score} GUBS</p>
                             </div>
                        )}

                        {/* Character Select - Modern Cards */}
                        {!isActive && !isGameOver && (
                            <div className="mb-8 text-center">
                                <p className="text-sm font-bold mb-4 uppercase text-gray-600 tracking-wide">Select Runner</p>
                                <div className="flex gap-6 justify-center">
                                    <button 
                                        onClick={() => setSelectedChar(player1Src)}
                                        className={`p-3 border-3 rounded-2xl transition-all transform hover:scale-105 ${selectedChar === player1Src ? 'border-[#10b981] bg-gradient-to-br from-[#d1fae5] to-white shadow-lg shadow-[#10b981]/30' : 'border-gray-300 opacity-60 hover:opacity-80'}`}
                                    >
                                        <img src={player1Src} alt="Player 1" className="w-16 h-16 object-contain" />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedChar(player2Src)}
                                        className={`p-3 border-3 rounded-2xl transition-all transform hover:scale-105 ${selectedChar === player2Src ? 'border-[#10b981] bg-gradient-to-br from-[#d1fae5] to-white shadow-lg shadow-[#10b981]/30' : 'border-gray-300 opacity-60 hover:opacity-80'}`}
                                    >
                                        <img src={player2Src} alt="Player 2" className="w-16 h-16 object-contain" />
                                    </button>
                                </div>
                            </div>
                        )}
                                                {!isActive && !isGameOver && (
                            <p className="mb-6 text-base text-gray-500 font-medium">Tap / Click / Space to Jump</p>
                        )}

                         <button 
                            onClick={startGame}
                            className="mb-8 px-12 py-4 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-lg font-black rounded-full shadow-lg shadow-[#10b981]/50 active:scale-95 transition-all hover:shadow-xl hover:shadow-[#10b981]/60 min-w-[200px]"
                        >
                            {isGameOver ? '🔄 RETRY' : '▶ START'}
                        </button>

                        {/* Clan Feature */}
                        {isGameOver && (
                            <div className="mb-6 flex flex-col items-center">
                                <button 
                                    disabled={totalGUBS < 1000000} // Changed to Total Stats requirement
                                    className={`px-4 py-2 text-xs font-bold rounded border ${totalGUBS >= 1000000 ? 'bg-[#9333ea] text-white border-[#9333ea] shadow-[2px_2px_0px_#581c87]' : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}`}
                                    onClick={() => alert("Clan Creation Portal Opening Soon...")}
                                >
                                    CREATE CLAN (Requires 1M Total GUBS)
                                </button>
                                <p className="text-[10px] text-gray-400 mt-1">Total: {totalGUBS.toLocaleString()} GUBS</p>
                            </div>
                        )}

                        {isGameOver && isConnected && (
                            <button 
                                onClick={handleSignAndSubmit}
                                className="mb-8 text-xs underline text-[#535353] hover:text-black"
                            >
                                Sign Score to Claim Rewards
                            </button>
                        )}
                        
                        {/* High Scores would go here if uncommented in previous versions, keeping it concise */}
                    </div>
                )}

                {/* HUD - Modern with glassmorphism */}
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/40">
                    <div className="text-gray-800 font-black text-lg md:text-xl">{score.toString().padStart(5, '0')} <span className="text-[#10b981]">GUBS</span></div>
                </div>
            </div>

            
            <div className="md:hidden mt-4 text-[10px] text-gray-400">
                Landscape Mode Recommended
            </div>
            </div> {/* Close centered wrapper */}
        </div>
    )
}

import LandingPage from './game/LandingPage'
import MenuPage from './game/MenuPage'
import LeaderboardPage from './game/LeaderboardPage'

function App() {
  const [view, setView] = useState('LANDING'); // 'LANDING', 'MENU', 'GAME', 'LEADERBOARD'

  return (
    <Web3Provider>
      {view === 'LANDING' && <LandingPage onUncover={() => setView('MENU')} />}
      
      {view === 'MENU' && (
        <MenuPage 
            onPlay={() => setView('GAME')} 
            onLeaderboard={() => setView('LEADERBOARD')}
        />
      )}

      {view === 'LEADERBOARD' && (
          <LeaderboardPage onBack={() => setView('MENU')} />
      )}

      {view === 'GAME' && <GameContent onHome={() => setView('MENU')} />}
    </Web3Provider>
  )
}

export default App
