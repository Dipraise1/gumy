import { useState, useEffect, useCallback } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletContextProvider } from './context/WalletContextProvider'
import GameEngine from './game/GameEngine'
import { Buffer } from 'buffer'
import './index.css'

// Images
import player1Src from './assets/player.png'
import player2Src from './assets/player2.png'

// Polyfill for browser
window.Buffer = Buffer;

const GameContent = () => {
    const [score, setScore] = useState(0)
    const [isGameOver, setIsGameOver] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [selectedChar, setSelectedChar] = useState(player1Src)
    const [highScores, setHighScores] = useState(() => {
        try { return JSON.parse(localStorage.getItem('gubby_highscores')) || [] } catch { return [] }
    })
    
    // Web3
    const { connection } = useConnection();
    const { publicKey, signMessage } = useWallet();

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
        if (!publicKey || !signMessage) return;
        try {
            const message = new TextEncoder().encode(`Claim Reward for Score: ${score}`);
            const signature = await signMessage(message);
            console.log('Signed score payload:', signature);
            alert('Score Signed! (Check Console for Signature)');
        } catch (error) {
            console.error(error);
            alert('Signing Failed');
        }
    }, [publicKey, signMessage, score]);

    return (
        <div className="h-screen w-full bg-[#f7f7f7] flex flex-col items-center justify-center font-mono text-[#535353] select-none overflow-hidden touch-none">
            {/* Header / Wallet */}
            <div className="absolute top-4 right-4 z-50">
               <WalletMultiButton style={{ backgroundColor: '#535353', height: '36px', fontSize: '14px' }} />
            </div>

            {/* Retro Title - Hide in Landscape Mobile for space */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-10 tracking-widest text-[#535353] mt-12 md:mt-0 landscape:hidden">G U B B Y</h1>
            
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
                            className="mb-8 px-6 py-2 bg-[#10b981] text-white font-bold rounded shadow-[4px_4px_0px_#064e3b] active:translate-y-1 active:shadow-none transition-all hover:bg-[#059669]"
                        >
                            {isGameOver ? 'RETRY' : 'START'}
                        </button>

                        {isGameOver && publicKey && (
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
                <div className="absolute top-2 right-4 text-[#535353] font-bold text-lg md:text-xl">
                    {score.toString().padStart(5, '0')}
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
    <WalletContextProvider>
       <GameContent />
    </WalletContextProvider>
  )
}

export default App
