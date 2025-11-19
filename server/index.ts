import express from 'express';
import bodyParser from 'body-parser';
import db from './db';
import { AppData, User, LogEntry } from '../types';
import { getChallengeDayInfo, getDateFromChallengeDay, toYyyyMmDd, getMonthFromDate, setConfiguredTimezone, isValidTimezoneId } from '../utils/dateHelpers';

type ChallengeRow = { challengeStartDate: string | null; currentYear: number; timezoneOffsetMinutes?: number; timezoneId?: string };

const applyTimezoneFromRow = (row?: ChallengeRow | null) => {
    if (row?.timezoneId && isValidTimezoneId(row.timezoneId)) {
        setConfiguredTimezone(row.timezoneId);
    }
};

const app = express();
const port = 3001;

app.use(bodyParser.json());

app.get('/api/data', (req, res) => {
    console.log('GET /api/data');
    db.get('SELECT * FROM challenge', (err, row) => {
        if (err) {
            console.error('Error getting challenge', err);
            res.status(500).json({ error: err.message });
            return;
        }
        const challengeData = row as ChallengeRow | null;
        applyTimezoneFromRow(challengeData);
        db.all('SELECT * FROM users', (err, users) => {
            if (err) {
                console.error('Error getting users', err);
                res.status(500).json({ error: err.message });
                return;
            }
            const appData: AppData = {
                users: {},
                lastUpdated: new Date().toISOString(),
                currentYear: challengeData?.currentYear || new Date().getFullYear(),
                challengeStartDate: challengeData?.challengeStartDate || null,
                timezoneId: challengeData?.timezoneId ?? null,
            };
            const userPromises = users.map((user: any) => {
                return new Promise<void>((resolve, reject) => {
                    db.all('SELECT * FROM logs WHERE userInitials = ?', [user.initials], (err, logs) => {
                        if (err) {
                            reject(err);
                        } else {
                            const userLogs: { [dayOfChallenge: number]: LogEntry } = {};
                            logs.forEach((log: any) => {
                                userLogs[log.dayOfChallenge] = {
                                    dayOfChallenge: log.dayOfChallenge,
                                    date: log.date,
                                    pushupsDone: log.pushupsDone,
                                    goal: log.goal,
                                    status: log.status,
                                };
                            });
                            appData.users[user.initials] = {
                                initials: user.initials,
                                pin: user.pin,
                                logs: userLogs,
                                breakDaysUsed: JSON.parse(user.breakDaysUsed),
                            };
                            resolve();
                        }
                    });
                });
            });
            Promise.all(userPromises)
                .then(() => res.json(appData))
                .catch((err) => {
                    console.error('Error getting user logs', err);
                    res.status(500).json({ error: err.message })
                });
        });
    });
});

app.post('/api/user', (req, res) => {
    const { initials, pin } = req.body;
    const upperInitials = initials.toUpperCase();
    db.get('SELECT * FROM users WHERE initials = ?', [upperInitials], (err, row) => {
        if (err) {
            console.error('Error getting user', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            if ((row as any).pin !== pin) {
                res.status(401).json({ error: 'Invalid PIN' });
                return;
            }
            db.all('SELECT * FROM logs WHERE userInitials = ?', [upperInitials], (err, logs) => {
                if (err) {
                    console.error('Error getting logs', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                const userLogs: { [dayOfChallenge: number]: LogEntry } = {};
                logs.forEach((log: any) => {
                    userLogs[log.dayOfChallenge] = {
                        dayOfChallenge: log.dayOfChallenge,
                        date: log.date,
                        pushupsDone: log.pushupsDone,
                        goal: log.goal,
                        status: log.status,
                    };
                });
                res.json({
                    initials: upperInitials,
                    pin: (row as any).pin,
                    logs: userLogs,
                    breakDaysUsed: JSON.parse((row as any).breakDaysUsed),
                });
            });
        } else {
            db.get('SELECT * FROM challenge', (err, row) => {
                if (err) {
                    console.error('Error getting challenge', err);
                    res.status(500).json({ error: err.message });
                    return;
                }
                const challengeData = row as ChallengeRow;
                applyTimezoneFromRow(challengeData);
                const startDateForLogs = challengeData.challengeStartDate || new Date().toISOString().split('T')[0];
                const challengeInfo = getChallengeDayInfo(startDateForLogs);
                if (challengeData.challengeStartDate && challengeInfo.isChallengeActive) {
                    res.status(403).json({ error: 'Cannot create new users after the challenge has started.' });
                    return;
                }
                const newUser: User = {
                    initials: upperInitials,
                    pin,
                    logs: {},
                    breakDaysUsed: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 },
                };
                const { daysInChallenge } = getChallengeDayInfo(startDateForLogs);
                for (let i = 1; i <= daysInChallenge; i++) {
                    const date = getDateFromChallengeDay(i, startDateForLogs);
                    newUser.logs[i] = {
                        dayOfChallenge: i,
                        date: toYyyyMmDd(date),
                        pushupsDone: 0,
                        goal: i,
                        status: 'pending',
                    };
                }
                db.run('INSERT INTO users (initials, pin, breakDaysUsed) VALUES (?, ?, ?)', [upperInitials, pin, JSON.stringify(newUser.breakDaysUsed)], (err) => {
                    if (err) {
                        console.error('Error inserting user', err);
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    const logPromises = Object.values(newUser.logs).map((log) => {
                        return new Promise<void>((resolve, reject) => {
                            db.run('INSERT INTO logs (userInitials, dayOfChallenge, date, pushupsDone, goal, status) VALUES (?, ?, ?, ?, ?, ?)', [upperInitials, log.dayOfChallenge, log.date, log.pushupsDone, log.goal, log.status], (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                    Promise.all(logPromises)
                        .then(() => res.json(newUser))
                        .catch((err) => {
                            console.error('Error inserting logs', err);
                            res.status(500).json({ error: err.message })
                        });
                });
            });
        }
    });
});

app.post('/api/log', (req, res) => {
    const { user, day, count } = req.body;
    console.log('user', user);
    console.log('day', day);
    const log = user.logs[day];
    if (log) {
        log.pushupsDone += count;
        if (log.pushupsDone >= log.goal) {
            log.status = 'completed';
        } else {
            log.status = 'in_progress';
        }
        db.run('UPDATE logs SET pushupsDone = ?, status = ? WHERE userInitials = ? AND dayOfChallenge = ?', [log.pushupsDone, log.status, user.initials, day], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        });
    } else {
        res.status(400).json({ error: 'Log not found' });
    }
});

app.post('/api/break', (req, res) => {
    const { user, day } = req.body;
    console.log('user', user);
    console.log('day', day);
    db.get('SELECT * FROM challenge', (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const challengeData = row as ChallengeRow;
        applyTimezoneFromRow(challengeData);
        const challengeStartDate = challengeData.challengeStartDate;
        if (!challengeStartDate) {
            res.status(400).json({ error: 'Challenge start date is not configured.' });
            return;
        }
        const date = getDateFromChallengeDay(day, challengeStartDate);
        const month = getMonthFromDate(date);
        if ((user.breakDaysUsed[month] || 0) < 1) {
            const log = user.logs[day];
            if (log) {
                log.status = 'break';
                const updatedBreakDays = { ...user.breakDaysUsed, [month]: (user.breakDaysUsed[month] || 0) + 1 };
                db.run('UPDATE logs SET status = ? WHERE userInitials = ? AND dayOfChallenge = ?', ['break', user.initials, day], (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    db.run('UPDATE users SET breakDaysUsed = ? WHERE initials = ?', [JSON.stringify(updatedBreakDays), user.initials], (err) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ success: true });
                    });
                });
            } else {
                res.status(400).json({ error: 'Log not found' });
            }
        } else {
            res.json({ success: false });
        }
    });
});

app.post('/api/challenge', (req, res) => {
    const { startDate, timezoneId } = req.body;
    if (typeof startDate !== 'string' || !startDate) {
        res.status(400).json({ error: 'A valid start date is required.' });
        return;
    }
    const selectedTimezone = typeof timezoneId === 'string' && isValidTimezoneId(timezoneId) ? timezoneId : 'UTC';
    setConfiguredTimezone(selectedTimezone);
    const { daysInChallenge } = getChallengeDayInfo(startDate);
    db.run('UPDATE challenge SET challengeStartDate = ?, timezoneOffsetMinutes = 0, timezoneId = ?', [startDate, selectedTimezone], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        db.all('SELECT * FROM users', (err, users) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const userPromises = users.map((user: any) => {
                return new Promise<void>((resolve, reject) => {
                    db.run('DELETE FROM logs WHERE userInitials = ?', [user.initials], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            const logs: { [dayOfChallenge: number]: LogEntry } = {};
                            for (let i = 1; i <= daysInChallenge; i++) {
                                const date = getDateFromChallengeDay(i, startDate);
                                logs[i] = {
                                    dayOfChallenge: i,
                                    date: toYyyyMmDd(date),
                                    pushupsDone: 0,
                                    goal: i,
                                    status: 'pending',
                                };
                            }
                            const logPromises = Object.values(logs).map((log) => {
                                return new Promise<void>((resolve, reject) => {
                                    db.run('INSERT INTO logs (userInitials, dayOfChallenge, date, pushupsDone, goal, status) VALUES (?, ?, ?, ?, ?, ?)', [user.initials, log.dayOfChallenge, log.date, log.pushupsDone, log.goal, log.status], (err) => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve();
                                        }
                                    });
                                });
                            });
                            Promise.all(logPromises)
                                .then(() => resolve())
                                .catch((err) => reject(err));
                        }
                    });
                });
            });
            Promise.all(userPromises)
                .then(() => res.json({ success: true }))
                .catch((err) => res.status(500).json({ error: err.message }));
        });
    });
});

app.post('/api/reset-user', (req, res) => {
    const { initials } = req.body;
    db.get('SELECT * FROM challenge', (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const challengeData = row as ChallengeRow;
        applyTimezoneFromRow(challengeData);
        const challengeStartDate = challengeData.challengeStartDate;
        if (!challengeStartDate) {
            res.status(400).json({ error: 'Challenge start date is not configured.' });
            return;
        }
        const { daysInChallenge } = getChallengeDayInfo(challengeStartDate);
        db.run('DELETE FROM logs WHERE userInitials = ?', [initials], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const logs: { [dayOfChallenge: number]: LogEntry } = {};
            for (let i = 1; i <= daysInChallenge; i++) {
                const date = getDateFromChallengeDay(i, challengeStartDate);
                logs[i] = {
                    dayOfChallenge: i,
                    date: toYyyyMmDd(date),
                    pushupsDone: 0,
                    goal: i,
                    status: 'pending',
                };
            }
            const logPromises = Object.values(logs).map((log) => {
                return new Promise<void>((resolve, reject) => {
                    db.run('INSERT INTO logs (userInitials, dayOfChallenge, date, pushupsDone, goal, status) VALUES (?, ?, ?, ?, ?, ?)', [initials, log.dayOfChallenge, log.date, log.pushupsDone, log.goal, log.status], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });
            Promise.all(logPromises)
                .then(() => {
                    db.run('UPDATE users SET breakDaysUsed = ? WHERE initials = ?', [JSON.stringify({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }), initials], (err) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ success: true });
                    });
                })
                .catch((err) => res.status(500).json({ error: err.message }));
        });
    });
});

app.post('/api/delete-user', (req, res) => {
    const { initials } = req.body;
    db.run('DELETE FROM logs WHERE userInitials = ?', [initials], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        db.run('DELETE FROM users WHERE initials = ?', [initials], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true });
        });
    });
});

app.post('/api/edit-pin', (req, res) => {
    const { initials, pin } = req.body;
    db.run('UPDATE users SET pin = ? WHERE initials = ?', [pin, initials], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

app.post('/api/correct-progress', (req, res) => {
    const { initials, day, count } = req.body;
    db.get('SELECT * FROM logs WHERE userInitials = ? AND dayOfChallenge = ?', [initials, day], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            const log = row as LogEntry;
            log.pushupsDone = count;
            if (log.pushupsDone >= log.goal) {
                log.status = 'completed';
            } else if (log.pushupsDone > 0) {
                log.status = 'in_progress';
            } else {
                log.status = 'pending';
            }
            db.run('UPDATE logs SET pushupsDone = ?, status = ? WHERE userInitials = ? AND dayOfChallenge = ?', [log.pushupsDone, log.status, initials, day], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ error: 'Log not found' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
