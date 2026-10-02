const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET  = process.env.JWT_SECRET     || 'secreto_inseguro';
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

function firmarToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

function verificarToken(token) {
    return jwt.verify(token, SECRET);
}

module.exports = { firmarToken, verificarToken };