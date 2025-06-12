const express = require('express');
const router = express.Router();
const authenticateAdmin = require('../middleware/auth');
const { db } = require('../db');
const { generateUniqueToken } = require('../utils/tokenGenerator');

require('dotenv').config({ path: '.env' });

// Admin Login (initial validation)
router.post('/login', (req, res) => {
    const { secret_identify_text } = req.body;
    if (!secret_identify_text) {
        return res.status(400).json({ success: false, message: 'Secret identify text is required.' });
    }

    let correct_secret = process.env.SECRET_IDENTIFY_TEXT

    if (secret_identify_text !== correct_secret) {
        return res.status(403).json({ success: false, message: 'Invalid secret identify text.' });
    }

    res.json({ success: true, message: 'Login successful.' });
});

// Prize Management
router.get('/prizes', authenticateAdmin, (req, res) => {
    db.all('SELECT id, name, total_quantity, remaining_quantity, probability FROM prizes', [], (err, rows) => {
        if (err) {
            console.error('Error fetching prizes:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        res.json(rows);
    });
});

router.post('/prizes', authenticateAdmin, (req, res) => {
    const { id, name, total_quantity, probability } = req.body;

    if (!name || total_quantity === undefined || probability === undefined) {
        return res.status(400).json({ success: false, message: 'Name, total_quantity, and probability are required.' });
    }
    if (total_quantity < 0 || probability < 0 || probability > 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity or probability values.' });
    }

    if (id) {
        // Update existing prize
        db.run('UPDATE prizes SET name = ?, total_quantity = ?, probability = ? WHERE id = ?',
            [name, total_quantity, probability, id],
            function (err) {
                if (err) {
                    console.error('Error updating prize:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ success: false, message: 'Prize not found.' });
                }
                res.json({ success: true, prize: { id, name, total_quantity, probability } });
            }
        );
    } else {
        // Create new prize
        db.run('INSERT INTO prizes (name, total_quantity, remaining_quantity, probability) VALUES (?, ?, ?, ?)',
            [name, total_quantity, total_quantity, probability],
            function (err) {
                if (err) {
                    console.error('Error creating prize:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }
                res.status(201).json({ success: true, prize: { id: this.lastID, name, total_quantity, remaining_quantity: total_quantity, probability } });
            }
        );
    }
});

router.delete('/prizes/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM prizes WHERE id = ?', id, function (err) {
        if (err) {
            console.error('Error deleting prize:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Prize not found.' });
        }
        res.json({ success: true, message: 'Prize deleted.' });
    });
});

// Consolation Message Management
router.get('/consolation-messages', authenticateAdmin, (req, res) => {
    db.all('SELECT id, message FROM consolation_messages', [], (err, rows) => {
        if (err) {
            console.error('Error fetching consolation messages:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        res.json(rows);
    });
});

router.post('/consolation-messages', authenticateAdmin, (req, res) => {
    const { id, message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    if (id) {
        // Update existing message
        db.run('UPDATE consolation_messages SET message = ? WHERE id = ?',
            [message, id],
            function (err) {
                if (err) {
                    console.error('Error updating consolation message:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ success: false, message: 'Consolation message not found.' });
                }
                res.json({ success: true, message: { id, message } });
            }
        );
    } else {
        // Create new message
        db.run('INSERT INTO consolation_messages (message) VALUES (?)',
            [message],
            function (err) {
                if (err) {
                    console.error('Error creating consolation message:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }
                res.status(201).json({ success: true, message: { id: this.lastID, message } });
            }
        );
    }
});

router.delete('/consolation-messages/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM consolation_messages WHERE id = ?', id, function (err) {
        if (err) {
            console.error('Error deleting consolation message:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Consolation message not found.' });
        }
        res.json({ success: true, message: 'Message deleted.' });
    });
});

// Activity Management
router.post('/settings/public', authenticateAdmin, (req, res) => {
    const { is_public } = req.body;

    if (typeof is_public !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_public must be a boolean.' });
    }

    db.run('UPDATE settings SET is_public = ? WHERE id = 1', [is_public], function (err) {
        if (err) {
            console.error('Error updating activity setting:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        res.json({ success: true, message: 'Activity setting updated.' });
    });
});

// Token Management
router.post('/tokens/generate', authenticateAdmin, (req, res) => {
    const { count } = req.body;

    if (!Number.isInteger(count) || count <= 0) {
        return res.status(400).json({ success: false, message: 'Count must be a positive integer.' });
    }

    const tokens = [];
    const insertPromises = [];

    for (let i = 0; i < count; i++) {
        const token = generateUniqueToken();
        tokens.push(token);
        insertPromises.push(
            new Promise((resolve, reject) => {
                db.run('INSERT INTO tokens (token, is_used) VALUES (?, FALSE)', [token], function (err) {
                    if (err) {
                        // Handle potential unique constraint violation, retry or log
                        console.error('Error inserting token:', err.message);
                        return reject(err);
                    }
                    resolve();
                });
            })
        );
    }

    Promise.all(insertPromises)
        .then(() => {
            res.status(201).json({ success: true, tokens });
        })
        .catch(error => {
            console.error('Error generating tokens:', error.message);
            res.status(500).json({ success: false, message: 'Failed to generate some tokens due to a database error.' });
        });
});

router.get('/tokens', authenticateAdmin, (req, res) => {
    db.all('SELECT id, token, is_used FROM tokens', [], (err, rows) => {
        if (err) {
            console.error('Error fetching tokens:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        res.json(rows);
    });
});

// Get activity status
router.get('/settings/public', authenticateAdmin, (req, res) => {
    db.get('SELECT is_public FROM settings WHERE id = 1', [], (err, row) => {
        if (err) {
            console.error('Error fetching activity status:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: 'Activity settings not found.' });
        }
        res.json({ is_public: row.is_public });
    });
});

module.exports = router;
