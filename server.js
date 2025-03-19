const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { generateAccessToken, generateRefreshToken, authenticateToken, verifyRefreshToken } = require('./utilities/jwt');

const userService = require('./models/userModel');
const tokenService = require('./models/tokenModel');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

let refreshTokens = [];

// Serve Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await userService.findUserByUsername(username);

    if (!user) {
        return res.render('login', { error: 'User not found' });
    }

    try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log("Invalid password attempt for user:", username); // Debugging
            return res.render('login', { error: 'Invalid password' });
        }

        const accessToken = generateAccessToken({ username: user.username });
        const refreshToken = generateRefreshToken({ username: user.username });

        const tokenCreated = await tokenService.saveRefreshToken(user.username, refreshToken);
        console.log(tokenCreated);

        console.log({ user: user.username, token: accessToken, refreshToken: refreshToken });
        res.render('dashboard', { user: user.username, token: accessToken, refreshToken: refreshToken });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Internal Server Error");
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
        return res.render('signup', { error: 'Passwords do not match' });
    }

    // Check if username already exists
    const user = await userService.findUserByUsername(username);
    if (user) {
        return res.render('signup', { error: 'Username already taken' });
    }

    try {
        // Create new user in database
        const newUser = await userService.createNewUser(username, password);

        const accessToken = generateAccessToken({ username: newUser.username });
        const refreshToken = generateRefreshToken({ username: newUser.username });

        const tokenCreated = await tokenService.saveRefreshToken(user.username, refreshToken);
        console.log(tokenCreated);

        console.log({ user: newUser.username, token: accessToken, refreshToken: refreshToken });
        res.render('dashboard', { user: newUser.username, token: accessToken, refreshToken: refreshToken });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Refresh Token Route
app.post('/token', async (req, res) => {
    const { token: refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    const tokenExists = await tokenService.getRefreshToken(refreshToken);
    if (!tokenExists) return res.sendStatus(403); 

    try {
        const user = await verifyRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken({ username: user.username });
        res.json({ accessToken: newAccessToken });
    } catch {
        res.sendStatus(403);
    }
});

// Logout (Delete Refresh Token)
app.post('/logout', async (req, res) => {
    await tokenService.deleteRefreshToken(req.body.token);
    res.redirect('/login');
});

// Secure Route (Example)
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}, this is a protected route.` });
});

// Render Dashboard
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { user: 'Guest', token: '', refreshToken: '' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
