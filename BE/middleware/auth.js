require('dotenv').config({ path: '.env' });
let correctIdentifyText = process.env.SECRET_IDENTIFY_TEXT;

const authenticateAdmin = (req, res, next) => {
    const secretIdentifyText = req.headers['x-secret-identify-text'] || req.body.secret_identify_text;

    if (!secretIdentifyText) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Secret identify text missing.' });
    }

    if (secretIdentifyText !== correctIdentifyText) {
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid secret identify text.' });
    }

    next();
};

module.exports = authenticateAdmin;
