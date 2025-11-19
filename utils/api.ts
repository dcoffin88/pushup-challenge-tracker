import { AppData, User } from '../types';

const parseJson = async <T>(response: Response): Promise<T> => {
    const data = await response.json();
    return data as T;
};

const ensureOk = (response: Response) => {
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
};

export const getAppData = async (): Promise<AppData> => {
    const response = await fetch('/api/data');
    ensureOk(response);
    return parseJson<AppData>(response);
};

export const getOrCreateUser = async (initials: string, pin: string): Promise<User> => {
    const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initials, pin }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as { error?: string }).error || 'Failed to get or create user');
    }
    return parseJson<User>(response);
};

export const logPushups = async (user: User, day: number, count: number): Promise<void> => {
    await fetch('/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, day, count }),
    });
};

export const useBreakDay = async (user: User, day: number): Promise<boolean> => {
    const response = await fetch('/api/break', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, day }),
    });
    ensureOk(response);
    const { success } = await parseJson<{ success: boolean }>(response);
    return success;
};

export const setChallengeStartDate = async (startDate: string, timezoneId: string): Promise<void> => {
    await fetch('/api/challenge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, timezoneId }),
    });
};

export const resetUser = async (initials: string): Promise<void> => {
    await fetch('/api/reset-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initials }),
    });
};

export const deleteUser = async (initials: string): Promise<void> => {
    await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initials }),
    });
};

export const editPin = async (initials: string, pin: string): Promise<void> => {
    await fetch('/api/edit-pin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initials, pin }),
    });
};

export const correctProgress = async (initials: string, day: number, count: number): Promise<void> => {
    await fetch('/api/correct-progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initials, day, count }),
    });
};
