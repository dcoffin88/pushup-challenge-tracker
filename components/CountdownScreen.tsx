import React, { useState, useEffect } from 'react';
import { DumbbellIcon, LogoutIcon } from './Icons';

interface CountdownScreenProps {
    startDate: string;
    onLogout: () => void;
    userInitials: string;
}

const CountdownScreen: React.FC<CountdownScreenProps> = ({ startDate, onLogout, userInitials }) => {
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
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
             <div className="absolute top-6 right-6 flex items-center space-x-4">
                <span className="text-gray-300 font-bold hidden sm:inline">Logged in as {userInitials}</span>
                <button onClick={onLogout} className="flex items-center space-x-2 bg-gray-700 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors">
                    <LogoutIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
            <div className="w-full max-w-2xl text-center">
                <DumbbellIcon className="w-20 h-20 text-cyan-400 mx-auto mb-4 animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Challenge Starts Soon!</h1>
                <p className="text-lg text-gray-400 mb-12">Get ready!</p>

                <div className="bg-gray-800/50 p-4 sm:p-8 rounded-lg shadow-2xl">
                    <div className="flex flex-wrap justify-center items-center">
                        {timerComponents.length ? timerComponents : <span>Loading...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountdownScreen;
