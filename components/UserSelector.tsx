
import React from 'react';
import type { User } from '../types';

interface UserSelectorProps {
    users: User[];
    currentUserInitials: string;
    onSelectUser: (initials: string) => void;
    selectedValue: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ users, currentUserInitials, onSelectUser, selectedValue }) => {
    const otherUsers = users.filter(u => u.initials !== currentUserInitials);

    return (
        <div>
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-400 mb-1">
                Select user to compare
            </label>
            <select
                id="user-select"
                value={selectedValue}
                onChange={(e) => onSelectUser(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                <option value="">-- Choose Opponent --</option>
                {otherUsers.map(user => (
                    <option key={user.initials} value={user.initials}>
                        {user.initials}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default UserSelector;
