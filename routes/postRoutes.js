const express = require('express');
const app = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./../mongoose/model');

const SECRET_KEY = process.env.JWT_SECRET; // Ensure SECRET_KEY is defined in .env

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (await User.findOne({ username })) {
            return res.status(400).send('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });

        res.redirect('/login');
    } catch (err) {
        res.status(500).send('Error during signup: ' + err.message);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send('Invalid username or password');
        }

        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('auth_token', token, { httpOnly: true, maxAge: 3600000 });
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error during login: ' + err.message);
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
});

module.exports = app;
