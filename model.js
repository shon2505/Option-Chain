const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/optionChainDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Define Option Chain Schema
const optionChainSchema = new mongoose.Schema({
    expiryDate: String,
    CE: [
        {
            oi: Number,
            chng_in_oi: Number,
            volume: Number,
            iv: Number,
            ltp: Number,
            chng: Number,
            strike: Number
        }
    ],
    PE: [
        {
            oi: Number,
            chng_in_oi: Number,
            volume: Number,
            iv: Number,
            ltp: Number,
            chng: Number,
            strike: Number
        }
    ]
});

const OptionChain = mongoose.model('OptionChain', optionChainSchema);

module.exports = { User, OptionChain };
