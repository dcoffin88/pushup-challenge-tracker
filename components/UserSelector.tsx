
import React from 'react';
import type { User } from '../types';

interface UserSelectorProps {
    users: User[];
    onSelect: (user: User | null) => void;
    selectedUser: User | null;
}

const UserSelector: React.FC<UserSelectorProps> = ({ users, onSelect, selectedUser }) => {
    return (
        <div className="w-full max-w-xs mx-auto">
            <label htmlFor="user-select" className="block text-sm font-medium text-theme-secondary-text mb-2 text-center">
                Select user to compare
            </label>
            <select
                id="user-select"
                value={selectedUser?.initials || ''}
                onChange={(e) => {
                    const user = users.find(u => u.initials === e.target.value) || null;
                    onSelect(user);
                }}
                className="w-full bg-theme-surface-2 border border-theme-border rounded-lg py-2.5 px-4 text-theme-primary-text font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all appearance-none cursor-pointer"
            >
                <option value="">-- Choose Opponent --</option>
                {users.map(user => (
                    <option key={user.initials} value={user.initials}>
                        {user.initials}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default UserSelector;
