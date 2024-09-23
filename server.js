require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const { OptionChain } = require('./mongoose/model');

const getRoute = require('./routes/getRoutes');
const postRoute = require('./routes/postRoutes');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', getRoute);
app.use('/', postRoute);

// Connect to MongoDB
mongoose.connect('mongodb+srv://ajinkya:optionchain@optionchain.y4jyr.mongodb.net/').then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


async function fetchAndStoreData() {
    try {
        //     const url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY';
        //     const headers = {
        //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        //     };

        //     const response = await axios.get(url, { headers: headers, timeout: 30000 });
        //     const data = response.data.filtered.data;


        //     if (!Array.isArray(data)) {
        //         throw new Error('Data is not an array');
        //     }

        //     data.forEach(async (entry) => {
        //         await OptionChain.create({
        //             expiryDate: entry.expiryDate,
        //             CE: entry.CE ? {
        //                 strikePrice: entry.CE.strikePrice,
        //                 expiryDate: entry.CE.expiryDate,
        //                 underlying: entry.CE.underlying,
        //                 identifier: entry.CE.identifier,
        //                 openInterest: entry.CE.openInterest,
        //                 changeinOpenInterest: entry.CE.changeinOpenInterest,
        //                 pchangeinOpenInterest: entry.CE.pchangeinOpenInterest,
        //                 totalTradedVolume: entry.CE.totalTradedVolume,
        //                 impliedVolatility: entry.CE.impliedVolatility,
        //                 lastPrice: entry.CE.lastPrice,
        //                 change: entry.CE.change,
        //                 pChange: entry.CE.pChange,
        //                 totalBuyQuantity: entry.CE.totalBuyQuantity,
        //                 totalSellQuantity: entry.CE.totalSellQuantity,
        //                 bidQty: entry.CE.bidQty,
        //                 bidprice: entry.CE.bidprice,
        //                 askQty: entry.CE.askQty,
        //                 askPrice: entry.CE.askPrice,
        //                 underlyingValue: entry.CE.underlyingValue
        //             } : {},
        //             PE: entry.PE ? {
        //                 strikePrice: entry.PE.strikePrice,
        //                 expiryDate: entry.PE.expiryDate,
        //                 underlying: entry.PE.underlying,
        //                 identifier: entry.PE.identifier,
        //                 openInterest: entry.PE.openInterest,
        //                 changeinOpenInterest: entry.PE.changeinOpenInterest,
        //                 pchangeinOpenInterest: entry.PE.pchangeinOpenInterest,
        //                 totalTradedVolume: entry.PE.totalTradedVolume,
        //                 impliedVolatility: entry.PE.impliedVolatility,
        //                 lastPrice: entry.PE.lastPrice,
        //                 change: entry.PE.change,
        //                 pChange: entry.PE.pChange,
        //                 totalBuyQuantity: entry.PE.totalBuyQuantity,
        //                 totalSellQuantity: entry.PE.totalSellQuantity,
        //                 bidQty: entry.PE.bidQty,
        //                 bidprice: entry.PE.bidprice,
        //                 askQty: entry.PE.askQty,
        //                 askPrice: entry.PE.askPrice,
        //                 underlyingValue: entry.PE.underlyingValue
        //             } : {}
        //         });
        //     });

        //     console.log('Data fetched and stored successfully');


    } catch (error) {
        console.error('Error fetching and storing data:', error);
    }
}



// Fetch and store data every 1 minutes 
setInterval(fetchAndStoreData, 60000);
fetchAndStoreData();


app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
