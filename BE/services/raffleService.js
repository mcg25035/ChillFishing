const { db } = require('../db');
const { Server } = require('socket.io'); // For type hinting

let io; // Socket.IO instance
let isRaffleLocked = false; // Global raffle state

const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
};

const getRaffleState = () => {
    return isRaffleLocked;
};

const lockRaffle = () => {
    isRaffleLocked = true;
};

const unlockRaffle = () => {
    isRaffleLocked = false;
};

const performRaffle = async (participantIdentifier) => { // Changed participantId to participantIdentifier
    return new Promise((resolve, reject) => {
        if (isRaffleLocked) {
            return resolve({ type: 'locked', message: 'Raffle is currently locked. Please wait.' });
        }

        lockRaffle(); // Lock raffle immediately
        if (io) {
            io.emit('raffleStarted'); // Emit event to start animation on projection view
        }

        db.all('SELECT id, name, remaining_quantity, probability FROM prizes WHERE remaining_quantity > 0', [], (err, prizes) => {
            if (err) {
                unlockRaffle(); // Unlock on error
                return reject(err);
            }

            db.all('SELECT id, message FROM consolation_messages', [], (err, consolationMessages) => {
                if (err) {
                    unlockRaffle(); // Unlock on error
                    return reject(err);
                }

                let totalProbability = 0;
                for (const prize of prizes) {
                    totalProbability += prize.probability;
                }

                const randomNumber = Math.random();
                let cumulativeProbability = 0;
                let wonPrize = null;

                for (const prize of prizes) {
                    cumulativeProbability += prize.probability;
                    if (randomNumber <= cumulativeProbability) {
                        wonPrize = prize;
                        break;
                    }
                }

                if (wonPrize) {
                    db.run('UPDATE prizes SET remaining_quantity = remaining_quantity - 1 WHERE id = ?', [wonPrize.id], function (err) {
                        if (err) {
                            unlockRaffle(); // Unlock on error
                            return reject(err);
                        }
                        const remaining = wonPrize.remaining_quantity - 1;
                        db.run('INSERT INTO raffle_logs (participant_id, prize_id) VALUES (?, ?)', [participantIdentifier, wonPrize.id], (err) => { // Use participantIdentifier
                            if (err) {
                                console.error('Error logging prize raffle:', err.message);
                            }
                            unlockRaffle(); // Unlock raffle after successful prize draw

                            // Fetch updated prizes and emit to admin dashboard
                            db.all('SELECT id, name, total_quantity, remaining_quantity, probability FROM prizes', [], (err, updatedPrizes) => {
                                if (err) {
                                    console.error('Error fetching updated prizes:', err.message);
                                    return resolve({ type: 'prize', prize: { name: wonPrize.name }, remaining: remaining });
                                }
                                if (io) {
                                    io.emit('prizesUpdated', updatedPrizes); // Emit updated prizes to all connected clients
                                }
                                resolve({ type: 'prize', prize: { name: wonPrize.name }, remaining: remaining }); // Changed to prize object for consistency
                            });
                        });
                    });
                } else {
                    // No prize won or all prizes depleted, return a consolation message
                    const consolationMessage = consolationMessages.length > 0
                        ? consolationMessages[Math.floor(Math.random() * consolationMessages.length)].message
                        : 'Better luck next time!';

                    let consolationMessageId = null;
                    if (consolationMessages.length > 0) {
                        consolationMessageId = consolationMessages[Math.floor(Math.random() * consolationMessages.length)].id;
                    }

                    db.run('INSERT INTO raffle_logs (participant_id, consolation_message_id) VALUES (?, ?)', [participantIdentifier, consolationMessageId], (err) => {
                        if (err) {
                            console.error('Error logging consolation raffle:', err.message);
                        }
                        unlockRaffle(); // Unlock raffle after consolation message
                        // No prize update, so no need to emit prizesUpdated here
                        resolve({ type: 'consolation', message: consolationMessage });
                    });
                }
            });
        });
    });
};

module.exports = {
    setIoInstance, // Export the new function
    getRaffleState,
    lockRaffle,
    unlockRaffle,
    performRaffle
};
