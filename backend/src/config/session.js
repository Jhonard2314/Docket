const session = require('express-session');
require('dotenv').config();

/**
 * Express-session configuration.
 * Keeps session data server-side; only a signed cookie is sent to the browser.
 */
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'changeme_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
});

module.exports = sessionConfig;
