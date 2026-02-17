import React, { useState, useCallback, useEffect } from 'react';
import type { User } from './types.js';
import { useUserData } from './hooks/useUserData';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import CountdownScreen from './components/CountdownScreen';
import { getChallengeDayInfo, getDateFromChallengeDay } from './utils/dateHelpers';

const SESSION_MAX_MS = 60 * 60 * 1000;
const SESSION_LAST_ACTIVE_KEY = 'sessionLastActiveAt';

const App: React.FC = () => {
    const { loading, data, getOrCreateUser, logPushups, useBreakDay, getUsers, updateUser, setChallengeStartDate, correctProgress } = useUserData();
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (storedTheme) return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

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
        localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
        setCurrentUser(user);
    }, [data]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
        setCurrentUser(null);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
        return <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center text-current`}>Loading Challenge...</div>;
    }

    const challengeInfo = getChallengeDayInfo(data.challengeStartDate);
    const isChallengeStarted = challengeInfo.isChallengeActive || challengeInfo.challengeDay === -1;

    if (!currentUser) {
        return (
            <LoginScreen
                onLogin={handleLogin}
                getOrCreateUser={getOrCreateUser}
                isChallengeConfigured={!!data.challengeStartDate}
                isChallengeStarted={data.challengeStartDate ? new Date(data.challengeStartDate) <= new Date() : false}
                theme={theme}
            />
        );
    }

    if (data.challengeStartDate && !challengeInfo.isChallengeActive && challengeInfo.timeUntilStart > 0) {
        const countdownStartDate = getDateFromChallengeDay(1, data.challengeStartDate).toISOString();
        return <CountdownScreen startDate={countdownStartDate} onLogout={handleLogout} userInitials={currentUser.initials} theme={theme} />;
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
            onCorrectProgress={correctProgress}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
    );
};

export default App;
