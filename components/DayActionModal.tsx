import React, { useState, useEffect } from 'react';
import { LogEntry, LogStatus } from '../types';

interface DayActionModalProps {
    log: LogEntry;
    onClose: () => void;
    onSave: (count: number) => Promise<void>;
    onUseBreakDay: () => Promise<void>;
    breakDayAvailable: boolean;
    isSaving: boolean;
}

const statusLabels: Record<LogStatus, string> = {
    completed: 'Completed',
    missed: 'Missed',
    break: 'Break Day',
    pending: 'Pending',
    today: 'Today',
    in_progress: 'In Progress',
    over_achieved: 'Over Achieved',
};

const DayActionModal: React.FC<DayActionModalProps> = ({
    log,
    onClose,
    onSave,
    onUseBreakDay,
    breakDayAvailable,
    isSaving
}) => {
    const [pushupCount, setPushupCount] = useState(log.pushupsDone.toString());

    useEffect(() => {
        setPushupCount(log.pushupsDone.toString());
    }, [log]);

    const handleSave = async () => {
        const count = parseInt(pushupCount, 10);
        if (!isNaN(count) && count >= 0) {
            await onSave(count);
        } else {
            alert("Please enter a valid number of push-ups.");
        }
    };

    const isBreak = log.status === 'break';

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-theme-surface p-6 rounded-xl shadow-2xl w-full max-w-md border border-theme-border transition-colors">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-theme-primary-text">Day {log.dayOfChallenge}</h2>
                        <p className="text-theme-secondary-text">{log.date}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-theme-secondary-text hover:text-theme-primary-text transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-theme-surface-2/50 rounded-lg border border-theme-border">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-theme-secondary-text">Daily Goal</span>
                            <span className="text-cyan-500 font-bold">{log.goal} push-ups</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-theme-secondary-text">Current Status</span>
                            <span className={`font-bold ${isBreak ? 'text-yellow-500' : 'text-green-500'}`}>
                                {statusLabels[log.status]}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-secondary-text mb-2">
                            Push-ups Done
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPushupCount(Math.max(0, (parseInt(pushupCount) || 0) - 1).toString())}
                                disabled={isBreak || isSaving}
                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-theme-secondary-text font-bold disabled:opacity-50 transition-colors"
                            >
                                -1
                            </button>
                            <button
                                onClick={() => setPushupCount(Math.max(0, (parseInt(pushupCount) || 0) - 10).toString())}
                                disabled={isBreak || isSaving}
                                className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-cyan-600 dark:text-cyan-400 font-bold disabled:opacity-50 transition-colors"
                            >
                                -10
                            </button>

                            <input
                                type="number"
                                value={pushupCount}
                                onChange={(e) => setPushupCount(e.target.value)}
                                disabled={isBreak || isSaving}
                                className={`flex-1 min-w-0 px-4 py-3 bg-theme-surface-2 border border-theme-border rounded-lg text-theme-primary-text text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all no-spinner ${isBreak ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="0"
                            />

                            <button
                                onClick={() => setPushupCount(((parseInt(pushupCount) || 0) + 10).toString())}
                                disabled={isBreak || isSaving}
                                className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-cyan-600 dark:text-cyan-400 font-bold disabled:opacity-50 transition-colors"
                            >
                                +10
                            </button>
                            <button
                                onClick={() => setPushupCount(((parseInt(pushupCount) || 0) + 1).toString())}
                                disabled={isBreak || isSaving}
                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-theme-surface-2 hover:bg-theme-surface-3 rounded-lg text-theme-secondary-text font-bold disabled:opacity-50 transition-colors"
                            >
                                +1
                            </button>
                        </div>
                        {isBreak && (
                            <p className="text-xs text-yellow-500 mt-2 italic">
                                Push-ups cannot be logged on a break day.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {!isBreak && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSaving && (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
                                    </svg>
                                )}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}

                        {!isBreak && breakDayAvailable && (
                            <button
                                onClick={onUseBreakDay}
                                disabled={isSaving}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg transition-colors"
                            >
                                Mark as Break Day
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full bg-theme-surface-2 hover:bg-theme-surface-3 text-theme-primary-text font-bold py-3 rounded-lg transition-colors border border-theme-border"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayActionModal;
