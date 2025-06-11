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
    const { token, name } = req.body; // Receive name

    db.get('SELECT is_public FROM settings WHERE id = 1', [], (err, setting) => {
        if (err) {
            console.error('Database error fetching settings:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!setting) {
            return res.status(500).json({ success: false, message: 'Activity settings not found.' });
        }

        if (setting.is_public) {
            // Public activity, no token required, name is optional
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
    const { token, name } = req.body; // Get name from request body

    // Determine participant_id based on name or token
    let participantIdentifier;
    if (name) {
        participantIdentifier = name;
    } else if (token) {
        participantIdentifier = token.substring(0, 8) + '...'; // Use first 8 chars of token if name is not provided
    } else {
        return res.status(400).json({ success: false, message: 'Participant name or token is required.' });
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
                    // Fetch updated tokens and emit to admin dashboard
                    db.all('SELECT id, token, is_used FROM tokens', [], (err, updatedTokens) => {
                        if (err) {
                            console.error('Error fetching updated tokens:', err.message);
                            // Continue with raffle logic even if token fetch fails
                        } else if (io) {
                            io.emit('tokensUpdated', updatedTokens); // Emit updated tokens to all connected clients
                        }
                        executeRaffleLogic(participantIdentifier, res); // Pass participantIdentifier
                    });
                });
            });
        } else {
            // Public activity, proceed without token validation
            await executeRaffleLogic(participantIdentifier, res); // Pass participantIdentifier
        }
    });
});

const executeRaffleLogic = async (participantIdentifier, res) => { // Renamed participant_id to participantIdentifier
    const raffleState = getRaffleState();
    if (raffleState) {
        io.emit('raffleLocked', true); // Notify clients that raffle is locked
        return res.status(423).json({ success: false, message: 'Raffle is currently locked. 請等待主持人開放下個抽獎' });
    }

    try {
        const result = await performRaffle(participantIdentifier); // Pass participantIdentifier to performRaffle
        if (result.type === 'locked') {
            io.emit('raffleLocked', true); // Notify clients that raffle is locked
            return res.status(423).json({ success: false, message: result.message });
        }

        io.emit('raffleResult', result); // Broadcast to all participants
        io.emit('displayProjectionResult', { ...result, participant_id: participantIdentifier }); // Use participantIdentifier for projection view

        res.json({ success: true, result });
    } catch (error) {
        console.error('Error during raffle:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error during raffle.' });
    }
};

module.exports = { router, setIoInstance };
