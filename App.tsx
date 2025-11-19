import React, { useState, useCallback, useEffect } from 'react';
import type { User } from './types.js';
import { useUserData } from './hooks/useUserData';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import CountdownScreen from './components/CountdownScreen';
import { getChallengeDayInfo, getDateFromChallengeDay } from './utils/dateHelpers';

const App: React.FC = () => {
    const { loading, data, getOrCreateUser, logPushups, useBreakDay, getUsers, updateUser, setChallengeStartDate } = useUserData();
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser && data?.users[currentUser.initials]) {
            const latestUserData = data.users[currentUser.initials];
            if (JSON.stringify(currentUser) !== JSON.stringify(latestUserData)) {
               setCurrentUser(latestUserData);
            }
        }
    }, [data, currentUser]);

    const handleLogin = useCallback(async (user: User) => {
        if (data && !data.challengeStartDate && user.initials !== 'DC') {
            alert("The challenge has not been configured by the admin yet. Please wait.");
            return;
        }
        setCurrentUser(user);
    }, [data]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    const handleLogPushups = useCallback(async (day: number, count: number) => {
        if (currentUser) {
            await logPushups(currentUser, day, count);
        }
    }, [currentUser, logPushups]);

    const handleUseBreakDay = useCallback(async (day: number): Promise<boolean> => {
        if (currentUser) {
            return await useBreakDay(currentUser, day);
        }
        return false;
    }, [currentUser, useBreakDay]);
    
    if (loading || !data) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Challenge...</div>;
    }

    const challengeInfo = getChallengeDayInfo(data.challengeStartDate);
    const isChallengeStarted = challengeInfo.isChallengeActive || challengeInfo.challengeDay === -1;

    if (!currentUser) {
         return (
            <LoginScreen 
                onLogin={handleLogin} 
                getOrCreateUser={getOrCreateUser} 
                isChallengeConfigured={!!data.challengeStartDate}
                isChallengeStarted={isChallengeStarted}
            />
        );
    }

    if (data.challengeStartDate && !challengeInfo.isChallengeActive && challengeInfo.timeUntilStart > 0) {
        const countdownStartDate = getDateFromChallengeDay(1, data.challengeStartDate).toISOString();
        return <CountdownScreen startDate={countdownStartDate} onLogout={handleLogout} userInitials={currentUser.initials} />;
    }

    return (
        <Dashboard 
            user={currentUser} 
            onLogPushups={handleLogPushups} 
            onUseBreakDay={handleUseBreakDay}
            onLogout={handleLogout}
            allUsers={getUsers()}
            challengeDay={challengeInfo.challengeDay}
            challengeStartDate={data.challengeStartDate}
            timezoneId={data.timezoneId}
            onSetChallengeStartDate={setChallengeStartDate}
        />
    );
};

export default App;
