const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DATABASE_PATH = './data/raffle.db';
const dbPath = path.resolve(__dirname, DATABASE_PATH);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1); // Exit if database connection fails
    }
    console.log('Connected to the SQLite database.');
});

const initializeDatabase = () => {
    db.serialize(() => {
        // Create prizes table
        db.run(`
            CREATE TABLE IF NOT EXISTS prizes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                total_quantity INTEGER NOT NULL,
                remaining_quantity INTEGER NOT NULL,
                probability REAL NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating prizes table:', err.message);
                return;
            }
            console.log('Prizes table created or already exists.');
        });

        // Create consolation_messages table
        db.run(`
            CREATE TABLE IF NOT EXISTS consolation_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating consolation_messages table:', err.message);
                return;
            }
            console.log('Consolation messages table created or already exists.');
        });

        // Create settings table (single row)
        db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                is_public BOOLEAN NOT NULL DEFAULT FALSE
            )
        `, (err) => {
            if (err) {
                console.error('Error creating settings table:', err.message);
                return;
            }
            console.log('Settings table created or already exists.');

            // Insert default setting if not exists
            db.get('SELECT COUNT(*) AS count FROM settings WHERE id = 1', (err, row) => {
                if (err) {
                    console.error('Error checking settings table:', err.message);
                    return;
                }
                if (row.count === 0) {
                    db.run(`INSERT INTO settings (id, is_public) VALUES (1, FALSE)`, (err) => {
                        if (err) {
                            console.error('Error inserting default settings:', err.message);
                            return;
                        }
                        console.log('Default settings inserted.');
                    });
                }
            });
        });

        // Create tokens table
        db.run(`
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                is_used BOOLEAN NOT NULL DEFAULT FALSE
            )
        `, (err) => {
            if (err) {
                console.error('Error creating tokens table:', err.message);
                return;
            }
            console.log('Tokens table created or already exists.');
        });

        // Create raffle_logs table
        db.run(`
            CREATE TABLE IF NOT EXISTS raffle_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant_id TEXT NOT NULL,
                prize_id INTEGER,
                consolation_message_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prize_id) REFERENCES prizes(id),
                FOREIGN KEY (consolation_message_id) REFERENCES consolation_messages(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating raffle_logs table:', err.message);
                return;
            }
            console.log('Raffle logs table created or already exists.');
        });
    });
};

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            return;
        }
        console.log('Closed the SQLite database connection.');
        process.exit(0);
    });
});

module.exports = { db, initializeDatabase };
