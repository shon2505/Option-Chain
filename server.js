require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const app = express();

const url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
};

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page', 'home.html'));
});


app.get('/api/v1/optionChain', async (req, res) => {

    try {
        const response = await axios.get(url, { headers: headers, timeout: 10000 });
        const jsonObject = response.data;


        const data = jsonObject.records.data;
        const expiryDates = jsonObject.records.expiryDates;

        const ocData = {};
        expiryDates.forEach(ed => {
            ocData[ed] = { CE: [], PE: [] };

            data.forEach(item => {
                if (item.expiryDate === ed) {
                    if (item.CE && item.CE.expiryDate === ed) {
                        ocData[ed]["CE"].push(formatOptionData(item.CE));
                    } else {
                        ocData[ed]["CE"].push('-');
                    }

                    if (item.PE && item.PE.expiryDate === ed) {
                        ocData[ed]["PE"].push(formatOptionData(item.PE));
                    } else {
                        ocData[ed]["PE"].push('-');
                    }
                }
            });
        });


        fs.writeFileSync('OC.json', JSON.stringify(ocData, null, 2));


        res.json(ocData);
        // res.json(jsonObject);
    } catch (error) {
        res.status(500).send('Error fetching data: ' + error.message);
    }
});


function formatOptionData(option) {
    return {
        OI: option.openInterest || '-',
        chng_in_OI: option.changeinOpenInterest || '-',
        volume: option.totalTradedVolume || '-',
        iv: option.impliedVolatility || '-',
        ltp: option.lastPrice || '-',
        chng: option.change || '-',
        strike: option.strikePrice || '-'
    };
}

app.listen(PORT, () => {
    console.log(`Server Started On http://localhost:${PORT}`);
});


