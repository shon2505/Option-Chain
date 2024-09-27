const express = require('express');
const app = express.Router();
const path = require('path');
const axios = require('axios');
const authenticateToken = require('./../middleware/authenticateToken');
const math = require('mathjs');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });



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

// Example usage inside your main option chain processing code
app.get('/api/v1/optionChain', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(url, { headers: headers, timeout: 10000 });
        // const response = await axios.get(url, { headers: headers, timeout: 30000, httpsAgent: agent });
        const jsonObject = response.data.filtered.data;

        const underlyingPrice = jsonObject[0].PE.underlyingValue || jsonObject[0].CE.underlyingValue;
        const closestIndex = jsonObject.reduce((prevIndex, current, index) => {
            return Math.abs(current.strikePrice - underlyingPrice) < Math.abs(jsonObject[prevIndex].strikePrice - underlyingPrice) ? index : prevIndex;
        }, 0);

        const startIndex = Math.max(0, closestIndex - 10);
        const endIndex = Math.min(jsonObject.length, closestIndex + 11);
        const result = jsonObject.slice(startIndex, endIndex);

        result.forEach(element => {
            try {
                const T = calculateTimeToExpiration(element.expiryDate); // Calculate time to expiration
                const strikePrice = element.strikePrice;

                if (T <= 0 || underlyingPrice <= 0 || strikePrice <= 0) {
                    // console.warn(`Invalid parameters: T = ${T}, Underlying Price = ${underlyingPrice}, Strike Price = ${strikePrice}`);
                    element.CE.impliedVolatility = null;
                    element.PE.impliedVolatility = null;
                    return;
                }

                // Extract market prices for call and put options
                const callMarketPrice = element.CE.lastPrice;
                const putMarketPrice = element.PE.lastPrice;

                if (callMarketPrice <= 0 || putMarketPrice <= 0) {
                    console.warn(`Invalid market price for strike ${strikePrice}`);
                    element.CE.impliedVolatility = null;
                    element.PE.impliedVolatility = null;
                    return;
                }

                // Calculate implied volatility for call and put options
                const callIV = impliedVolatility(underlyingPrice, strikePrice, T, 0.065, callMarketPrice);
                const putIV = impliedVolatility(underlyingPrice, strikePrice, T, 0.065, putMarketPrice);

                // Calculate Greeks (delta, theta) for call and put options using the calculated IV
                const { delta: deltaCall, theta: thetaCall } = optionGreeks(underlyingPrice, strikePrice, T, 0.065, callIV);
                const { delta: deltaPut, theta: thetaPut } = optionGreeks(underlyingPrice, strikePrice, T, 0.065, putIV);

                // Update the result with calculated values
                element.CE.delta = deltaCall;
                element.CE.theta = thetaCall;
                element.PE.delta = deltaPut;
                element.PE.theta = thetaPut;
                element.CE.impliedVolatility = callIV; // Store calculated IV for call
                element.PE.impliedVolatility = putIV;  // Store calculated IV for put

            } catch (error) {
                console.error(`Error calculating implied volatility for strike ${element.strikePrice}: ${error.message}`);
                element.CE.impliedVolatility = null;
                element.PE.impliedVolatility = null;
            }
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

// Function to calculate the implied volatility using Newton-Raphson method
function impliedVolatility(S, K, T, r, marketPrice) {
    let sigma = 0.2;  // Reasonable starting guess for sigma (20% implied volatility)
    const MAX_ITERATIONS = 100;
    const TOLERANCE = 1e-5;  // Small tolerance value for convergence
    const MAX_SIGMA = 5.0;  // Max allowable sigma (500%)
    const MIN_SIGMA = 1e-6;  // Small lower bound to avoid zero or negative volatility

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const price = blackScholesCall(S, K, T, r, sigma); // Option price using Black-Scholes model
        const vega = blackScholesVega(S, K, T, r, sigma);  // Option vega (sensitivity to volatility)
        const diff = price - marketPrice;  // Difference between the calculated price and market price

        // console.log(`Iteration ${i}: sigma = ${sigma}, price = ${price}, marketPrice = ${marketPrice}, diff = ${diff}, vega = ${vega}`);

        // If the difference is within the acceptable tolerance, we consider it converged
        if (Math.abs(diff) < TOLERANCE) return sigma;

        // If vega is too small (close to 0), we can't continue as division by vega would be unstable
        if (vega < TOLERANCE) {
            // console.warn(`Vega is too small at iteration ${i}, sigma = ${sigma}. Cannot continue with volatility calculation.`);
            break;
        }

        // Update sigma using the Newton-Raphson method
        sigma -= diff / vega;

        // Cap sigma within reasonable bounds to avoid runaway values
        if (sigma > MAX_SIGMA) {
            // console.warn(`Sigma exceeded max allowable value (${MAX_SIGMA}) at iteration ${i}. Returning max sigma.`);
            return MAX_SIGMA;
        }

        if (sigma < MIN_SIGMA) {
            // console.warn(`Sigma fell below min allowable value (${MIN_SIGMA}) at iteration ${i}. Returning min sigma.`);
            return MIN_SIGMA;
        }
    }

    // If we reach the maximum number of iterations without converging, throw an error or return a default value
    // console.error(`Failed to converge after ${MAX_ITERATIONS} iterations. Last sigma value: ${sigma}`);
    return sigma;  // Return the last sigma value (could also return a default value like null)
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
