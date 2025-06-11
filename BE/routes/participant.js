const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { performRaffle, getRaffleState, unlockRaffle } = require('../services/raffleService');
const { Server } = require('socket.io'); // Import Server for type hinting, not for creating new instance

let io; // This will be initialized in server.js

const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
};

// Participant entry
router.post('/enter', (req, res) => {
    const { token } = req.body;

    db.get('SELECT is_public FROM settings WHERE id = 1', [], (err, setting) => {
        if (err) {
            console.error('Database error fetching settings:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!setting) {
            return res.status(500).json({ success: false, message: 'Activity settings not found.' });
        }

        if (setting.is_public) {
            // Public activity, no token required
            return res.json({ success: true, message: 'Entered public activity.' });
        } else {
            // Private activity, token required
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required for private activity.' });
            }

            db.get('SELECT id, is_used FROM tokens WHERE token = ?', [token], (err, row) => {
                if (err) {
                    console.error('Database error checking token:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }
                if (!row) {
                    return res.status(404).json({ success: false, message: 'Invalid token.' });
                }
                if (row.is_used) {
                    return res.status(403).json({ success: false, message: 'Token already used.' });
                }
                res.json({ success: true, message: 'Entered private activity.' });
            });
        }
    });
});

// Perform raffle draw
router.post('/raffle', async (req, res) => {
    const { token, participant_id } = req.body; // participant_id is for logging, token for private activity usage

    if (!participant_id) {
        return res.status(400).json({ success: false, message: 'Participant ID is required.' });
    }

    db.get('SELECT is_public FROM settings WHERE id = 1', [], async (err, setting) => {
        if (err) {
            console.error('Database error fetching settings:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!setting) {
            return res.status(500).json({ success: false, message: 'Activity settings not found.' });
        }

        if (!setting.is_public) {
            // Private activity, validate token
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required for private activity raffle.' });
            }
            db.get('SELECT id, is_used FROM tokens WHERE token = ?', [token], async (err, tokenRow) => {
                if (err) {
                    console.error('Database error checking token for raffle:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }
                if (!tokenRow) {
                    return res.status(404).json({ success: false, message: 'Invalid token for raffle.' });
                }
                if (tokenRow.is_used) {
                    return res.status(403).json({ success: false, message: 'Token already used for raffle.' });
                }

                // Mark token as used before performing raffle
                db.run('UPDATE tokens SET is_used = TRUE WHERE id = ?', [tokenRow.id], async (err) => {
                    if (err) {
                        console.error('Error marking token as used:', err.message);
                        return res.status(500).json({ success: false, message: 'Internal server error.' });
                    }
                    await executeRaffleLogic(participant_id, res);
                });
            });
        } else {
            // Public activity, proceed without token validation
            await executeRaffleLogic(participant_id, res);
        }
    });
});

const executeRaffleLogic = async (participant_id, res) => {
    const raffleState = getRaffleState();
    if (raffleState) {
        io.emit('raffleLocked'); // Notify clients that raffle is locked
        return res.status(423).json({ success: false, message: 'Raffle is currently locked. Please wait for the next draw.' });
    }

    try {
        const result = await performRaffle(participant_id);
        if (result.type === 'locked') {
            io.emit('raffleLocked'); // Notify clients that raffle is locked
            return res.status(423).json({ success: false, message: result.message });
        }

        io.emit('raffleResult', result); // Broadcast to all participants
        io.emit('displayProjectionResult', { ...result, participant_id }); // Broadcast to projection view

        res.json({ success: true, result });
    } catch (error) {
        console.error('Error during raffle:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error during raffle.' });
    }
};

module.exports = { router, setIoInstance };
