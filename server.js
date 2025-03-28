const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, authenticateToken, verifyRefreshToken } = require('./utilities/jwt');

const userService = require('./models/userModel');
const tokenService = require('./models/tokenModel');
const loanRecordsService = require('./models/loanRecordsModel');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

let refreshTokens = [];

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Serve Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await userService.findUserByUsername(username);

    if (!user) {
        return res.status(400).send({ error: 'User not found' });
    }
    try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log("Invalid password attempt for user:", username); // Debugging
            return res.status(400).send({ error: 'Invalid password' });
        }

        const accessToken = generateAccessToken({ username: user.username });
        const refreshToken = generateRefreshToken({ username: user.username });

        const tokenCreated = await tokenService.saveRefreshToken(user.username, refreshToken);
        console.log(tokenCreated);

        console.log({ user: user.username, token: accessToken, refreshToken: refreshToken });
        res.status(200).send({ user: user.username, token: accessToken, refreshToken: refreshToken });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// Serve Signup Page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle Signup
app.post('/signup', async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).send({ error: 'Passwords do not match' });
    }

    // Check if username already exists
    const user = await userService.findUserByUsername(username);
    if (user) {
        return res.status(400).send({ error: 'Username already taken' });
    }

    try {
        // Create new user in database
        const newUser = await userService.createNewUser(username, password);

        const accessToken = generateAccessToken({ username: newUser.username });
        const refreshToken = generateRefreshToken({ username: newUser.username });

        const tokenCreated = await tokenService.saveRefreshToken(newUser.username, refreshToken);
        console.log(tokenCreated);

        console.log({ user: newUser.username, token: accessToken, refreshToken: refreshToken });
        res.status(200).send({ user: newUser.username, token: accessToken, refreshToken: refreshToken });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token required" });

    // Check if refresh token is stored in DB
    const tokenExists = await tokenService.getRefreshToken(refreshToken);
    if (!tokenExists) return res.status(403).json({ error: "Invalid refresh token" });

    // Verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid refresh token" });

        const newAccessToken = generateAccessToken({ username: user.username });
        res.json({ accessToken: newAccessToken });
    });
});

// Logout (Delete Refresh Token)
app.post('/logout', async (req, res) => {
    try {
        const tokenDeleted = await tokenService.deleteRefreshToken(req.body.refreshToken);
        if (!tokenDeleted) {
            return res.status(400).json({ error: 'There was an issue logging you out' });
        }
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch(err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Render Dashboard
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.post('/add-loan', authenticateToken, async (req, res) => {
    try {
        const { username, bookTitle, bookAuthor, loanDate, dueDate } = req.body;
        const response = await loanRecordsService.saveLoanRecord(username, bookTitle, bookAuthor, loanDate, dueDate);
        return res.status(200).json(response);
    } catch (err) {
        console.error('Error adding loan to database:', err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/return-book', authenticateToken, async (req, res) => {
    try {
        const response = await loanRecordsService.updateLoanRecordReturnedDate(req.body.id, new Date().toISOString().split('T')[0]);
        console.log(response);
        return res.status(200).json(response);
    } catch (err) {
        console.error('Error updating record in database', err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/loan-records', authenticateToken, async (req, res) => {
    try {
        const response = await loanRecordsService.getRecordsForUser(req.body.username);
        console.log(response);
        return res.status(200).json(response);
    } catch (err) {
        console.error('Error updating record in database', err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
