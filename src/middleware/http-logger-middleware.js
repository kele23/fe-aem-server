const morgan = require('morgan');
const Logger = require('../utils/logger');

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream = {
    // Use the http severity
    write: (message) => {
        Logger.http(message.trim());
    },
};

// Build the morgan middleware
const httpLoggerMiddleware = morgan(
    // Define message format string (this is the default one).
    // The message format is made from tokens, and each token is
    // defined inside the Morgan library.
    // You can create your custom token to show what do you want from a request.
    ':method :url :status :res[content-length] - :response-time ms',
    // Options: in this case, I overwrote the stream and the skip logic.
    // See the methods above.
    { stream }
);

module.exports = httpLoggerMiddleware;
