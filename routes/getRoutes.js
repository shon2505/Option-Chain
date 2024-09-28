const express = require('express');
const app = express.Router();
const path = require('path');
const axios = require('axios');
const authenticateToken = require('./../middleware/authenticateToken');
const math = require('mathjs');
const moment = require('moment');

const url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
};

// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'page', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'page', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'page', 'signup.html'));
});

// Endpoint to get option chain data
app.get('/api/v1/optionChain', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(url, { headers: headers, timeout: 30000 });
        const jsonObject = response.data.filtered.data;

        let underlyingPrice = jsonObject[0].PE.underlyingValue || jsonObject[0].CE.underlyingValue;

        let closestIndex = 0;
        for (let i = 1; i < jsonObject.length; i++) {
            if (Math.abs(jsonObject[i].strikePrice - underlyingPrice) < Math.abs(jsonObject[closestIndex].strikePrice - underlyingPrice)) {
                closestIndex = i;
            }
        }

        let startIndex = Math.max(0, closestIndex - 10);
        let endIndex = Math.min(jsonObject.length, closestIndex + 10);
        let result = jsonObject.slice(startIndex, endIndex + 1);

        result.forEach(element => {
            const impliedVolatilityCE = newtonRaphsonIV(underlyingPrice, element.strikePrice, element.expiryDate, element.CE.lastPrice);
            const impliedVolatilityPE = newtonRaphsonIV(underlyingPrice, element.strikePrice, element.expiryDate, element.PE.lastPrice);

            const today = moment();
            const expiryDate = moment(element.expiryDate, 'DD-MMM-YYYY');
            const T = expiryDate.diff(today, 'days') / 365;
            const r = 0.065;

            const deltaCE = blackScholesDelta(underlyingPrice, element.strikePrice, T, r, impliedVolatilityCE);
            const deltaPE = blackScholesDelta(underlyingPrice, element.strikePrice, T, r, impliedVolatilityPE);

            const thetaCE = blackScholesTheta(underlyingPrice, element.strikePrice, T, r, impliedVolatilityCE);
            const thetaPE = blackScholesTheta(underlyingPrice, element.strikePrice, T, r, impliedVolatilityPE);

            element.CE.impliedVolatilityCE = impliedVolatilityCE;
            element.PE.impliedVolatilityPE = impliedVolatilityPE;

            element.CE.deltaCE = deltaCE;
            element.PE.deltaPE = deltaPE;

            element.CE.thetaCE = thetaCE;
            element.PE.thetaPE = thetaPE;
        });

        result.sort((a, b) => b.strikePrice - a.strikePrice);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

// Black-Scholes Delta
function blackScholesDelta(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + (sigma ** 2) / 2) * T) / (sigma * Math.sqrt(T));
    return cdf(d1);
}

// Black-Scholes Theta
function blackScholesTheta(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + (sigma ** 2) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const callTheta = (-S * pdf(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * cdf(d2));
    return callTheta;
}

// Cumulative distribution function
function cdf(x) {
    return (1 + math.erf(x / Math.sqrt(2))) / 2;
}

// Probability density function
function pdf(x) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

// Newton-Raphson method for implied volatility
function newtonRaphsonIV(S, K, expiryDateStr, marketPrice, tolerance = 1e-8, maxIterations = 100) {
    const today = moment();
    const expiryDate = moment(expiryDateStr, 'DD-MMM-YYYY');
    const T = expiryDate.diff(today, 'days') / 365;
    const r = 0.065;
    let sigma = 0.2;

    for (let i = 0; i < maxIterations; i++) {
        const price = blackScholesCall(S, K, T, r, sigma);
        const priceDiff = price - marketPrice;

        if (Math.abs(priceDiff) < tolerance) {
            return sigma;
        }

        const vegaVal = vega(S, K, T, r, sigma);
        sigma -= priceDiff / vegaVal;
    }

    return null;
}

// Black-Scholes Call option price
function blackScholesCall(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + (sigma ** 2) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    const callPrice = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
    return callPrice;
}

// Vega calculation
function vega(S, K, T, r, sigma) {
    const d1 = (Math.log(S / K) + (r + (sigma ** 2) / 2) * T) / (sigma * Math.sqrt(T));
    return S * Math.sqrt(T) * pdf(d1);
}

module.exports = app;
