import { useState, useEffect, useCallback } from 'react';
import type { AppData, User } from '../types';
import { getAppData, getOrCreateUser as apiGetOrCreateUser, logPushups as apiLogPushups, useBreakDay as apiUseBreakDay, setChallengeStartDate as apiSetChallengeStartDate, correctProgress as apiCorrectProgress } from '../utils/api';
import { setConfiguredTimezone } from '../utils/dateHelpers';

export const useUserData = () => {
    const [data, setData] = useState<AppData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const appData = await getAppData();
            if (appData.timezoneId) {
                setConfiguredTimezone(appData.timezoneId);
            }
            setData(appData);
        } catch (error) {
            console.error("Failed to load data from server", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getOrCreateUser = useCallback(async (initials: string, pin: string): Promise<User> => {
        const user = await apiGetOrCreateUser(initials, pin);
        fetchData();
        return user;
    }, [fetchData]);

    const logPushups = useCallback(async (user: User, day: number, count: number) => {
        await apiLogPushups(user, day, count);
        fetchData();
    }, [fetchData]);

    const useBreakDay = useCallback(async (user: User, day: number): Promise<boolean> => {
        const success = await apiUseBreakDay(user, day);
        fetchData();
        return success;
    }, [fetchData]);

    const getUsers = useCallback(() => {
        return data ? Object.values(data.users) : [];
    }, [data]);

    const setChallengeStartDate = useCallback(async (startDate: string, timezoneId: string) => {
        await apiSetChallengeStartDate(startDate, timezoneId);
        fetchData();
    }, [fetchData]);

    const updateUser = useCallback(async (updatedUser: User) => {
        fetchData();
    }, [fetchData]);

    const correctProgress = useCallback(async (initials: string, day: number, count: number) => {
        await apiCorrectProgress(initials, day, count);
        fetchData();
    }, [fetchData]);


    return { loading, data, getOrCreateUser, logPushups, useBreakDay, getUsers, updateUser, setChallengeStartDate, correctProgress };
};
