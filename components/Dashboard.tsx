
import React, { useState, useMemo } from 'react';
import type { User, LogEntry } from '../types';
import { getDateFromChallengeDay, getMonthFromDate, toYyyyMmDd } from '../utils/dateHelpers';
import CalendarView from './CalendarView';
import StatsCard from './StatsCard';
import { ChartBarIcon, CheckCircleIcon, DumbbellIcon, LogoutIcon, SunIcon, MoonIcon, CalendarIcon, CogIcon } from './Icons';
import UserSelector from './UserSelector';
import CompetitionView from './CompetitionView';
import AdminPanel from './AdminPanel';
import DayActionModal from './DayActionModal';

interface DashboardProps {
  user: User;
  allUsers: User[];
  onLogPushups: (day: number, count: number) => Promise<void>;
  onUseBreakDay: (day: number) => Promise<boolean>;
  onLogout: () => void;
  challengeDay: number;
  challengeStartDate: string;
  timezoneId: string;
  onSetChallengeStartDate: (date: string) => Promise<void>;
  onCorrectProgress: (initials: string, day: number, count: number) => Promise<void>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  allUsers,
  onLogPushups,
  onUseBreakDay,
  onLogout,
  challengeDay,
  challengeStartDate,
  timezoneId,
  onSetChallengeStartDate,
  onCorrectProgress,
  theme,
  onToggleTheme
}) => {
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [pushupInput, setPushupInput] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedLogForEdit, setSelectedLogForEdit] = useState<LogEntry | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const activeChallengeDay = challengeDay;
  const todayLog = user.logs[activeChallengeDay];
  const dateOfChallengeDay = challengeStartDate ? getDateFromChallengeDay(activeChallengeDay, challengeStartDate) : new Date();
  const todayDateString = challengeStartDate ? toYyyyMmDd(dateOfChallengeDay) : null;

  const isBreakDayAvailable = (monthIndex: number) => {
    return (user.breakDaysUsed[monthIndex] || 0) < 1;
  };

  const currentMonth = getMonthFromDate(dateOfChallengeDay);

  const stats = useMemo(() => {
    const logs = Object.values(user.logs) as LogEntry[];
    const logsToDate = logs.filter((log) => log.dayOfChallenge <= activeChallengeDay);
    const completedDays = logsToDate.filter((l) => {
      if (l.status === 'completed' || l.status === 'over_achieved') return true;
      return l.pushupsDone >= l.goal; // fallback if status wasn't updated
    }).length;
    const totalActualToDate = logsToDate.reduce((sum: number, log: LogEntry) => sum + log.pushupsDone, 0);
    const totalGoalToDate = logsToDate.reduce((sum: number, log: LogEntry) => sum + log.goal, 0);
    return { completedDays, totalActualToDate, totalGoalToDate };
  }, [user.logs, activeChallengeDay]);

  const handleAddPushups = async () => {
    const count = parseInt(pushupInput, 10);
    if (!isNaN(count) && count > 0) {
      await onLogPushups(activeChallengeDay, count);
      setPushupInput('');
    }
  };

  const handleUseBreakDay = async () => {
    if (confirm("Are you sure you want to use your break day for this month? This cannot be undone.")) {
      await onUseBreakDay(activeChallengeDay);
    }
  };

  const handleSelectUser = (initials: string) => {
    const opponent = allUsers.find(u => u.initials === initials) || null;
    setSelectedOpponent(opponent);
  };

  const handleDayClick = (log: LogEntry) => {
    setSelectedLogForEdit(log);
  };

  const handleSaveDayEdit = async (count: number) => {
    if (!selectedLogForEdit) return;
    try {
      setIsSavingEdit(true);
      await onCorrectProgress(user.initials, selectedLogForEdit.dayOfChallenge, count);
      setSelectedLogForEdit(null);
    } catch (error) {
      console.error("Failed to update pushups", error);
      alert("Failed to update pushups. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleUseBreakDayFromModal = async () => {
    if (!selectedLogForEdit) return;
    if (confirm(`Are you sure you want to use a break day for Day ${selectedLogForEdit.dayOfChallenge}? This cannot be undone.`)) {
      try {
        setIsSavingEdit(true);
        await onUseBreakDay(selectedLogForEdit.dayOfChallenge);
        setSelectedLogForEdit(null);
      } catch (error) {
        console.error("Failed to use break day", error);
        alert("Failed to use break day. Please try again.");
      } finally {
        setIsSavingEdit(false);
      }
    }
  };

  if (!challengeStartDate) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-8 flex flex-col items-center justify-center text-center transition-colors duration-300`}>
        <div className="bg-theme-surface p-12 rounded-2xl shadow-xl border border-theme-border max-w-md w-full">
          <div className="bg-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
            <DumbbellIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-theme-primary-text mb-2">PUSHUP CHALLENGE</h1>
          <p className="text-theme-secondary-text mb-8">The challenge has not been configured yet.</p>

          {user.initials === 'DC' ? (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Setup Challenge
            </button>
          ) : (
            <div className="p-4 bg-theme-surface-2 rounded-xl text-theme-secondary-text border border-theme-border">
              <p>Please wait for the admin (DC) to set the challenge start date.</p>
            </div>
          )}
        </div>

        {showAdminPanel && (
          <AdminPanel
            currentStartDate={challengeStartDate}
            currentTimezoneId={timezoneId}
            onSetStartDate={onSetChallengeStartDate}
            onClose={() => setShowAdminPanel(false)}
            allUsers={allUsers}
          />
        )}

        <button
          onClick={onLogout}
          className="absolute top-6 right-6 flex items-center gap-2 bg-theme-surface hover:bg-theme-surface-2 text-theme-primary-text font-bold py-2 px-4 rounded-lg transition shadow-sm border border-theme-border"
        >
          <LogoutIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    )
  }

  const progressPercentage = todayLog ? Math.min(100, (todayLog.pushupsDone / todayLog.goal) * 100) : 0;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} transition-colors duration-300`}>
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2 rounded-lg shadow-inner">
              <DumbbellIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>PUSHUP CHALLENGE</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
            {user.initials === 'DC' && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 text-cyan-400 hover:bg-gray-600' : 'bg-gray-100 text-cyan-600 hover:bg-gray-200'}`}
                title="Admin Settings"
              >
                <CogIcon className="w-6 h-6" />
              </button>
            )}
            <div className={`flex flex-col items-center sm:items-end ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="text-sm font-medium">Logged in as</span>
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>{user.initials}</span>
            </div>
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-bold py-2 px-4 rounded-lg transition shadow-sm`}
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total Goal to date" value={stats.totalGoalToDate.toLocaleString()} icon={<ChartBarIcon className="w-8 h-8 text-cyan-300" />} />
          <StatsCard title="Total Actual to date" value={stats.totalActualToDate.toLocaleString()} icon={<ChartBarIcon className="w-8 h-8 text-cyan-300" />} />
          <StatsCard title="Days Completed" value={stats.completedDays} icon={<CheckCircleIcon className="w-8 h-8 text-green-400" />} />
          <StatsCard title="Break Days Left (Month)" value={isBreakDayAvailable(currentMonth) ? 1 : 0} icon={<CalendarIcon className="w-8 h-8 text-yellow-400" />} />
        </div>

        <div className="bg-theme-surface p-6 rounded-xl shadow-inner border border-theme-border transition-colors">
          <div className="text-center">
            <h2 className="text-lg text-theme-secondary-text">Today's Progress</h2>

            {todayLog?.status === 'break' ? (
              <p className="text-5xl font-extrabold text-yellow-400 my-2">On Break</p>
            ) : (
              <>
                <p className="text-5xl font-extrabold text-cyan-400 my-2">
                  {todayLog?.pushupsDone || 0} / {todayLog?.goal || 0}
                </p>
                <div className="w-full bg-theme-surface-2 rounded-full h-4 my-4 overflow-hidden">
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
            <div className="flex flex-col items-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPushupInput(Math.max(0, (parseInt(pushupInput) || 0) - 1).toString())}
                  className="w-10 h-10 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-theme-secondary-text font-bold transition-colors"
                  title="-1"
                >
                  -1
                </button>
                <button
                  onClick={() => setPushupInput(Math.max(0, (parseInt(pushupInput) || 0) - 10).toString())}
                  className="w-12 h-12 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-cyan-500 dark:text-cyan-400 font-bold transition-colors"
                  title="-10"
                >
                  -10
                </button>

                <input
                  type="number"
                  value={pushupInput}
                  onChange={(e) => setPushupInput(e.target.value)}
                  placeholder="0"
                  className="px-4 py-3 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text text-center text-2xl font-bold tracking-widest placeholder-theme-secondary-text focus:outline-none focus:ring-2 focus:ring-cyan-400 transition no-spinner w-24"
                />

                <button
                  onClick={() => setPushupInput(((parseInt(pushupInput) || 0) + 10).toString())}
                  className="w-12 h-12 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-cyan-500 dark:text-cyan-400 font-bold transition-colors"
                  title="+10"
                >
                  +10
                </button>
                <button
                  onClick={() => setPushupInput(((parseInt(pushupInput) || 0) + 1).toString())}
                  className="w-10 h-10 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-theme-secondary-text font-bold transition-colors"
                  title="+1"
                >
                  +1
                </button>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                <button
                  onClick={handleAddPushups}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg w-full sm:w-auto transition-colors"
                >
                  Add Pushups
                </button>
                {isBreakDayAvailable(currentMonth) && (
                  <button
                    onClick={handleUseBreakDay}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg w-full sm:w-auto transition-colors"
                  >
                    Use Break Day
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Status messages below */}
          <div className="mt-8 flex justify-center">
            {todayLog?.pushupsDone > todayLog?.goal ? (
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex items-center justify-center gap-3 w-full sm:w-auto">
                <DumbbellIcon className="w-6 h-6 text-purple-500" />
                <span className="text-purple-500 font-bold">Over-achieved! Keep it up!</span>
              </div>
            ) : todayLog?.status === 'completed' ? (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-center gap-3 w-full sm:w-auto">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <span className="text-green-500 font-bold">Goal completed!</span>
              </div>
            ) : progressPercentage >= 80 ? (
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-xl flex items-center justify-center gap-3 w-full sm:w-auto">
                <DumbbellIcon className="w-6 h-6 text-cyan-500" />
                <span className="text-cyan-500 font-bold">You're almost there!</span>
              </div>
            ) : progressPercentage >= 50 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-center gap-3 w-full sm:w-auto">
                <DumbbellIcon className="w-6 h-6 text-blue-500" />
                <span className="text-blue-500 font-bold">You're doing great!</span>
              </div>
            ) : null}
          </div>
        </div>

        {allUsers.length > 1 && (
          <div className="mt-8 bg-theme-surface p-6 rounded-xl shadow-lg border border-theme-border transition-colors">
            <h2 className="text-xl font-bold text-theme-primary-text mb-4 text-center">Head-to-Head</h2>
            <UserSelector users={allUsers.filter((u) => u.initials !== user.initials)} onSelect={setSelectedOpponent} selectedUser={selectedOpponent} />
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
          <CalendarView logs={user.logs} challengeStartDate={challengeStartDate} challengeDay={activeChallengeDay} onDayClick={handleDayClick} />
        )}

        {selectedLogForEdit && (
          <DayActionModal
            log={selectedLogForEdit}
            onClose={() => setSelectedLogForEdit(null)}
            onSave={handleSaveDayEdit}
            onUseBreakDay={handleUseBreakDayFromModal}
            breakDayAvailable={isBreakDayAvailable(getMonthFromDate(getDateFromChallengeDay(selectedLogForEdit.dayOfChallenge, challengeStartDate || '')))}
            isSaving={isSavingEdit}
          />
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
