
import React, { useState, useMemo } from 'react';
import type { User, LogEntry } from '../types';
import { getDateFromChallengeDay, getMonthFromDate, toYyyyMmDd } from '../utils/dateHelpers';
import CalendarView from './CalendarView';
import StatsCard from './StatsCard';
import { CalendarIcon, ChartBarIcon, CheckCircleIcon, LogoutIcon } from './Icons';
import UserSelector from './UserSelector';
import CompetitionView from './CompetitionView';
import AdminPanel from './AdminPanel';

interface DashboardProps {
    user: User;
    onLogPushups: (day: number, count: number) => void;
    onUseBreakDay: (day: number) => boolean;
    onLogout: () => void;
    allUsers: User[];
    challengeDay: number;
    challengeStartDate: string | null;
    timezoneId: string;
    onSetChallengeStartDate: (date: string, timezoneId: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogPushups, onUseBreakDay, onLogout, allUsers, challengeDay, challengeStartDate, timezoneId, onSetChallengeStartDate }) => {
    const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
    const [pushupInput, setPushupInput] = useState('');
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const activeChallengeDay = challengeDay;
    const todayLog = user.logs[activeChallengeDay];
    const dateOfChallengeDay = challengeStartDate ? getDateFromChallengeDay(activeChallengeDay, challengeStartDate) : new Date();
    const todayDateString = challengeStartDate ? toYyyyMmDd(dateOfChallengeDay) : null;
    const currentMonth = getMonthFromDate(dateOfChallengeDay);
    const breakDayAvailable = (user.breakDaysUsed[currentMonth] || 0) < 1;

    const stats = useMemo(() => {
        const logs = Object.values(user.logs);
        const logsToDate = logs.filter((log) => log.dayOfChallenge <= activeChallengeDay);
        const completedDays = logsToDate.filter((l: LogEntry) => {
            if (l.status === 'completed' || l.status === 'over_achieved') return true;
            return l.pushupsDone >= l.goal; // fallback if status wasn't updated
        }).length;
        const totalActualToDate = logsToDate.reduce((sum, log: LogEntry) => sum + log.pushupsDone, 0);
        const totalGoalToDate = logsToDate.reduce((sum, log: LogEntry) => sum + log.goal, 0);
        return { completedDays, totalActualToDate, totalGoalToDate };
    }, [user.logs, activeChallengeDay]);

    const handleAddPushups = () => {
        const count = parseInt(pushupInput, 10);
        if (!isNaN(count) && count > 0) {
            onLogPushups(activeChallengeDay, count);
            setPushupInput('');
        }
    };

    const handleUseBreakDay = () => {
        if(confirm("Are you sure you want to use your break day for this month? This cannot be undone.")) {
            onUseBreakDay(activeChallengeDay);
        }
    };
    
    const handleSelectUser = (initials: string) => {
        const opponent = allUsers.find(u => u.initials === initials) || null;
        setSelectedOpponent(opponent);
    };

    if (!challengeStartDate) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center text-center">
                 <h1 className="text-3xl font-bold">{user.initials}</h1>
                 <p className="text-gray-400 mt-2 mb-8">The challenge needs to be configured.</p>
                 {user.initials === 'DC' ? (
                     <button onClick={() => setShowAdminPanel(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg">
                        Setup Challenge
                    </button>
                 ) : (
                    <p>Please wait for the admin (DC) to set the challenge start date.</p>
                 )}
                 {showAdminPanel && (
                    <AdminPanel
                        currentStartDate={challengeStartDate}
                        currentTimezoneId={timezoneId}
                        onSetStartDate={onSetChallengeStartDate}
                        onClose={() => setShowAdminPanel(false)}
                        allUsers={allUsers}
                    />
                )}
                 <button onClick={onLogout} className="absolute top-6 right-6 flex items-center space-x-2 bg-gray-700 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors">
                    <LogoutIcon className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        )
    }

    const progressPercentage = todayLog ? Math.min(100, (todayLog.pushupsDone / todayLog.goal) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{user.initials}</h1>
                        <p className="text-gray-400">Day {challengeDay} of the Challenge</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user.initials === 'DC' && (
                             <button onClick={() => setShowAdminPanel(true)} className="flex items-center space-x-2 bg-gray-700 hover:bg-cyan-500 px-4 py-2 rounded-lg transition-colors">
                                Admin
                            </button>
                        )}
                        <button onClick={onLogout} className="flex items-center space-x-2 bg-gray-700 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors">
                            <LogoutIcon className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard title="Total Goal to date" value={stats.totalGoalToDate.toLocaleString()} icon={<ChartBarIcon className="w-8 h-8 text-cyan-300" />} />
                    <StatsCard title="Total Actual to date" value={stats.totalActualToDate.toLocaleString()} icon={<ChartBarIcon className="w-8 h-8 text-cyan-300" />} />
                    <StatsCard title="Days Completed" value={stats.completedDays} icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} />
                    <StatsCard title="Break Days Left (Month)" value={breakDayAvailable ? 1 : 0} icon={<CalendarIcon className="w-8 h-8 text-yellow-400" />} />
                </div>

                <div className="bg-gray-800/50 p-6 rounded-xl shadow-inner">
				  <div className="text-center">
					<h2 className="text-lg text-gray-400">Today's Progress</h2>

					{todayLog?.status === 'break' ? (
					  <p className="text-5xl font-extrabold text-yellow-400 my-2">On Break</p>
					) : (
					  <>
						<p className="text-5xl font-extrabold text-cyan-400 my-2">
						  {todayLog?.pushupsDone || 0} / {todayLog?.goal || 0}
						</p>
						<div className="w-full bg-gray-700 rounded-full h-4 my-4 overflow-hidden">
						  <div
							className="bg-cyan-500 h-4 rounded-full transition-all duration-500"
							style={{ width: `${progressPercentage}%` }}
						  ></div>
						</div>
					  </>
					)}
				  </div>

				  {/* Show controls only if NOT on break */}
				  {todayLog?.status !== 'break' && (
					<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
					  <input
						type="number"
						value={pushupInput}
						onChange={(e) => setPushupInput(e.target.value)}
						placeholder="Enter count"
						className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-2xl font-bold tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
					  />
					  <button
						onClick={handleAddPushups}
						className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg w-full sm:w-auto"
					  >
						Add Pushups
					  </button>
					  {breakDayAvailable && (
						<button
						  onClick={handleUseBreakDay}
						  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg w-full sm:w-auto"
						>
						  Use Break Day
						</button>
					  )}
					</div>
				  )}

				  {/* Status messages below */}
				  {todayLog && (todayLog.status === 'completed' || todayLog.status === 'over_achieved') && (
					<div className="text-center text-green-400 font-bold text-xl mt-6">
					  Today's goal completed! Great job!
					</div>
				  )}


				  {todayLog?.status === 'break' && (
					<div className="text-center text-yellow-400 font-bold text-xl mt-6">
					  You're on a break today. Rest up!
					</div>
				  )}
				</div>

                {allUsers.length > 1 && (
                    <div className="mt-8 bg-gray-800/50 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4 text-center">Head-to-Head</h2>
                        <UserSelector users={allUsers} currentUserInitials={user.initials} onSelectUser={handleSelectUser} selectedValue={selectedOpponent?.initials || ''} />
                    </div>
                )}
                
                {selectedOpponent && (
                    <CompetitionView
                        user1={user}
                        user2={selectedOpponent}
                        challengeDay={activeChallengeDay}
                        challengeStartDate={challengeStartDate}
                        todayDateString={todayDateString || undefined}
                    />
                )}

                {!selectedOpponent && (
                    <CalendarView logs={user.logs} challengeStartDate={challengeStartDate} challengeDay={activeChallengeDay} />
                )}
                {showAdminPanel && (
                    <AdminPanel
                        currentStartDate={challengeStartDate}
                        currentTimezoneId={timezoneId}
                        onSetStartDate={onSetChallengeStartDate}
                        onClose={() => setShowAdminPanel(false)}
                        allUsers={allUsers}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
