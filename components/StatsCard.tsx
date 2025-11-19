
import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="bg-gray-700 p-3 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
};

export default StatsCard;
