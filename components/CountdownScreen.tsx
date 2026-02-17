import React, { useState, useEffect } from 'react';
import { DumbbellIcon, LogoutIcon } from './Icons';

interface CountdownScreenProps {
    startDate: string;
    onLogout: () => void;
    userInitials: string;
    theme: 'light' | 'dark';
}

const CountdownScreen: React.FC<CountdownScreenProps> = ({ startDate, onLogout, userInitials, theme }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(startDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                Days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                Hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                Minutes: Math.floor((difference / 1000 / 60) % 60),
                Seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (!Object.keys(newTimeLeft).length) {
                window.location.reload();
            }
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents: React.ReactElement[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        timerComponents.push(
            <div key={interval} className="text-center p-2">
                <span className="text-4xl md:text-6xl font-bold text-cyan-400">
                    {String(timeLeft[interval as keyof typeof timeLeft]).padStart(2, '0')}
                </span>
                <span className="block text-sm md:text-lg text-gray-400 uppercase tracking-wider">{interval}</span>
            </div>
        );
    });

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col items-center justify-center p-4 relative transition-colors duration-300`}>
            <div className="absolute top-6 right-6 flex items-center gap-4">
                <span className="text-theme-secondary-text font-bold hidden sm:inline">Logged in as {userInitials}</span>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-theme-surface hover:bg-theme-surface-2 text-theme-primary-text font-bold py-2 px-4 rounded-lg transition shadow-sm border border-theme-border"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
            <div className="w-full max-w-2xl text-center">
                <div className="bg-cyan-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-cyan-500/20 animate-pulse">
                    <DumbbellIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-theme-primary-text mb-2 tracking-tight">CHALLENGE STARTS SOON!</h1>
                <p className="text-lg text-theme-secondary-text mb-12">Get ready for the grind.</p>

                <div className="bg-theme-surface p-6 sm:p-10 rounded-2xl shadow-xl border border-theme-border">
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        {timerComponents.length ? timerComponents : <span className="text-theme-secondary-text">Loading...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountdownScreen;
