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

            if (T <= 0 || underlyingPrice <= 0 || element.strikePrice <= 0) {
                console.warn(`Invalid parameters: T = ${T}, Underlying Price = ${underlyingPrice}, Strike Price = ${element.strikePrice}`);
                element.CE.impliedVolatility = 0.2; // Fallback
                element.PE.impliedVolatility = 0.2; // Fallback
                return;
            }

            const callPrice = blackScholesCall(underlyingPrice, element.strikePrice, T, 0.065, 0.2); // Using a default sigma
            const putPrice = blackScholesPut(underlyingPrice, element.strikePrice, T, 0.065, 0.2); // Using a default sigma

            const callIV = impliedVolatility(underlyingPrice, element.strikePrice, T, 0.065, callPrice);
            const putIV = impliedVolatility(underlyingPrice, element.strikePrice, T, 0.065, putPrice);

            const { delta: deltaCall, theta: thetaCall } = optionGreeks(
                underlyingPrice,
                element.strikePrice,
                T,
                0.065,
                callIV
            );

            const { delta: deltaPut, theta: thetaPut } = optionGreeks(
                underlyingPrice,
                element.strikePrice,
                T,
                0.065,
                putIV
            );

            element.CE.delta = deltaCall;
            element.CE.theta = thetaCall;
            element.PE.delta = deltaPut;
            element.PE.theta = thetaPut;
            element.CE.impliedVolatility = callIV; // Store call IV
            element.PE.impliedVolatility = putIV;   // Store put IV
        });

        result.sort((a, b) => b.strikePrice - a.strikePrice);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

function cnd(x) {
    return (1.0 + math.erf(x / Math.SQRT2)) / 2.0;
}

function blackScholesCall(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return S * cnd(d1) - K * Math.exp(-r * T) * cnd(d2);
}

function blackScholesPut(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return K * Math.exp(-r * T) * cnd(-d2) - S * cnd(-d1);
}

function impliedVolatility(S, K, T, r, marketPrice) {
    const maxIterations = 100;
    const tolerance = 1e-5;
    let sigma = 0.2; // Initial guess for volatility

    for (let i = 0; i < maxIterations; i++) {
        const price = blackScholesCall(S, K, T, r, sigma);
        const vega = blackScholesVega(S, K, T, r, sigma);
        const diff = marketPrice - price;

        console.log(`Iteration ${i}: sigma = ${sigma}, price = ${price}, marketPrice = ${marketPrice}, diff = ${diff}, vega = ${vega}`);

        if (Math.abs(diff) < tolerance) {
            return sigma; // Found the implied volatility
        }

        if (vega <= 0) {
            console.warn(`Vega is non-positive at iteration ${i}. Current sigma: ${sigma}`);
            break; // Vega is non-positive, cannot continue
        }

        sigma += diff / vega; // Newton-Raphson update
    }

    throw new Error(`Implied volatility not found within max iterations. Last sigma: ${sigma}`);
}

function blackScholesVega(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    return S * normPdf(d1) * Math.sqrt(T);
}

function normPdf(x) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

function optionGreeks(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + sigma ** 2 / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const delta = cnd(d1);
    const theta = (
        -S * normPdf(d1) * sigma / (2 * Math.sqrt(2 * Math.PI * T))
        - r * K * Math.exp(-r * T) * cnd(d2)
    );

    return { delta, theta };
}

function calculateTimeToExpiration(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);

    if (isNaN(expiry)) {
        throw new Error('Invalid expiry date format');
    }

    const diffInMs = expiry - today;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    const T = diffInDays / 365;
    return T;
}

module.exports = app;
