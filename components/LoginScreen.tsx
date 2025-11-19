
import React, { useState } from 'react';
import type { User } from '../types';
import { DumbbellIcon } from './Icons';

interface LoginScreenProps {
    onLogin: (user: User) => Promise<void>;
    getOrCreateUser: (initials: string, pin: string) => Promise<User>;
    isChallengeConfigured: boolean;
    isChallengeStarted: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, getOrCreateUser, isChallengeConfigured, isChallengeStarted }) => {
    const [initials, setInitials] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [apiError, setApiError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError('');
        if (initials.trim().length > 0 && initials.trim().length <= 3 && pin.length === 4) {
            setError('');
            try {
                setIsSubmitting(true);
                const user = await getOrCreateUser(initials, pin);
                await onLogin(user);
            } catch (err: any) {
                setApiError(err.message);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setError('Please enter 1-3 initials and a 4-digit PIN.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <DumbbellIcon className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Push-up Challenge</h1>
                <p className="text-lg text-gray-400 mb-8">Day of the challenge = Number of push-ups.</p>
                
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <form onSubmit={handleLogin}>
                        <label htmlFor="initials" className="block text-sm font-medium text-gray-300 mb-2">
                            Enter Your Initials
                        </label>
                        <input
                            id="initials"
                            type="text"
                            value={initials}
                            onChange={(e) => setInitials(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="e.g. JD"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-2xl font-bold tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                        />
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mt-4 mb-2">
                            Enter Your 4-Digit PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={4}
                            placeholder="e.g. 1234"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-2xl font-bold tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                        />
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        {apiError && <p className="text-red-400 text-sm mt-2">{apiError}</p>}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-6 py-3 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold rounded-md shadow-lg transform hover:scale-105 transition-transform duration-150 ease-in-out flex items-center justify-center gap-3"
                        >
                            {isSubmitting && (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
                                </svg>
                            )}
                            <span>{isSubmitting ? 'Working…' : isChallengeConfigured ? 'Login' : 'Start Challenge'}</span>
                        </button>
                    </form>
                </div>
                 {!isChallengeConfigured && (
					<p className="text-sm text-yellow-400 mt-6 bg-yellow-900/50 p-3 rounded-md">
						The challenge has not been set up yet. Only the admin can log in to configure the start date.
					</p>
				)}

				<p className="text-xs text-gray-500 mt-4">
					{isChallengeStarted ? '' : 'If your initials don’t exist, a new profile will be created.'}
				</p>
            </div>
        </div>
    );
};

export default LoginScreen;
