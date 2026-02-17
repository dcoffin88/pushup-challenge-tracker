
import React, { useState, useMemo } from 'react';
import type { LogEntry, LogStatus } from '../types';
import { getDateFromChallengeDay, getMonthFromDate } from '../utils/dateHelpers';

interface CalendarViewProps {
    logs: { [dayOfChallenge: number]: LogEntry };
    challengeStartDate: string;
    challengeDay: number;
    title?: string;
    containerClassName?: string;
    showOnlyCurrentMonth?: boolean;
    onDayClick?: (log: LogEntry) => void;
}

const statusColors: Record<LogStatus, string> = {
    completed: 'bg-green-500 hover:bg-green-400',
    missed: 'bg-red-500 hover:bg-red-400',
    break: 'bg-yellow-500 hover:bg-yellow-400',
    pending: 'bg-gray-700 hover:bg-gray-600',
    today: 'bg-cyan-500 hover:bg-cyan-400 ring-2 ring-cyan-300',
    in_progress: 'bg-blue-500 hover:bg-blue-400',
    over_achieved: 'bg-purple-500 hover:bg-purple-400',
};

const CalendarDay: React.FC<{ log: LogEntry; currentChallengeDay: number; onClick?: (log: LogEntry) => void }> = ({ log, currentChallengeDay, onClick }) => {
    const isToday = log.dayOfChallenge === currentChallengeDay;
    const isPast = log.dayOfChallenge < currentChallengeDay;

    let displayStatus: LogStatus = log.status;
    if (log.status === 'break') {
        displayStatus = 'break';
    } else if (log.pushupsDone > log.goal) {
        displayStatus = 'over_achieved';
    } else if (isToday && log.status === 'completed') {
        displayStatus = 'completed';
    } else if (isToday) {
        displayStatus = 'today';
    } else if (log.status === 'pending' && isPast) {
        displayStatus = 'missed';
    } else if (log.pushupsDone > 0 && log.status !== 'completed') {
        displayStatus = 'in_progress';
    }

    const colorClass = statusColors[displayStatus];
    const isFuture = log.dayOfChallenge > currentChallengeDay;
    const canEdit = !isFuture && !!onClick;

    return (
        <div className="relative group">
            <button
                onClick={() => canEdit && onClick?.(log)}
                disabled={!canEdit}
                className={`w-full aspect-square rounded ${colorClass} transition-all duration-200 ${canEdit ? 'hover:scale-110 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 z-10' : 'cursor-default'}`}
                aria-label={`Day ${log.dayOfChallenge}: ${log.goal} push-ups, ${log.pushupsDone} done`}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <p>Day {log.dayOfChallenge}: {log.goal} push-ups</p>
                <p>Date: {log.date}</p>
                <p>Push-ups done: {log.pushupsDone}</p>
                <p className="capitalize">Status: {displayStatus.replace('_', ' ')}</p>
                {canEdit && <p className="text-cyan-400 mt-1 font-semibold">Click to edit</p>}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
            </div>
        </div>
    );
};

const CalendarView: React.FC<CalendarViewProps> = ({ logs, challengeStartDate, challengeDay, title, containerClassName, showOnlyCurrentMonth, onDayClick }) => {
    const logsArray = Object.values(logs);
    if (!challengeStartDate || logsArray.length === 0) {
        return null;
    }

    const startYear = new Date(challengeStartDate).getUTCFullYear();

    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const dateForMonth = new Date(Date.UTC(startYear, i));
            const monthName = dateForMonth.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
            const daysInMonth = logsArray.filter((log: LogEntry) => {
                const logDate = getDateFromChallengeDay(log.dayOfChallenge, challengeStartDate);
                return getMonthFromDate(logDate) === i;
            });
            return { name: `${monthName} ${dateForMonth.getUTCFullYear()}`, days: daysInMonth, monthIndex: i, year: dateForMonth.getUTCFullYear() };
        }).filter(m => m.days.length > 0);
    }, [logsArray, challengeStartDate, startYear]);

    const currentMonthIndex = useMemo(() => {
        const today = getDateFromChallengeDay(challengeDay, challengeStartDate);
        return getMonthFromDate(today);
    }, [challengeDay, challengeStartDate]);

    const visibleMonths = showOnlyCurrentMonth
        ? months.filter((month) => month.monthIndex == currentMonthIndex)
        : months;

    const [collapsedMonths, setCollapsedMonths] = useState<number[]>(() => {
        return months.filter(m => m.monthIndex !== currentMonthIndex).map(m => m.monthIndex);
    });

    const toggleMonth = (monthIndex: number) => {
        setCollapsedMonths(prev =>
            prev.includes(monthIndex)
                ? prev.filter(m => m !== monthIndex)
                : [...prev, monthIndex]
        );
    };

    const wrapperClassName = `bg-theme-surface p-4 sm:p-6 rounded-xl shadow-inner border border-theme-border transition-colors ${containerClassName ?? 'mt-8'}`;

    return (
        <div className={wrapperClassName}>
            <h2 className="text-xl font-bold text-theme-primary-text mb-4">{title ?? 'Yearly Progress'}</h2>
            <div className="space-y-6">
                {visibleMonths.map((month) => {
                    const isCollapsed = collapsedMonths.includes(month.monthIndex);
                    return (
                        <div key={`${month.year}-${month.monthIndex}`}>
                            <button
                                className="text-lg font-semibold text-cyan-300 mb-3 w-full text-left flex justify-between items-center"
                                onClick={() => toggleMonth(month.monthIndex)}
                            >
                                <span>{month.name}</span>
                                <span>{isCollapsed ? '▼' : '▲'}</span>
                            </button>
                            {!isCollapsed && (
                                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                                    {month.days.map(log => (
                                        <CalendarDay
                                            key={log.dayOfChallenge}
                                            log={log}
                                            currentChallengeDay={challengeDay}
                                            onClick={onDayClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
