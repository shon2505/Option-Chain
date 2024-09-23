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

        // Get the underlying price
        const underlyingPrice = jsonObject[0].PE.underlyingValue || jsonObject[0].CE.underlyingValue;

        // Find the index of the closest strike price to the underlying value
        const closestIndex = jsonObject.reduce((prevIndex, current, index) => {
            return Math.abs(current.strikePrice - underlyingPrice) < Math.abs(jsonObject[prevIndex].strikePrice - underlyingPrice) ? index : prevIndex;
        }, 0);

        // Calculate the range for slicing
        const startIndex = Math.max(0, closestIndex - 10);
        const endIndex = Math.min(jsonObject.length, closestIndex + 11); // +11 to include the closest strike itself

        // Get the resulting data
        const result = jsonObject.slice(startIndex, endIndex);

        res.json(result);
    } catch (error) {
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

// app.get('/api/v1/under', async (req, res) => {
//     try {
//         const response = await axios.get(url, { headers: headers, timeout: 30000 });
//         const jsonObject = response.data.filtered.data;

//         // Get the underlying price
//         const underlyingPrice = jsonObject[0].PE.underlyingValue || jsonObject[0].CE.underlyingValue;

//         // Find the closest strike price to the underlying value
//         const sortedData = jsonObject.sort((a, b) => Math.abs(a.strikePrice - underlyingPrice) - Math.abs(b.strikePrice - underlyingPrice));
//         const closestStrike = sortedData[0].strikePrice;

//         // Find the index of the closest strike price
//         const index = jsonObject.findIndex(item => item.strikePrice === closestStrike);

//         // Get 10 rows above and below
//         const startIndex = Math.max(0, index - 10);
//         const endIndex = Math.min(jsonObject.length, index + 11); // +11 because we want to include the closest strike

//         const result = jsonObject.slice(startIndex, endIndex);

//         res.json({ underlyingPrice, result });
//     } catch (error) {
//         res.status(500).send('Error fetching data: ' + error.message);
//     }
// });

app.get('/api/v1/under', async (req, res) => {
    try {
        const response = await axios.get(url, { headers: headers, timeout: 30000 });
        const jsonObject = response.data.filtered.data;

        // Get the underlying price
        const underlyingPrice = jsonObject[0].PE.underlyingValue || jsonObject[0].CE.underlyingValue;

        // Find the index of the closest strike price to the underlying value
        const closestIndex = jsonObject.reduce((prevIndex, current, index) => {
            return Math.abs(current.strikePrice - underlyingPrice) < Math.abs(jsonObject[prevIndex].strikePrice - underlyingPrice) ? index : prevIndex;
        }, 0);

        // Calculate the range for slicing
        const startIndex = Math.max(0, closestIndex - 10);
        const endIndex = Math.min(jsonObject.length, closestIndex + 11); // +11 to include the closest strike itself

        // Get the resulting data
        const result = jsonObject.slice(startIndex, endIndex);

        res.json({ underlyingPrice, result });
    } catch (error) {
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

module.exports = app;
