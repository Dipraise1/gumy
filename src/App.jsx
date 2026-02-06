import { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { Web3Provider } from './context/Web3Provider'
import GameEngine from './game/GameEngine'
import { supabase } from './supabaseClient'
import UserProfileModal from './game/UserProfileModal'
import './index.css'

// Images
import player1Src from './assets/player.png'
import player2Src from './assets/player2.png'

import Navbar from './game/Navbar'
import LandingPage from './game/LandingPage'
import MenuPage from './game/MenuPage'
import LeaderboardPage from './game/LeaderboardPage'

const GameContent = ({ onHome, onLeaderboard }) => {
    const [score, setScore] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [selectedChar, setSelectedChar] = useState(player1Src)
    const [showProfile, setShowProfile] = useState(false)
    const [username, setUsername] = useState(null)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false) 
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
            
            // Save run score locally
            const newScores = [...highScores, { score, date: new Date().toLocaleDateString() }]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
            setHighScores(newScores)
            localStorage.setItem('gubby_highscores', JSON.stringify(newScores))
            
            // Update Total Stats
            const newTotal = totalGUBS + score;
            setTotalGUBS(newTotal);
            localStorage.setItem('gubby_total_gubs', newTotal.toString());

            // SYNC WITH SUPABASE
            const saveScoreToSupabase = async () => {
                if (!isConnected || !address || !supabase) return;
                
                try {
                    // 1. Fetch current high score
                     const { data: userData, error: fetchError } = await supabase
                        .from('users')
                        .select('high_score, username')
                        .eq('wallet_address', address.toLowerCase())
                        .maybeSingle();

                    if (fetchError) {
                         console.error("Error checking high score:", fetchError);
                         return;
                    }

                    const currentHighScore = userData?.high_score || 0;

                    // 2. Only update if new score is higher
                    if (score > currentHighScore) {
                        const { error: upsertError } = await supabase
                            .from('users')
                            .upsert({ 
                                wallet_address: address.toLowerCase(), 
                                username: userData?.username || `GUB-${address.slice(2,8).toUpperCase()}`,
                                high_score: score,
                                updated_at: new Date()
                            }, { onConflict: 'wallet_address' }); // Merge update

                         if (upsertError) console.error("Error updating high score:", upsertError);
                         else console.log("New high score synced to DB!", score);
                    } else {
                         // Ensure user exists even if score isn't higher (e.g. first play but low score)
                         // Optional: we might want to just ensure the user record exists.
                         // For now, let's just leave it. If they created a profile, they exist. 
                         // If we want to guarantee they exist after playing:
                         if (!userData) {
                             await supabase.from('users').upsert({
                                 wallet_address: address.toLowerCase(),
                                 username: `GUB-${address.slice(2,8).toUpperCase()}`,
                                 high_score: score,
                                 created_at: new Date(),
                                 updated_at: new Date()
                             }, { onConflict: 'wallet_address' });
                         }
                    }

                } catch (err) {
                    console.error("Failed to sync score:", err);
                }
            };
            
            saveScoreToSupabase();
        }
    }, [isGameOver, isActive, score, isConnected, address]) 

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



    useEffect(() => {
        const fetchProfileAndSync = async () => {
            if (isConnected && address && supabase) {
                try {
                    // 1. Fetch Profile
                    const { data, error } = await supabase
                        .from('users')
                        .select('username, high_score')
                        .eq('wallet_address', address.toLowerCase())
                        .maybeSingle();

                    if (error) {
                         console.error("Error fetching profile:", error);
                    } else if (data?.username) {
                        setUsername(data.username);
                    }

                    // 2. Sync Local High Score -> DB (Recovery Logic)
                    // If the user played while the DB was broken, their local score is higher.
                    const localBest = highScores.length > 0 ? helperGetMaxScore(highScores) : 0;
                    const remoteBest = data?.high_score || 0;

                    if (localBest > remoteBest) {
                        console.log(`Recovering score: Local ${localBest} > Remote ${remoteBest}`);
                        await supabase.from('users').upsert({
                            wallet_address: address.toLowerCase(),
                            username: data?.username || `GUB-${address.slice(2,8).toUpperCase()}`,
                            high_score: localBest,
                            updated_at: new Date()
                        }, { onConflict: 'wallet_address' });
                        
                        // Notify user visibly
                        // alert(`Successfully synced your offline high score of ${localBest} to the leaderboard!`);
                        console.log("Score recovered successfully!");
                    } else if (remoteBest > localBest) {
                        // Optional: Sync DB -> Local? 
                        // For now, let's just respect the DB as truth if it's higher, 
                        // but usually we trust local for games unless cheated.
                    }

                } catch (e) {
                    console.error("Error syncing profile:", e);
                }
            } else {
                setUsername(null);
            }
        };

        fetchProfileAndSync();
    }, [isConnected, address, highScores]);

    // Helper to get max score safely
    const helperGetMaxScore = (scoresArray) => {
        if (!scoresArray || scoresArray.length === 0) return 0;
        return Math.max(...scoresArray.map(s => s.score));
    };

    const handleProfileSet = (newUsername) => {
        setUsername(newUsername);
        setIsProfileModalOpen(false);
        setShowProfile(true); // Show the main profile view
    };

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
                    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20 text-center relative">
                        <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100/50">✕</button>
                        
                        <div className="w-20 h-20 bg-gradient-to-br from-[#10b981] to-[#06b6d4] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[#10b981]/20">
                            <span className="text-3xl">👤</span>
                        </div>

                        <h2 className="text-xl font-bold mb-1 text-gray-800">{username || "Guest Player"}</h2>
                        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider">{address ? `${address.slice(0,6)}...${address.slice(-4)}` : "Wallet Not Connected"}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total Earned</p>
                                <p className="text-xl font-black text-[#9333ea]">{totalGUBS.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Rank</p>
                                <p className="text-xl font-black text-[#10b981]">{currentRank.title}</p>
                            </div>

                        </div>



                        {isConnected ? (
                            <button 
                                onClick={() => { setIsProfileModalOpen(true); setShowProfile(false); }}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm shadow-sm"
                            >
                                {username ? "Edit Alias" : "Set Player Alias"}
                            </button>
                        ) : (
                            <div className="text-xs text-orange-500 font-bold bg-orange-50 p-3 rounded-xl">
                                Connect Wallet to Sync Stats & Set Alias
                            </div>
                        )}

                        <div className="mb-6 bg-gray-100 p-4 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase mb-1">Rank</p>
                            <p className="text-xl font-bold text-[#10b981] mb-2">{currentRank.title}</p>
                            
                            {/* Progress Bar */}
                            {currentRank.next ? (
                                <div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-[#10b981] h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-right">{(currentRank.next - totalGUBS).toLocaleString()} GUBS to next rank</p>
                                </div>
                            ) : (
                                <p className="text-xs text-yellow-500 font-bold">MAX RANK</p>
                            )}
                    </div>
                    </div>
                    </div>
                )}

            {/* HUD - Modern Professional */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
                 <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-white/50 flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">SCORE</span>
                    <div className="text-gray-900 font-black text-xl md:text-2xl font-mono tracking-tighter">
                        {score.toString().padStart(5, '0')}
                    </div>
                </div>

                {/* Pause Button */}
                {isActive && !isGameOver && (
                    <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className="bg-white/90 backdrop-blur-md w-10 h-10 rounded-xl shadow-lg border border-white/50 flex items-center justify-center font-black active:scale-95 transition-transform"
                    >
                        {isPaused ? '▶' : '⏸'}
                    </button>
                )}
            </div>

            {/* Centered wrapper for game content - Flex Grow with strict containment */}
            <div className="flex-1 w-full max-w-[1200px] flex flex-col items-center justify-center relative min-h-0">
                
                {/* Modern Title - Adjusted for mobile */}
                {!isGameOver && !isActive && (
                    <h1 className="absolute top-[10%] md:top-[15%] text-5xl md:text-7xl font-black tracking-tighter text-gray-900/10 select-none pointer-events-none z-0">
                        GUBBY DASH
                    </h1>
                )}

                <div className="relative w-full h-full flex items-center justify-center">
                    <GameEngine 
                        isActive={isActive} 
                        isPaused={isPaused}
                        score={score} 
                        setScore={setScore} 
                        setGameOver={setIsGameOver}
                        charSrc={selectedChar}
                    />
                </div>
                
                {(!isActive || isGameOver) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                        <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-black flex flex-col items-center text-center max-w-md w-full animate-fadeIn">
                            
                            {isGameOver && (
                                  <div className="mb-8">
                                     <h2 className="text-gray-900 text-4xl font-black mb-2 tracking-tighter uppercase italic">Wasted</h2>
                                     <div className="text-5xl md:text-6xl font-black text-[#9333ea] drop-shadow-sm font-mono">
                                         {score}
                                     </div>
                                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Final Score</p>
                                 </div>
                            )}

                        {/* Character Select - Modern Cards */}
                        {!isActive && !isGameOver && (
                            <div className="mb-8 text-center">
                                <p className="text-sm font-bold mb-4 uppercase text-gray-600 tracking-wide">Select Runner</p>
                                <div className="flex gap-6 justify-center">
                            {/* Character Select */}
                            {!isActive && !isGameOver && (
                                <div className="mb-8 w-full">
                                    <p className="text-xs font-black mb-4 uppercase text-gray-400 tracking-widest">Select Runner</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setSelectedChar(player1Src)}
                                            className={`p-4 rounded-xl border-4 transition-all duration-200 ${selectedChar === player1Src ? 'border-black bg-[#dcfce7] shadow-[4px_4px_0px_black] -translate-y-1' : 'border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={player1Src} alt="Player 1" className="w-16 h-16 object-contain mx-auto" />
                                        </button>
                                        <button 
                                            onClick={() => setSelectedChar(player2Src)}
                                            className={`p-4 rounded-xl border-4 transition-all duration-200 ${selectedChar === player2Src ? 'border-black bg-[#fce7f3] shadow-[4px_4px_0px_black] -translate-y-1' : 'border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={player2Src} alt="Player 2" className="w-16 h-16 object-contain mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            )}
                                </div>
                            </div>
                        )}
                                                {!isActive && !isGameOver && (
                            <p className="mb-6 text-base text-gray-500 font-medium">Tap / Click / Space to Jump</p>
                        )}

                            <button 
                                onClick={startGame}
                                className="w-full py-4 bg-black text-white text-xl font-black rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all hover:bg-gray-900 border-2 border-transparent uppercase tracking-widest mb-4"
                            >
                                {isGameOver ? 'TRY AGAIN' : 'START RUN'}
                            </button>

                            {/* Game Over Navigation */}
                            {isGameOver && (
                                <div className="flex gap-4 w-full mb-6">
                                    <button 
                                         onClick={() => { setIsActive(false); onHome(); }}
                                         className="flex-1 py-3 bg-white border-2 border-black text-black font-bold rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] active:translate-y-0 active:shadow-none transition-all uppercase text-xs"
                                    >
                                        Main Menu
                                    </button>
                                    <button 
                                         onClick={() => { setIsActive(false); onLeaderboard(); }}
                                         className="flex-1 py-3 bg-[#fef08a] border-2 border-black text-black font-bold rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] active:translate-y-0 active:shadow-none transition-all uppercase text-xs"
                                    >
                                        Leaderboard
                                    </button>
                                </div>
                            )}

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
                    </div>
                )}

                {/* Pause Menu Overlay */}
                {isPaused && isActive && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_black] flex flex-col gap-4 min-w-[280px]">
                            <h2 className="text-2xl font-black text-center mb-2 uppercase italic tracking-tighter">Paused</h2>
                            
                            <button 
                                onClick={() => setIsPaused(false)}
                                className="w-full py-3 bg-[#bef264] border-2 border-black font-black uppercase shadow-[2px_2px_0px_black] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_black] active:translate-y-0 active:shadow-none transition-all rounded-xl"
                            >
                                Resume
                            </button>

                            <button 
                                onClick={() => { setIsPaused(false); startGame(); }}
                                className="w-full py-3 bg-white border-2 border-black font-black uppercase shadow-[2px_2px_0px_black] hover:bg-gray-50 active:translate-y-0 active:shadow-none transition-all rounded-xl"
                            >
                                Restart
                            </button>

                            <button 
                                onClick={() => { setIsPaused(false); setIsActive(false); onHome(); }}
                                className="w-full py-3 bg-[#fca5a5] border-2 border-black font-black uppercase shadow-[2px_2px_0px_black] hover:bg-[#f87171] active:translate-y-0 active:shadow-none transition-all rounded-xl"
                            >
                                Quit
                            </button>
                        </div>
                    </div>
                )}

            </div>

            
            <div className="md:hidden mt-4 text-[10px] text-gray-400">
                Landscape Mode Recommended
            </div>

            {/* Username Entry Modal */}
            {isProfileModalOpen && (
                <div className="absolute inset-0 z-[60]">
                    <div className="absolute top-4 right-4 z-[70]">
                        <button 
                            onClick={() => setIsProfileModalOpen(false)}
                            className="bg-white text-black font-bold p-2 rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-black"
                        >
                            ✕
                        </button>
                    </div>
                    <UserProfileModal 
                        walletAddress={address} 
                        onProfileSet={handleProfileSet}
                    />
                </div>
            )}

            </div> {/* Close centered wrapper */}
        </div>
    )
}


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

      {view === 'GAME' && <GameContent onHome={() => setView('MENU')} onLeaderboard={() => setView('LEADERBOARD')} />}
    </Web3Provider>
  )
}

export default App
