require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
let optionsData = generateDemoData();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page', 'home.html'));
});

// API endpoint for option chain data
app.get('/api/v1/optionChain', (req, res) => {
    res.send(optionsData);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server Started On http://localhost:${PORT}`);
});

// Function to generate random demo data
function generateDemoData() {
    function randomValue(base, variance) {
        return base + (Math.random() - 0.5) * variance;
    }

    return [
        {
            oi: Math.floor(randomValue(1200, 100)),
            chng_in_oi: Math.floor(randomValue(100, 50)).toString(),
            volume: Math.floor(randomValue(150, 30)),
            iv: randomValue(0.2, 0.05).toFixed(2),
            ltp: randomValue(2.5, 0.5).toFixed(2),
            chng: randomValue(0.1, 0.05).toString(),
            strike: 100
        },
        {
            oi: Math.floor(randomValue(800, 50)),
            chng_in_oi: Math.floor(randomValue(-50, 30)).toString(),
            volume: Math.floor(randomValue(120, 20)),
            iv: randomValue(0.25, 0.05).toFixed(2),
            ltp: randomValue(1.8, 0.4).toFixed(2),
            chng: randomValue(-0.2, 0.1).toString(),
            strike: 105
        },
        {
            oi: Math.floor(randomValue(600, 70)),
            chng_in_oi: Math.floor(randomValue(70, 30)).toString(),
            volume: Math.floor(randomValue(90, 20)),
            iv: randomValue(0.3, 0.05).toFixed(2),
            ltp: randomValue(1.2, 0.3).toFixed(2),
            chng: randomValue(0.05, 0.02).toString(),
            strike: 110
        }
    ];
}

// Update options data every second
setInterval(() => {
    optionsData = generateDemoData();
    console.log("Updated options data");
}, 1000);
