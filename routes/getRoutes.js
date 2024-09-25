const express = require('express');
const app = express.Router();
const path = require('path');
const axios = require('axios');
const authenticateToken = require('./../middleware/authenticateToken');
const math = require('mathjs');

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

        const underlyingPrice = jsonObject[0].PE.underlyingValue || jsonObject[0].CE.underlyingValue;

        const closestIndex = jsonObject.reduce((prevIndex, current, index) => {
            return Math.abs(current.strikePrice - underlyingPrice) < Math.abs(jsonObject[prevIndex].strikePrice - underlyingPrice) ? index : prevIndex;
        }, 0);

        const startIndex = Math.max(0, closestIndex - 10);
        const endIndex = Math.min(jsonObject.length, closestIndex + 11);

        const result = jsonObject.slice(startIndex, endIndex);

        result.forEach(element => {
            const T = calculateTimeToExpiration(element.expiryDate);
            const callIV = element.CE.impliedVolatility; // Implied volatility for call
            const putIV = element.PE.impliedVolatility;  // Implied volatility for put

            const { deltaCall, thetaCall } = optionGreeks(
                underlyingPrice,
                element.strikePrice,
                T,
                0.065,
                callIV // Use call implied volatility
            );

            const { deltaPut, thetaPut } = optionGreeks(
                underlyingPrice,
                element.strikePrice,
                T,
                0.065,
                putIV // Use put implied volatility
            );

            element.CE.delta = deltaCall;
            element.CE.theta = thetaCall;
            element.PE.delta = deltaPut;
            element.PE.theta = thetaPut;
        });

        result.sort((a, b) => b.strikePrice - a.strikePrice);
        res.json(result);
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send('Error fetching data: ' + error.message);
    }
});



function cnd(x) {
    return (1.0 + math.erf(x / Math.SQRT2)) / 2.0;
}

// Greeks calculation for Delta and Theta
function optionGreeks(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + sigma ** 2 / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    // Delta calculations
    const delta = cnd(d1);

    // Theta calculations
    const theta = (
        -S * math.exp(-d1 * d1 / 2) * sigma / (2 * Math.sqrt(2 * Math.PI * T))
        - r * K * Math.exp(-r * T) * cnd(d2)
    );

    return { delta, theta };
}

function calculateTimeToExpiration(expiryDate) {
    const today = new Date(); // Get today's date
    const expiry = new Date(expiryDate); // Convert expiry date to Date object

    // Ensure the expiry date is valid
    if (isNaN(expiry)) {
        throw new Error('Invalid expiry date format');
    }

    const diffInMs = expiry - today;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    const T = diffInDays / 365;
    return T;
}

module.exports = app;
