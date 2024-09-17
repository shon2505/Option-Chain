const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).send('Access denied');

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = user;
        next();
    });
}
module.exports = authenticateToken; 