
import React from 'react';
import type { User, LogEntry } from '../types';
import StatsCard from './StatsCard';
import { ChartBarIcon, CheckCircleIcon } from './Icons';

interface CompetitionViewProps {
    user1: User;
    user2: User;
    challengeDay: number;
    todayDateString?: string;
}

const UserCompetitionProfile: React.FC<{user: User; challengeDay: number; todayDateString?: string}> = ({ user, challengeDay, todayDateString }) => {
    const logs = Object.values(user.logs);
    const completedDays = logs.filter((l: LogEntry) => l.status === 'completed').length;
    const totalPushups = logs.reduce((sum, log: LogEntry) => sum + log.pushupsDone, 0);
    const completionRate = challengeDay > 0 ? ((completedDays / challengeDay) * 100).toFixed(1) : "0.0";
    
    const todayLog = todayDateString
        ? logs.find((log) => log.date === todayDateString) || user.logs[challengeDay]
        : user.logs[challengeDay];
    const progressPercentage = todayLog ? Math.min(100, (todayLog.pushupsDone / todayLog.goal) * 100) : 0;

    return (
        <div className="w-full bg-gray-800 p-4 rounded-lg">
            <h3 className="text-2xl font-bold text-center text-cyan-400 mb-4">{user.initials}</h3>
            
            <div className="mb-4">
                <p className="text-center text-sm text-gray-400">Today's Progress</p>
                {todayLog?.status === 'break' ? (
                    <p className="text-center text-2xl font-bold text-yellow-400">On Break</p>
                ) : (
                    <>
                        <p className="text-center text-2xl font-bold text-white">
                            {todayLog?.pushupsDone || 0} / {todayLog?.goal || 0}
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
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
                    title="Total Push-ups"
                    value={totalPushups.toLocaleString()}
                    icon={<ChartBarIcon className="w-6 h-6 text-cyan-300" />}
                />
                <StatsCard 
                    title="Completion Rate"
                    value={`${completionRate}%`}
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-400" />}
                />
            </div>
        </div>
    );
};

const CompetitionView: React.FC<CompetitionViewProps> = ({ user1, user2, challengeDay, todayDateString }) => {
    if (challengeDay <= 0) return null;

    return (
        <div className="mt-8 bg-gray-900/50 p-4 sm:p-6 rounded-xl shadow-inner">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <UserCompetitionProfile user={user1} challengeDay={challengeDay} todayDateString={todayDateString} />
                <div className="text-4xl font-black text-gray-600 p-2">VS</div>
                <UserCompetitionProfile user={user2} challengeDay={challengeDay} todayDateString={todayDateString} />
            </div>
        </div>
    );
};

export default CompetitionView;
