const { v4: uuidv4 } = require('uuid');

const generateUniqueToken = () => {
    return uuidv4();
};

module.exports = { generateUniqueToken };
