import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const UserProfileModal = ({ walletAddress, onProfileSet }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!supabase) {
            setError("Database connection missing.");
            setLoading(false);
            return;
        }

        try {
            // Check if username exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('username, wallet_address')
                .eq('username', username)
                .maybeSingle();

            if (existingUser) {
                // Allow "reclaiming" if the wallet address matches (ignoring case)
                if (existingUser.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
                    setError("Username already taken by another wallet.");
                    setLoading(false);
                    return;
                }
            }

            // CRITICAL: Fetch current user data to preserve high_score
            const { data: currentUser } = await supabase
                .from('users')
                .select('high_score')
                .eq('wallet_address', walletAddress.toLowerCase())
                .maybeSingle();

            const { error: insertError } = await supabase
                .from('users')
                .upsert({
                    wallet_address: walletAddress.toLowerCase(),
                    username: username,
                    high_score: currentUser?.high_score || 0  // Preserve existing score
                }, { onConflict: 'wallet_address' });

            if (insertError) throw insertError;

            // Success
            onProfileSet(username);

        } catch (err) {
            console.error('Error setting username:', err);
            setError(err.message || "Failed to set username");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Set Alias</h2>
                <p className="text-sm text-gray-500 mb-6 text-center">Choose a unique username for the leaderboard.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toUpperCase())}
                            placeholder="BIO-HAZARD"
                            className="w-full bg-gray-50 border border-gray-300 p-4 rounded-xl font-bold text-center uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#9333ea] focus:border-transparent transition-all placeholder:text-gray-300"
                            maxLength={12}
                            required
                        />
                    </div>
                    
                    {error && (
                        <p className="text-red-500 text-sm font-semibold text-center bg-red-50 py-2 rounded-lg">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#9333ea] to-[#7928ca] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-[#9333ea]/30 transform active:scale-[0.98] transition-all uppercase tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Save Profile'}
                    </button>
                    
                    <button 
                         type="button"
                         onClick={() => onProfileSet(null)} // Close without saving
                         className="text-gray-400 text-xs font-semibold hover:text-gray-600 transition-colors"
                    >
                        CANCEL
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserProfileModal;
