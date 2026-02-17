
import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
    return (
        <div className="bg-theme-surface p-4 rounded-lg shadow-lg flex items-center space-x-4 border border-theme-border transition-colors">
            <div className="bg-theme-surface-2 p-3 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-sm text-theme-secondary-text">{title}</p>
                <p className="text-2xl font-bold text-theme-primary-text">{value}</p>
            </div>
        </div>
    );
};

export default StatsCard;
