const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
});

const User = mongoose.model('User', userSchema);

const optionChainSchema = new mongoose.Schema({
    expiryDate: { type: String },
    CE: {
        strikePrice: { type: Number },
        expiryDate: { type: String },
        underlying: { type: String },
        identifier: { type: String },
        openInterest: { type: Number },
        changeinOpenInterest: { type: Number },
        pchangeinOpenInterest: { type: Number },
        totalTradedVolume: { type: Number },
        impliedVolatility: { type: Number },
        lastPrice: { type: Number },
        change: { type: Number },
        pChange: { type: Number },
        totalBuyQuantity: { type: Number },
        totalSellQuantity: { type: Number },
        bidQty: { type: Number },
        bidprice: { type: Number },
        askQty: { type: Number },
        askPrice: { type: Number },
        underlyingValue: { type: Number }
    },
    PE: {
        strikePrice: { type: Number },
        expiryDate: { type: String },
        underlying: { type: String },
        identifier: { type: String },
        openInterest: { type: Number },
        changeinOpenInterest: { type: Number },
        pchangeinOpenInterest: { type: Number },
        totalTradedVolume: { type: Number },
        impliedVolatility: { type: Number },
        lastPrice: { type: Number },
        change: { type: Number },
        pChange: { type: Number },
        totalBuyQuantity: { type: Number },
        totalSellQuantity: { type: Number },
        bidQty: { type: Number },
        bidprice: { type: Number },
        askQty: { type: Number },
        askPrice: { type: Number },
        underlyingValue: { type: Number }
    }
});

const OptionChain = mongoose.model('OptionChain', optionChainSchema);

module.exports = { User, OptionChain };
