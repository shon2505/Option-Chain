require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const getRoute = require('./routes/getRoutes');
const postRoute = require('./routes/postRoutes');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/', getRoute); // Handle GET requests
app.use('/', postRoute); // Handle POST requests

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
