export type LogStatus = 'completed' | 'missed' | 'break' | 'pending' | 'today' | 'in_progress' | 'over_achieved';

export interface LogEntry {
  dayOfChallenge: number;
  date: string;
  pushupsDone: number;
  goal: number;
  status: LogStatus;
}

export interface User {
  initials: string;
  pin: string;
  logs: { [dayOfChallenge: number]: LogEntry };
  breakDaysUsed: { [month: number]: number };
}

export interface AppData {
  users: { [initials: string]: User };
  lastUpdated: string;
  currentYear: number;
  challengeStartDate: string | null;
  timezoneId: string | null;
}
