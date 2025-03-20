const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables

// Generate Access Token (short-lived)
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

// Generate Refresh Token (long-lived)
function generateRefreshToken(user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Verify Access Token Middleware
function authenticateToken(req, res, next) {
    console.log('Authenticating token');

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log('token expired');
            return res.status(403).json({ error: 'Access token expired' }); 
        }
        console.log('token accepted');
        req.user = user;
        next();
    });
}

// Verify Refresh Token
function verifyRefreshToken(refreshToken) {
    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    authenticateToken,
    verifyRefreshToken
};
