
import React from 'react';
import type { User, LogEntry } from '../types';
import StatsCard from './StatsCard';
import CalendarView from './CalendarView';
import { ChartBarIcon, CheckCircleIcon } from './Icons';

interface CompetitionViewProps {
    user1: User;
    user2: User;
    challengeDay: number;
    challengeStartDate: string;
    todayDateString?: string;
}

const UserCompetitionProfile: React.FC<{ user: User; challengeDay: number; challengeStartDate: string; todayDateString?: string }> = ({ user, challengeDay, challengeStartDate, todayDateString }) => {
    const logs = Object.values(user.logs) as LogEntry[];
    const logsToDate = logs.filter((log) => log.dayOfChallenge <= challengeDay);
    // Treat over-achieved or any log that meets/exceeds the goal as completed for rate calculations
    const completedDays = logsToDate.filter((l) => {
        if (l.status === 'completed' || l.status === 'over_achieved') return true;
        return l.pushupsDone >= l.goal;
    }).length;
    const totalActualToDate = logsToDate.reduce((sum, log) => sum + log.pushupsDone, 0);
    const totalGoalToDate = logsToDate.reduce((sum, log) => sum + log.goal, 0);
    const completionRate = challengeDay > 0 ? ((completedDays / challengeDay) * 100).toFixed(1) : "0.0";

    const todayLog = todayDateString
        ? logs.find((log) => log.date === todayDateString) || user.logs[challengeDay]
        : user.logs[challengeDay];
    const progressPercentage = todayLog ? Math.min(100, (todayLog.pushupsDone / todayLog.goal) * 100) : 0;

    return (
        <div className="w-full bg-theme-surface p-4 rounded-lg border border-theme-border transition-colors">
            <h3 className="text-2xl font-bold text-center text-cyan-500 dark:text-cyan-400 mb-4">{user.initials}</h3>

            <div className="mb-4">
                <p className="text-center text-sm text-theme-secondary-text">Today's Progress</p>
                {todayLog?.status === 'break' ? (
                    <p className="text-center text-2xl font-bold text-yellow-500 dark:text-yellow-400">On Break</p>
                ) : (
                    <>
                        <p className="text-center text-2xl font-bold text-theme-primary-text">
                            {todayLog?.pushupsDone || 0} / {todayLog?.goal || 0}
                        </p>
                        <div className="w-full bg-theme-surface-2 rounded-full h-2.5 mt-2 overflow-hidden">
                            <div
                                className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-3">
                <StatsCard
                    title="Total Goal to date"
                    value={totalGoalToDate.toLocaleString()}
                    icon={<ChartBarIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />}
                />
                <StatsCard
                    title="Total Actual to date"
                    value={totalActualToDate.toLocaleString()}
                    icon={<ChartBarIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />}
                />
                <StatsCard
                    title="Completion Rate"
                    value={`${completionRate}%`}
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />}
                />
            </div>
            <CalendarView
                logs={user.logs}
                challengeStartDate={challengeStartDate}
                challengeDay={challengeDay}
                title={``}
                containerClassName="mt-4 !bg-transparent !border-none !p-0 shadow-none"
                showOnlyCurrentMonth
            />
        </div>
    );
};

const CompetitionView: React.FC<CompetitionViewProps> = ({ user1, user2, challengeDay, challengeStartDate, todayDateString }) => {
    if (challengeDay <= 0) return null;

    return (
        <div className="mt-8 bg-theme-surface-2/50 p-4 sm:p-6 rounded-xl shadow-inner border border-theme-border transition-colors">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <UserCompetitionProfile user={user1} challengeDay={challengeDay} challengeStartDate={challengeStartDate} todayDateString={todayDateString} />
                <div className="text-4xl font-black text-theme-surface-3 p-2">VS</div>
                <UserCompetitionProfile user={user2} challengeDay={challengeDay} challengeStartDate={challengeStartDate} todayDateString={todayDateString} />
            </div>
        </div>
    );
};

export default CompetitionView;
