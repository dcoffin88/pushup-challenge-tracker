import sqlite3 from 'sqlite3';
import { AppData, User, LogEntry } from '../types';

const DB_FILE = 'pushup_challenge.db';

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Database opened successfully');
        createTables();
    }
});

const createTables = () => {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS challenge (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challengeStartDate TEXT,
                currentYear INTEGER,
                timezoneOffsetMinutes INTEGER DEFAULT 0,
                timezoneId TEXT
            )
        `);

        db.run(`
            INSERT INTO challenge (challengeStartDate, currentYear)
            SELECT NULL, strftime('%Y', 'now')
            WHERE NOT EXISTS (SELECT 1 FROM challenge)
        `);

        db.all(`PRAGMA table_info(challenge)`, (err, rows) => {
            if (err) {
                console.error('Error checking challenge table info', err);
                return;
            }
            const hasOffset = rows.some((row: any) => row.name === 'timezoneOffsetMinutes');
            if (!hasOffset) {
                db.run(`ALTER TABLE challenge ADD COLUMN timezoneOffsetMinutes INTEGER DEFAULT 0`, (alterErr) => {
                    if (alterErr) {
                        console.error('Error adding timezoneOffsetMinutes column', alterErr);
                    } else {
                        console.log('timezoneOffsetMinutes column added to challenge table');
                    }
                });
            }
            const hasTimezoneId = rows.some((row: any) => row.name === 'timezoneId');
            if (!hasTimezoneId) {
                db.run(`ALTER TABLE challenge ADD COLUMN timezoneId TEXT`, (alterErr) => {
                    if (alterErr) {
                        console.error('Error adding timezoneId column', alterErr);
                    } else {
                        console.log('timezoneId column added to challenge table');
                    }
                });
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                initials TEXT PRIMARY KEY,
                pin TEXT,
                breakDaysUsed TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userInitials TEXT,
                dayOfChallenge INTEGER,
                date TEXT,
                pushupsDone INTEGER,
                goal INTEGER,
                status TEXT,
                FOREIGN KEY (userInitials) REFERENCES users (initials)
            )
        `);
    });
};

export default db;
