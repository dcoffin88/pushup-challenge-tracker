const TIMEZONE_STORAGE_KEY = 'pushup_challenge_timezone';
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
type StorageLike = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };

const isValidTimezone = (value: string): boolean => {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
        return true;
    } catch {
        return false;
    }
};

const parseTimezoneFromEnv = (): string | null => {
    if (typeof process === 'undefined') return null;
    const envTz = process.env.APP_TIMEZONE || process.env.TZ || process.env.TIMEZONE;
    return envTz && isValidTimezone(envTz) ? envTz : null;
};

const getLocalStorage = (): StorageLike | null => {
    if (typeof globalThis === 'undefined') return null;
    const storage = (globalThis as { localStorage?: StorageLike }).localStorage;
    return storage || null;
};

const detectInitialTimezone = (): string => {
    const envTz = parseTimezoneFromEnv();
    if (envTz) return envTz;

    if (typeof globalThis !== 'undefined') {
        const symbolKey = Symbol.for('PUSHUP_CHALLENGE_TZ');
        const storedSymbol = (globalThis as Record<symbol, unknown>)[symbolKey];
        if (typeof storedSymbol === 'string' && isValidTimezone(storedSymbol)) {
            return storedSymbol;
        }
    }

    const storage = getLocalStorage();
    if (storage) {
        const storedTz = storage.getItem(TIMEZONE_STORAGE_KEY);
        if (storedTz && isValidTimezone(storedTz)) {
            return storedTz;
        }
    }

    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (systemTz && isValidTimezone(systemTz)) {
            return systemTz;
        }
    }

    return '';
};

let timezoneId = detectInitialTimezone();
let formatterCache: Intl.DateTimeFormat | null = null;
let formatterTz = timezoneId;

const getFormatter = () => {
    if (!formatterCache || formatterTz !== timezoneId) {
        formatterCache = new Intl.DateTimeFormat('en-US', {
            timeZone: timezoneId,
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        formatterTz = timezoneId;
    }
    return formatterCache;
};

const partsToMap = (parts: Intl.DateTimeFormatPart[]) => {
    const map: Record<string, string> = {};
    parts.forEach((part) => {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    });
    return map;
};

const getTimezoneParts = (date: Date) => partsToMap(getFormatter().formatToParts(date));

const getTimezoneOffsetMinutes = (date: Date): number => {
    const parts = getTimezoneParts(date);
    const asUTC = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
    );
    return (asUTC - date.getTime()) / MS_PER_MINUTE;
};

const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

const convertLocalDateToUtc = (localDate: Date): Date => {
    let utcGuess = localDate.getTime();
    let offset = getTimezoneOffsetMinutes(new Date(utcGuess));
    let candidate = utcGuess - offset * MS_PER_MINUTE;
    const recalculatedOffset = getTimezoneOffsetMinutes(new Date(candidate));
    if (recalculatedOffset !== offset) {
        candidate = utcGuess - recalculatedOffset * MS_PER_MINUTE;
    }
    return new Date(candidate);
};

const getStartOfDayUtcForTimezone = (date: Date): Date => {
    const parts = getTimezoneParts(date);
    const localMidnight = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
    return convertLocalDateToUtc(localMidnight);
};

const addDaysLocal = (localDate: Date, days: number) =>
    new Date(localDate.getTime() + days * MS_PER_DAY);

const pad = (value: number) => value.toString().padStart(2, '0');

export const getConfiguredTimezone = (): string => timezoneId;

export const setConfiguredTimezone = (tz: string) => {
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const resolved = isValidTimezone(tz) ? tz : (fallback && isValidTimezone(fallback)) ? fallback : timezoneId || 'UTC';
    timezoneId = resolved;
    formatterCache = null;
    formatterTz = timezoneId;
    if (typeof globalThis !== 'undefined') {
        const symbolKey = Symbol.for('PUSHUP_CHALLENGE_TZ');
        (globalThis as Record<symbol, unknown>)[symbolKey] = timezoneId;
    }
    const storage = getLocalStorage();
    storage?.setItem(TIMEZONE_STORAGE_KEY, timezoneId);
};

export const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const getDaysInYear = (year: number): number => {
    return isLeapYear(year) ? 366 : 365;
};

const getConfiguredStartLocalDate = (startDateString: string): Date => parseLocalDate(startDateString);

const getConfiguredStartDate = (startDateString: string): Date => {
    const localDate = getConfiguredStartLocalDate(startDateString);
    return convertLocalDateToUtc(localDate);
};

export const getDateFromChallengeDay = (dayOfChallenge: number, startDateString: string): Date => {
    const startLocal = getConfiguredStartLocalDate(startDateString);
    const targetLocal = addDaysLocal(startLocal, dayOfChallenge - 1);
    return convertLocalDateToUtc(targetLocal);
};

export const getLocalDateStringFromChallengeDay = (dayOfChallenge: number, startDateString: string): string => {
    const startLocal = getConfiguredStartLocalDate(startDateString);
    const targetLocal = addDaysLocal(startLocal, dayOfChallenge - 1);
    return `${targetLocal.getUTCFullYear()}-${pad(targetLocal.getUTCMonth() + 1)}-${pad(targetLocal.getUTCDate())}`;
};

export const getChallengeDayInfo = (startDateString: string | null) => {
    if (!startDateString) {
        return {
            challengeDay: 0,
            isChallengeActive: false,
            timeUntilStart: -1,
            daysInChallenge: 365,
        };
    }

    // Work entirely in the configured timezone's calendar days to avoid UTC rolling the date early/late.
    const startLocal = getConfiguredStartLocalDate(startDateString);
    const now = new Date();
    const todayLocal = getConfiguredStartLocalDate(toYyyyMmDd(now));

    const startLocalYear = startLocal.getUTCFullYear();
    const daysInChallenge = getDaysInYear(startLocalYear);
    const endLocal = addDaysLocal(startLocal, daysInChallenge - 1);

    if (todayLocal.getTime() < startLocal.getTime()) {
        return {
            challengeDay: 0,
            isChallengeActive: false,
            timeUntilStart: convertLocalDateToUtc(startLocal).getTime() - now.getTime(),
            daysInChallenge,
        };
    }

    if (todayLocal.getTime() > endLocal.getTime()) {
        return {
            challengeDay: -1,
            isChallengeActive: false,
            timeUntilStart: 0,
            daysInChallenge,
        };
    }

    const diffDays = Math.floor((todayLocal.getTime() - startLocal.getTime()) / MS_PER_DAY) + 1;

    return {
        challengeDay: diffDays,
        isChallengeActive: true,
        timeUntilStart: 0,
        daysInChallenge,
    };
};

export const getMonthFromDate = (date: Date): number => {
    const parts = getTimezoneParts(date);
    return Number(parts.month) - 1;
};

export const toYyyyMmDd = (date: Date): string => {
    const parts = getTimezoneParts(date);
    return `${parts.year}-${pad(Number(parts.month))}-${pad(Number(parts.day))}`;
};

export const isValidTimezoneId = (value: string): boolean => isValidTimezone(value);
