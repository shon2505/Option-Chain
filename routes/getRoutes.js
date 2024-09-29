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
            const today = moment();
            const expiryDate = moment(element.expiryDate, 'DD-MMM-YYYY');
            const TimeToMaturity = ((expiryDate.diff(today, 'days') + 1) / 365);  // Time to expiry calculation with +1 adjustment
            const r = 0.065;
            const dividendYield = 0; // Example, modify as necessary

            // Calculate IV for Call and Put using the Newton-Raphson method
            const IVCall = calculateImpliedVolatility(underlyingPrice, element.strikePrice, element.expiryDate, element.CE.lastPrice, true);
            const IVPut = calculateImpliedVolatility(underlyingPrice, element.strikePrice, element.expiryDate, element.PE.lastPrice, false);

            // Use the calculated IV to compute Delta and Theta for Calls and Puts
            const deltaCE = callDelta(underlyingPrice, element.strikePrice, r, TimeToMaturity, IVCall, dividendYield);
            const deltaPE = putDelta(underlyingPrice, element.strikePrice, r, TimeToMaturity, IVPut, dividendYield);

            const thetaCE = callTheta(underlyingPrice, element.strikePrice, r, TimeToMaturity, IVCall, dividendYield);
            const thetaPE = putTheta(underlyingPrice, element.strikePrice, r, TimeToMaturity, IVPut, dividendYield);

            element.CE.impliedVolatilityCE = IVCall === "-" ? "-" : IVCall.toFixed(4);
            element.PE.impliedVolatilityPE = IVPut === "-" ? "-" : IVPut.toFixed(4);

            element.CE.deltaCE = deltaCE.toFixed(4);
            element.PE.deltaPE = deltaPE.toFixed(4);

            element.CE.thetaCE = thetaCE.toFixed(4);
            element.PE.thetaPE = thetaPE.toFixed(4);

            element.CE.ReversalCE = calculateReversal(underlyingPrice, element.strikePrice, IVCall, IVPut, deltaCE, deltaPE, thetaCE, thetaPE);
            element.PE.ReversalPE = calculateReversal(underlyingPrice, element.strikePrice, IVCall, IVPut, deltaCE, deltaPE, thetaCE, thetaPE);
        });

        result.sort((a, b) => b.strikePrice - a.strikePrice);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

// Refined Newton-Raphson method for implied volatility
function calculateImpliedVolatility(SpotPrice, StrikePrice, expiryDateStr, OptionPrice, IsCall, tolerance = 0.0001, maxIterations = 100) {
    const today = moment();
    const expiryDate = moment(expiryDateStr, 'DD-MMM-YYYY');
    const TimeToMaturity = (expiryDate.diff(today, 'days') + 1) / 365;  // Adjusted time to expiry
    const RiskFreeRate = 0.065;  // Risk-Free Rate

    let IVGuess = 0.1;  // Initial guess for IV, reduced to prevent overshooting
    const MaxIV = 2;    // Adjust the maximum IV to limit runaway values

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Calculate option price with the current guess of IV
        const OptionModelPrice = blackScholesPrice(SpotPrice, StrikePrice, TimeToMaturity, IVGuess, RiskFreeRate, IsCall);

        // Calculate Vega
        const Vega = optionVega(SpotPrice, StrikePrice, TimeToMaturity, IVGuess, RiskFreeRate);

        // If Vega is too small, we avoid adjusting the IV too much
        if (Vega < 1e-8) {
            return IVGuess;  // Converged to a small value, exit early
        }

        // Difference between the market price and the model price
        const PriceDiff = OptionModelPrice - OptionPrice;

        // If the price difference is within tolerance, exit the loop
        if (Math.abs(PriceDiff) < tolerance) {
            return IVGuess;  // IV has converged
        }

        // Update the guess using the Newton-Raphson method
        IVGuess -= PriceDiff / Vega;

        // Prevent runaway IV values
        if (IVGuess > MaxIV || IVGuess < 0) {
            return "-";  // Indicate an invalid IV
        }
    }

    return IVGuess;  // Return the final calculated IV
}

// Function to calculate the Black-Scholes option price
function blackScholesPrice(SpotPrice, StrikePrice, TimeToMaturity, Volatility, RiskFreeRate, IsCall) {
    const d1 = (Math.log(SpotPrice / StrikePrice) + (RiskFreeRate + 0.5 * Math.pow(Volatility, 2)) * TimeToMaturity) / (Volatility * Math.sqrt(TimeToMaturity));
    const d2 = d1 - Volatility * Math.sqrt(TimeToMaturity);

    if (IsCall) {
        return SpotPrice * cdf(d1) - StrikePrice * Math.exp(-RiskFreeRate * TimeToMaturity) * cdf(d2);
    } else {
        return StrikePrice * Math.exp(-RiskFreeRate * TimeToMaturity) * cdf(-d2) - SpotPrice * cdf(-d1);
    }
}

// Function to calculate the Vega of an option
function optionVega(SpotPrice, StrikePrice, TimeToMaturity, Volatility, RiskFreeRate) {
    const d1 = (Math.log(SpotPrice / StrikePrice) + (RiskFreeRate + 0.5 * Math.pow(Volatility, 2)) * TimeToMaturity) / (Volatility * Math.sqrt(TimeToMaturity));
    return SpotPrice * pdf(d1) * Math.sqrt(TimeToMaturity);
}

// Call Delta calculation
function callDelta(SpotPrice, StrikePrice, RiskFreeRate, TimeToMaturity, Volatility, DividendYield = 0) {
    const d1 = (Math.log(SpotPrice / StrikePrice) + (RiskFreeRate - DividendYield + 0.5 * Math.pow(Volatility, 2)) * TimeToMaturity) / (Volatility * Math.sqrt(TimeToMaturity));
    return Math.exp(-DividendYield * TimeToMaturity) * cdf(d1);
}

// Put Delta calculation
function putDelta(SpotPrice, StrikePrice, RiskFreeRate, TimeToMaturity, Volatility, DividendYield = 0) {
    return callDelta(SpotPrice, StrikePrice, RiskFreeRate, TimeToMaturity, Volatility, DividendYield) - 1;
}

// Call Theta calculation
function callTheta(SpotPrice, StrikePrice, RiskFreeRate, TimeToMaturity, Volatility, DividendYield = 0) {
    const d1 = (Math.log(SpotPrice / StrikePrice) + (RiskFreeRate - DividendYield + 0.5 * Math.pow(Volatility, 2)) * TimeToMaturity) / (Volatility * Math.sqrt(TimeToMaturity));
    const d2 = d1 - Volatility * Math.sqrt(TimeToMaturity);

    // Black-Scholes Theta formula
    const term1 = -(SpotPrice * Math.exp(-DividendYield * TimeToMaturity) * pdf(d1) * Volatility) / (2 * Math.sqrt(TimeToMaturity));
    const term2 = RiskFreeRate * StrikePrice * Math.exp(-RiskFreeRate * TimeToMaturity) * cdf(d2);
    
    // Divide by 365 to match the daily Theta output
    const thetaCall = (term1 - term2) / 365;
    return thetaCall;
}

// Put Theta calculation
function putTheta(SpotPrice, StrikePrice, RiskFreeRate, TimeToMaturity, Volatility, DividendYield = 0) {
    const d1 = (Math.log(SpotPrice / StrikePrice) + (RiskFreeRate - DividendYield + 0.5 * Math.pow(Volatility, 2)) * TimeToMaturity) / (Volatility * Math.sqrt(TimeToMaturity));
    const d2 = d1 - Volatility * Math.sqrt(TimeToMaturity);

    // Black-Scholes Theta formula
    const term1 = -(SpotPrice * Math.exp(-DividendYield * TimeToMaturity) * pdf(d1) * Volatility) / (2 * Math.sqrt(TimeToMaturity));
    const term2 = RiskFreeRate * StrikePrice * Math.exp(-RiskFreeRate * TimeToMaturity) * cdf(-d2);
    
    // Divide by 365 to match the daily Theta output
    const thetaPut = (term1 + term2) / 365;
    return thetaPut;
}

// Calculate Call & PUt  Reversal values
function calculateReversal(spotPrice, strikePrice, callIV, putIV, callDelta, putDelta, callTheta, putTheta) {
    let callReversal, putReversal;

    // Calculate Call Reversal when Strike Price > Spot Price, otherwise Breakout
    if (strikePrice > spotPrice) {
        callReversal = strikePrice + (((callIV + putIV) * 100) * (callDelta - putDelta) + callTheta);
    } else {
        callReversal = "Breakout";
    }

    // Calculate Put Reversal when Strike Price < Spot Price, otherwise Breakdown
    if (strikePrice < spotPrice) {
        putReversal = strikePrice + (((callIV + putIV) * 100) * (callDelta - putDelta) + putTheta);
    } else {
        putReversal = "Breakdown";
    }

    return {
        callReversal,
        putReversal
    };
}


// Cumulative distribution function (CDF)
function cdf(x) {
    return (1 + math.erf(x / Math.sqrt(2))) / 2;
}

// Probability density function (PDF)
function pdf(x) {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

module.exports = app;
