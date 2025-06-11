require('dotenv').config({ path: '../.env' });
const { db } = require('../db');

const authenticateAdmin = (req, res, next) => {
    const secretIdentifyText = req.headers['x-secret-identify-text'] || req.body.secret_identify_text;

    if (!secretIdentifyText) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Secret identify text missing.' });
    }

    db.get('SELECT secret_identify_text FROM settings WHERE id = 1', [], (err, row) => {
        if (err) {
            console.error('Database error during authentication:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!row || row.secret_identify_text !== secretIdentifyText) {
            return res.status(403).json({ success: false, message: 'Forbidden: Invalid secret identify text.' });
        }

        next();
    });
};

module.exports = authenticateAdmin;
