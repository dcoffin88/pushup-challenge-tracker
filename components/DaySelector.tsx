import React from 'react';
import { getDateFromChallengeDay, getChallengeDayInfo } from '../utils/dateHelpers';

interface DaySelectorProps {
    challengeStartDate: string;
    selectedDay: number;
    onSelectDay: (day: number) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ challengeStartDate, selectedDay, onSelectDay }) => {
    const { daysInChallenge } = getChallengeDayInfo(challengeStartDate);

    const days = Array.from({ length: daysInChallenge }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day) => {
                const date = getDateFromChallengeDay(day, challengeStartDate);
                const isSelected = day === selectedDay;
                return (
                    <button
                        key={day}
                        onClick={() => onSelectDay(day)}
                        className={`w-full aspect-square rounded transition-colors ${
                            isSelected
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                        {date.getUTCDate()}
                    </button>
                );
            })}
        </div>
    );
};

export default DaySelector;
