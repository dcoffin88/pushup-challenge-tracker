import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { resetUser, deleteUser, editPin } from '../utils/api';
import { isValidTimezoneId } from '../utils/dateHelpers';

interface AdminPanelProps {
    currentStartDate: string | null;
    currentTimezoneId: string | null;
    onSetStartDate: (date: string, timezoneId: string) => Promise<void>;
    onClose: () => void;
    allUsers: User[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentStartDate, currentTimezoneId, onSetStartDate, onClose, allUsers }) => {
    const [startDate, setStartDate] = useState(currentStartDate || new Date().toISOString().split('T')[0]);
    const [timezoneId, setTimezoneId] = useState(currentTimezoneId || Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedUserToDelete, setSelectedUserToDelete] = useState('');
    const [selectedUserToEditPin, setSelectedUserToEditPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentTimezoneId) {
            setTimezoneId(currentTimezoneId);
        } else {
            setTimezoneId(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        }
    }, [currentTimezoneId]);

    const handleSave = async () => {
        if (!startDate || isSaving) return;
        if (!timezoneId || !isValidTimezoneId(timezoneId)) {
            alert('Please enter a valid IANA timezone identifier, such as America/Halifax or Europe/London.');
            return;
        }

        if (currentStartDate) {
            const confirmReset = window.confirm(
                'WARNING: Setting a new start date will reset ALL user progress and logs. This action cannot be undone. Are you sure you want to proceed?'
            );

            if (confirmReset) {
                try {
                    setIsSaving(true);
                    await onSetStartDate(startDate, timezoneId);
                    onClose();
                } finally {
                    setIsSaving(false);
                }
            }
            return;
        }

        const confirmNew = window.confirm(
            'WARNING: Setting a new start date. Are you sure you want to proceed?'
        );

        if (confirmNew) {
            try {
                setIsSaving(true);
                await onSetStartDate(startDate, timezoneId);
                onClose();
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleResetUser = async () => {
        if (selectedUser) {
            if (window.confirm(`Are you sure you want to reset all progress for ${selectedUser}? This action cannot be undone.`)) {
                await resetUser(selectedUser);
                alert(`${selectedUser}'s progress has been reset.`);
                onClose();
            }
        }
    };

    const handleDeleteUser = async () => {
        if (selectedUserToDelete) {
            if (window.confirm(`Are you sure you want to delete ${selectedUserToDelete}? This action cannot be undone.`)) {
                await deleteUser(selectedUserToDelete);
                alert(`${selectedUserToDelete} has been deleted.`);
                onClose();
            }
        }
    };

    const handleEditPin = async () => {
        if (selectedUserToEditPin && newPin.length === 4) {
            if (window.confirm(`Are you sure you want to change the PIN for ${selectedUserToEditPin}?`)) {
                await editPin(selectedUserToEditPin, newPin);
                alert(`${selectedUserToEditPin}'s PIN has been changed.`);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-theme-surface p-6 rounded-xl shadow-2xl w-full max-w-lg border border-theme-border transition-colors relative">
                <h2 className="text-2xl font-bold text-theme-primary-text mb-6">
                    {currentStartDate ? 'Admin Panel' : 'Initial Setup'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-theme-secondary-text mb-2">
                            Challenge Start Date
                        </label>
                        <input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="timezone-id" className="block text-sm font-medium text-theme-secondary-text mb-2">
                            Challenge Timezone
                        </label>
                        <input
                            type="text"
                            id="timezone-id"
                            value={timezoneId}
                            onChange={(e) => setTimezoneId(e.target.value)}
                            className="w-full px-4 py-2 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="e.g., America/Halifax"
                            list="timezone-suggestions"
                        />
                        <datalist id="timezone-suggestions">
                            <option value="America/Halifax" />
                            <option value="America/New_York" />
                            <option value="Europe/London" />
                            <option value="Europe/Berlin" />
                            <option value="Asia/Tokyo" />
                            <option value="Australia/Sydney" />
                        </datalist>
                        <p className="text-xs text-theme-secondary-text mt-1">
                            Use a valid timezone identifier (e.g., America/Halifax) so daylight saving changes are handled automatically.
                        </p>
                    </div>
                    {currentStartDate && (
                        <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-md">
                            <strong>Warning:</strong> Changing this date will reset all challenge data for all users.
                        </p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold py-2 px-6 rounded-md shadow-lg flex items-center justify-center gap-3 transition-colors"
                    >
                        {isSaving && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
                            </svg>
                        )}
                        <span>{isSaving ? 'Saving...' : currentStartDate ? 'Save & Reset Challenge' : 'Save & Start Challenge'}</span>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-theme-secondary-text hover:text-theme-primary-text transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {currentStartDate && (
                    <div className="mt-8 border-t border-theme-border pt-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-theme-primary-text mb-4">Reset User Progress</h3>
                            <div className="flex items-center space-x-4">
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full px-4 py-2 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">Select User</option>
                                    {allUsers.map((user) => (
                                        <option key={user.initials} value={user.initials}>
                                            {user.initials}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleResetUser}
                                    disabled={!selectedUser}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-theme-primary-text mb-4">Delete User</h3>
                            <div className="flex items-center space-x-4">
                                <select
                                    value={selectedUserToDelete}
                                    onChange={(e) => setSelectedUserToDelete(e.target.value)}
                                    className="w-full px-4 py-2 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">Select User</option>
                                    {allUsers.map((user) => (
                                        <option key={user.initials} value={user.initials}>
                                            {user.initials}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={!selectedUserToDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-theme-primary-text mb-4">Edit User PIN</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <select
                                    value={selectedUserToEditPin}
                                    onChange={(e) => setSelectedUserToEditPin(e.target.value)}
                                    className="w-full sm:w-1/3 px-4 py-2 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">Select User</option>
                                    {allUsers.map((user) => (
                                        <option key={user.initials} value={user.initials}>
                                            {user.initials}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="password"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                    maxLength={4}
                                    placeholder="New PIN"
                                    className="w-full sm:w-1/3 px-4 py-2 bg-theme-surface-2 border border-theme-border rounded-md text-theme-primary-text focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <button
                                    onClick={handleEditPin}
                                    disabled={!selectedUserToEditPin || newPin.length !== 4}
                                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
