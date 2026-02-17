
import React, { useState } from 'react';
import type { User } from '../types';
import { DumbbellIcon } from './Icons';

interface LoginScreenProps {
    onLogin: (user: User) => Promise<void>;
    getOrCreateUser: (initials: string, pin: string) => Promise<User>;
    isChallengeConfigured: boolean;
    isChallengeStarted: boolean;
    theme: 'light' | 'dark';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, getOrCreateUser, isChallengeConfigured, isChallengeStarted, theme }) => {
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
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col items-center justify-center p-4 transition-colors duration-300`}>
            <div className="w-full max-w-md text-center">
                <div className="bg-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                    <DumbbellIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-theme-primary-text mb-2 tracking-tight">PUSHUP CHALLENGE</h1>
                <p className="text-lg text-theme-secondary-text mb-8">Day of the challenge = Number of push-ups.</p>

                <div className="bg-theme-surface p-8 rounded-2xl shadow-xl border border-theme-border">
                    <form onSubmit={handleLogin}>
                        <label htmlFor="initials" className="block text-sm font-medium text-theme-secondary-text mb-2 text-left">
                            Enter Your Initials
                        </label>
                        <input
                            id="initials"
                            type="text"
                            value={initials}
                            onChange={(e) => setInitials(e.target.value.toUpperCase())}
                            maxLength={3}
                            placeholder="e.g. JD"
                            className="w-full px-4 py-3 bg-theme-surface-2 border border-theme-border rounded-lg text-theme-primary-text text-center text-2xl font-bold tracking-widest placeholder-theme-secondary-text focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        />
                        <label htmlFor="pin" className="block text-sm font-medium text-theme-secondary-text mt-6 mb-2 text-left">
                            Enter Your 4-Digit PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={4}
                            placeholder="e.g. 1234"
                            className="w-full px-4 py-3 bg-theme-surface-2 border border-theme-border rounded-lg text-theme-primary-text text-center text-2xl font-bold tracking-widest placeholder-theme-secondary-text focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        {apiError && <p className="text-red-500 text-sm mt-2">{apiError}</p>}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-8 py-4 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ease-in-out flex items-center justify-center gap-3"
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
                    <p className="text-sm text-yellow-500 mt-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                        The challenge has not been set up yet. Only the admin can log in to configure the start date.
                    </p>
                )}

                <p className="text-xs text-theme-secondary-text mt-8">
                    {isChallengeStarted
                        ? 'If your initials do not exist, we will create a new profile even though the challenge is already underway.'
                        : 'If your initials do not exist, a new profile will be created.'}
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
