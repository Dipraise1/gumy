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
        if (points >= 500000) return { title: 'WARLORD', next: null, min: 500000 };
        if (points >= 150000) return { title: 'ELITE', next: 500000, min: 150000 };
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
        <div className="h-dvh w-full bg-[#f7f7f7] flex flex-col items-center justify-start font-mono text-[#535353] select-none overflow-hidden touch-none landscape:p-0 landscape:m-0">
            {/* Navbar */}
            <Navbar 
                onHome={onHome} 
                onProfile={() => setShowProfile(!showProfile)} 
            />


            {/* Profile Modal */}
            {showProfile && !isActive && (
                <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm border-2 border-[#535353] text-center relative">
                        <button onClick={() => setShowProfile(false)} className="absolute top-2 right-2 text-xl font-bold">×</button>
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

            {/* Retro Title - Hide in Landscape Mobile for space, AND hide on Game Over to prevent overlap */}
            {!isGameOver && !isActive && (
                <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-10 tracking-widest text-[#535353] mt-12 md:mt-0 landscape:hidden">G U B B Y</h1>
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#f7f7f7]/90 backdrop-blur-[2px]">
                        {isGameOver && (
                             <div className="text-center mb-4">
                                 <h2 className="text-[#535353] text-2xl font-bold mb-2">GAME OVER</h2>
                                 <p className="text-xl mb-4 font-bold">{score} GUBS</p>
                             </div>
                        )}

                        {/* Character Select */}
                        {!isActive && !isGameOver && (
                            <div className="mb-6 text-center">
                                <p className="text-xs font-bold mb-2 uppercase text-[#535353]">Select Runner</p>
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={() => setSelectedChar(player1Src)}
                                        className={`p-2 border-2 rounded transition-all ${selectedChar === player1Src ? 'border-[#10b981] bg-[#e0f2fe]' : 'border-gray-300 opacity-50'}`}
                                    >
                                        <img src={player1Src} alt="Player 1" className="w-12 h-12 object-contain" />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedChar(player2Src)}
                                        className={`p-2 border-2 rounded transition-all ${selectedChar === player2Src ? 'border-[#10b981] bg-[#e0f2fe]' : 'border-gray-300 opacity-50'}`}
                                    >
                                        <img src={player2Src} alt="Player 2" className="w-12 h-12 object-contain" />
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {!isActive && !isGameOver && (
                            <p className="mb-4 text-sm text-[#535353]">Tap / Click / Space to Jump</p>
                        )}

                        <button 
                            onClick={startGame}
                            className="mb-6 px-6 py-2 bg-[#10b981] text-white font-bold rounded shadow-[4px_4px_0px_#064e3b] active:translate-y-1 active:shadow-none transition-all hover:bg-[#059669]"
                        >
                            {isGameOver ? 'RETRY' : 'START'}
                        </button>

                        {/* Clan Feature */}
                        {isGameOver && (
                            <div className="mb-6 flex flex-col items-center">
                                <button 
                                    disabled={totalGUBS < 500000} // Changed to Total Stats requirement
                                    className={`px-4 py-2 text-xs font-bold rounded border ${totalGUBS >= 500000 ? 'bg-[#9333ea] text-white border-[#9333ea] shadow-[2px_2px_0px_#581c87]' : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}`}
                                    onClick={() => alert("Clan Creation Portal Opening Soon...")}
                                >
                                    CREATE CLAN (Requires 500k Total GUBS)
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

                {/* HUD */}
                <div className="absolute top-4 left-4 text-[#535353] font-bold text-lg md:text-xl">
                    {score.toString().padStart(5, '0')} GUBS
                </div>
            </div>

            
            <div className="md:hidden mt-4 text-[10px] text-gray-400">
                Landscape Mode Recommended
            </div>
        </div>
    )
}

import LandingPage from './game/LandingPage'
import MenuPage from './game/MenuPage'
import LeaderboardPage from './game/LeaderboardPage'

function App() {
  const [view, setView] = useState('LANDING'); // 'LANDING', 'MENU', 'GAME', 'LEADERBOARD'

  if (view === 'LANDING') {
    return <LandingPage onUncover={() => setView('MENU')} />
  }

  if (view === 'MENU') {
    return (
        <MenuPage 
            onPlay={() => setView('GAME')} 
            onLeaderboard={() => setView('LEADERBOARD')}
        />
    )
  }

  if (view === 'LEADERBOARD') {
      return <LeaderboardPage onBack={() => setView('MENU')} />
  }

  // view === 'GAME'
  return (
    <Web3Provider>
       <GameContent onHome={() => setView('MENU')} />
    </Web3Provider>
  )
}

export default App
