const express = require('express');
const app = express.Router();
const path = require('path');
const axios = require('axios');
const authenticateToken = require('./../middleware/authenticateToken');

const url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'page', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'page', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'page', 'signup.html'));
});

app.get('/api/v1/optionChain', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(url, { headers: headers, timeout: 10000 });
        const jsonObject = response.data.filtered.data;
        res.json(jsonObject);
    } catch (error) {
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

module.exports = app;
