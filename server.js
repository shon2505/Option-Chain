require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { User, OptionChain } = require('./model');

const PORT = process.env.PORT || 3000;
const app = express();

const url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
};

const SECRET_KEY = process.env.JWT_SECRET;


mongoose.connect('mongodb://localhost:27017/optionChainDB');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page', 'home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page', 'signup.html'));
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (await User.findOne({ username })) {
        return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });

    res.redirect('/login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send('Invalid username or password');
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 3600000 });
    res.redirect('/');
});

app.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
});




app.get('/api/allData', async (req, res) => {
    try {
        const response = await axios.get(url, { headers: headers, timeout: 10000 });
        const jsonObject = response.data;
        res.json(jsonObject.filtered.data);
    } catch (e) {
        console.log(e);
    }
})
app.get('/api/v1/optionChain', authenticateToken, async (req, res) => {
    try {
        const response = await axios.get(url, { headers: headers, timeout: 10000 });
        const jsonObject = response.data;

        const data = jsonObject.records.data;
        const expiryDates = jsonObject.records.expiryDates;

        for (const ed of expiryDates) {
            const ocData = { expiryDate: ed, CE: [], PE: [] };

            data.forEach(item => {
                if (item.expiryDate === ed) {
                    if (item.CE) {
                        ocData.CE.push(formatOptionData(item.CE));
                    } else {
                        ocData.CE.push('-');
                    }

                    if (item.PE) {
                        ocData.PE.push(formatOptionData(item.PE));
                    } else {
                        ocData.PE.push('-');
                    }
                }
            });

            // await OptionChain.findOneAndUpdate(
            //     { expiryDate: ed },
            //     ocData,
            //     { upsert: true, new: true }
            // );
        }

        // res.json(await OptionChain.find({}));
        res.json(ocData);
    } catch (error) {
        res.status(500).send('Error fetching data: ' + error.message);
    }
});

function formatOptionData(option) {
    return {
        oi: option.openInterest || '-',
        chng_in_oi: option.changeinOpenInterest || '-',
        volume: option.totalTradedVolume || '-',
        iv: option.impliedVolatility || '-',
        ltp: option.lastPrice || '-',
        chng: option.change || '-',
        strike: option.strikePrice || '-'
    };
}

function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).send('Access denied');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = user;
        next();
    });
}

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
