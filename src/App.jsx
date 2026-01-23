import { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { Web3Provider } from './context/Web3Provider'
import GameEngine from './game/GameEngine'
import './index.css'

// Images
import player1Src from './assets/player.png'
import player2Src from './assets/player2.png'

const GameContent = () => {
    const [score, setScore] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [selectedChar, setSelectedChar] = useState(player1Src)
    const [highScores, setHighScores] = useState(() => {
        try { return JSON.parse(localStorage.getItem('gubby_highscores')) || [] } catch { return [] }
    })
    
    // Web3 (Wagmi)
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    useEffect(() => {
        if (isGameOver && isActive) {
            setIsActive(false)
            const newScores = [...highScores, { score, date: new Date().toLocaleDateString() }]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
            setHighScores(newScores)
            localStorage.setItem('gubby_highscores', JSON.stringify(newScores))
        }
    }, [isGameOver, isActive, score])

    const startGame = () => {
        setIsActive(true)
        setIsGameOver(false)
        setScore(0)
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
        <div className="h-dvh w-full bg-[#f7f7f7] flex flex-col items-center justify-center font-mono text-[#535353] select-none overflow-hidden touch-none landscape:p-0 landscape:m-0">
            {/* Header / Wallet */}
            <div className="absolute top-4 right-4 z-50">
               <ConnectButton showBalance={false} chainStatus="none" />
            </div>

            {/* Retro Title - Hide in Landscape Mobile for space, AND hide on Game Over to prevent overlap */}
            {!isGameOver && (
                <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-10 tracking-widest text-[#535353] mt-12 md:mt-0 landscape:hidden">G U B B Y</h1>
            )}
            
            <div className="relative w-full max-w-[800px] landscape:max-w-full px-2 md:px-0 landscape:px-0">
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
                                 <p className="text-xl mb-4 font-bold">{score}</p>
                             </div>
                        )}

                        {/* Character Select */}
                        {!isActive && (
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
                                    disabled={score < 500000}
                                    className={`px-4 py-2 text-xs font-bold rounded border ${score >= 500000 ? 'bg-[#9333ea] text-white border-[#9333ea] shadow-[2px_2px_0px_#581c87]' : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}`}
                                    onClick={() => alert("Clan Creation Portal Opening Soon...")}
                                >
                                    CREATE CLAN (Requires 500k GUBS)
                                </button>
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

function App() {
  return (
    <Web3Provider>
       <GameContent />
    </Web3Provider>
  )
}

export default App
